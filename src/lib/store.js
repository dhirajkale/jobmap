import { create } from 'zustand'
import { supabase } from './supabase'

// Main Application Store
export const useStore = create((set, get) => ({
    // Theme
    theme: typeof window !== 'undefined'
        ? localStorage.getItem('theme') || 'light'
        : 'light',
    setTheme: (theme) => {
        localStorage.setItem('theme', theme)
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
    },
    toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light'
        get().setTheme(newTheme)
    },

    // User Authentication
    user: null,
    profile: null,
    isLoading: false,
    authLoading: true,

    setUser: (user) => set({ user }),
    setProfile: (profile) => set({ profile }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setAuthLoading: (authLoading) => set({ authLoading }),

    // Initialize auth
    initAuth: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                set({ user: session.user })
                // Fetch profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()
                if (profile) {
                    set({ profile })
                }
            }
        } catch (error) {
            console.error('Auth init error:', error)
        } finally {
            set({ authLoading: false })
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            set({ user: session?.user || null })
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()
                set({ profile: profile || null })
            } else {
                set({ profile: null })
            }
        })
    },

    signIn: async (email, password) => {
        set({ isLoading: true })
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        set({ isLoading: false })
        return { data, error }
    },

    signUp: async (email, password, fullName) => {
        set({ isLoading: true })
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }
            }
        })
        set({ isLoading: false })
        return { data, error }
    },

    signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null, savedJobs: [], appliedJobs: [] })
    },

    // Jobs
    jobs: [],
    filteredJobs: [],
    selectedJob: null,
    jobsLoading: true,

    setJobs: (jobs) => set({ jobs, filteredJobs: jobs }),
    setFilteredJobs: (filteredJobs) => set({ filteredJobs }),
    setSelectedJob: (selectedJob) => set({ selectedJob }),
    setJobsLoading: (jobsLoading) => set({ jobsLoading }),

    fetchJobs: async () => {
        set({ jobsLoading: true })
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('is_approved', true)
                .order('posted_date', { ascending: false })

            if (error) throw error
            set({ jobs: data || [], filteredJobs: data || [] })
        } catch (error) {
            console.error('Error fetching jobs:', error)
            // Use mock data if Supabase fails
            set({ jobs: get().mockJobs, filteredJobs: get().mockJobs })
        } finally {
            set({ jobsLoading: false })
        }
    },

    // Filters
    filters: {
        search: '',
        remoteTypes: ['remote', 'hybrid', 'office'],
        salaryMin: 0,
        salaryMax: 500000,
        industries: [],
        experienceLevels: [],
        radius: 0, // 0 means no radius filter
        centerLat: null,
        centerLng: null,
    },

    setFilters: (newFilters) => {
        const filters = { ...get().filters, ...newFilters }
        set({ filters })
        get().applyFilters()
    },

    resetFilters: () => {
        set({
            filters: {
                search: '',
                remoteTypes: ['remote', 'hybrid', 'office'],
                salaryMin: 0,
                salaryMax: 500000,
                industries: [],
                experienceLevels: [],
                radius: 0,
                centerLat: null,
                centerLng: null,
            }
        })
        set({ filteredJobs: get().jobs })
    },

    applyFilters: () => {
        const { jobs, filters } = get()
        let filtered = [...jobs]

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase()
            filtered = filtered.filter(job =>
                job.company.toLowerCase().includes(searchLower) ||
                job.title.toLowerCase().includes(searchLower) ||
                (job.description && job.description.toLowerCase().includes(searchLower))
            )
        }

        // Remote type filter
        if (filters.remoteTypes.length > 0 && filters.remoteTypes.length < 3) {
            filtered = filtered.filter(job => filters.remoteTypes.includes(job.remote_type))
        }

        // Salary filter
        filtered = filtered.filter(job => {
            const salary = job.salary_max || job.salary_min || 0
            return salary >= filters.salaryMin && salary <= filters.salaryMax
        })

        // Industry filter
        if (filters.industries.length > 0) {
            filtered = filtered.filter(job => filters.industries.includes(job.industry))
        }

        // Experience level filter
        if (filters.experienceLevels.length > 0) {
            filtered = filtered.filter(job => filters.experienceLevels.includes(job.experience_level))
        }

        // Radius filter (in km)
        if (filters.radius > 0 && filters.centerLat && filters.centerLng) {
            filtered = filtered.filter(job => {
                const distance = calculateDistance(
                    filters.centerLat,
                    filters.centerLng,
                    job.location_lat,
                    job.location_lng
                )
                return distance <= filters.radius
            })
        }

        set({ filteredJobs: filtered })
    },

    // Saved Jobs
    savedJobs: [],
    appliedJobs: [],

    setSavedJobs: (savedJobs) => set({ savedJobs }),
    setAppliedJobs: (appliedJobs) => set({ appliedJobs }),

    fetchUserJobs: async () => {
        const user = get().user
        if (!user) return

        try {
            const { data, error } = await supabase
                .from('saved_jobs')
                .select('*, jobs(*)')
                .eq('user_id', user.id)

            if (error) throw error

            const saved = data?.filter(j => j.status === 'saved').map(j => ({ ...j.jobs, savedId: j.id })) || []
            const applied = data?.filter(j => ['applied', 'interviewing', 'offered', 'rejected'].includes(j.status))
                .map(j => ({ ...j.jobs, savedId: j.id, applicationStatus: j.status, notes: j.notes })) || []

            set({ savedJobs: saved, appliedJobs: applied })
        } catch (error) {
            console.error('Error fetching user jobs:', error)
        }
    },

    saveJob: async (jobId) => {
        const user = get().user
        if (!user) return { error: 'Not authenticated' }

        try {
            const { data, error } = await supabase
                .from('saved_jobs')
                .insert({ user_id: user.id, job_id: jobId, status: 'saved' })
                .select()

            if (error) throw error
            await get().fetchUserJobs()
            return { data }
        } catch (error) {
            console.error('Error saving job:', error)
            return { error }
        }
    },

    unsaveJob: async (jobId) => {
        const user = get().user
        if (!user) return { error: 'Not authenticated' }

        try {
            const { error } = await supabase
                .from('saved_jobs')
                .delete()
                .eq('user_id', user.id)
                .eq('job_id', jobId)

            if (error) throw error
            await get().fetchUserJobs()
            return { success: true }
        } catch (error) {
            console.error('Error unsaving job:', error)
            return { error }
        }
    },

    markApplied: async (jobId, notes = '') => {
        const user = get().user
        if (!user) return { error: 'Not authenticated' }

        try {
            const { data, error } = await supabase
                .from('saved_jobs')
                .upsert({
                    user_id: user.id,
                    job_id: jobId,
                    status: 'applied',
                    notes,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,job_id'
                })
                .select()

            if (error) throw error
            await get().fetchUserJobs()
            return { data }
        } catch (error) {
            console.error('Error marking applied:', error)
            return { error }
        }
    },

    updateJobStatus: async (jobId, status, notes = '') => {
        const user = get().user
        if (!user) return { error: 'Not authenticated' }

        try {
            const { data, error } = await supabase
                .from('saved_jobs')
                .update({ status, notes, updated_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .eq('job_id', jobId)
                .select()

            if (error) throw error
            await get().fetchUserJobs()
            return { data }
        } catch (error) {
            console.error('Error updating job status:', error)
            return { error }
        }
    },

    // Map state
    mapCenter: [20.5937, 78.9629], // India center
    mapZoom: 4,
    setMapCenter: (mapCenter) => set({ mapCenter }),
    setMapZoom: (mapZoom) => set({ mapZoom }),

    // UI State
    sidebarOpen: typeof window !== 'undefined' ? window.innerWidth > 768 : true,
    mobileSheetOpen: false,
    authModalOpen: false,
    suggestionModalOpen: false,

    setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    setMobileSheetOpen: (mobileSheetOpen) => set({ mobileSheetOpen }),
    setAuthModalOpen: (authModalOpen) => set({ authModalOpen }),
    setSuggestionModalOpen: (suggestionModalOpen) => set({ suggestionModalOpen }),

    // Mock data for development/demo
    mockJobs: generateMockJobs(),
}))

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // Earth's radius in km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

function toRad(deg) {
    return deg * (Math.PI / 180)
}

// Generate mock jobs for development
function generateMockJobs() {
    const companies = [
        { name: 'TechNova AI', industry: 'tech' },
        { name: 'CloudScale', industry: 'tech' },
        { name: 'DesignHub', industry: 'design' },
        { name: 'FinanceFlow', industry: 'finance' },
        { name: 'HealthSync', industry: 'healthcare' },
        { name: 'EduLearn', industry: 'education' },
        { name: 'GreenEnergy', industry: 'energy' },
        { name: 'RetailMax', industry: 'retail' },
        { name: 'LogiTrack', industry: 'logistics' },
        { name: 'MediaPulse', industry: 'media' },
        { name: 'CyberShield', industry: 'tech' },
        { name: 'DataWave', industry: 'tech' },
        { name: 'CreativeStudio', industry: 'design' },
        { name: 'InvestPro', industry: 'finance' },
        { name: 'MedTech Labs', industry: 'healthcare' },
        { name: 'SkillBridge', industry: 'education' },
        { name: 'SolarPeak', industry: 'energy' },
        { name: 'ShopSmart', industry: 'retail' },
        { name: 'FastFreight', industry: 'logistics' },
        { name: 'StreamVision', industry: 'media' },
        { name: 'AI Dynamics', industry: 'tech' },
        { name: 'Pixel Perfect', industry: 'design' },
        { name: 'WealthWise', industry: 'finance' },
        { name: 'BioGenix', industry: 'healthcare' },
        { name: 'LearnPath', industry: 'education' },
        { name: 'WindForce', industry: 'energy' },
        { name: 'MarketPlace Pro', industry: 'retail' },
        { name: 'Global Cargo', industry: 'logistics' },
        { name: 'Broadcast Now', industry: 'media' },
        { name: 'Quantum Code', industry: 'tech' },
        { name: 'NextGen Auto', industry: 'tech' },
        { name: 'Urban Eat', industry: 'retail' },
        { name: 'Travel Sphere', industry: 'tech' },
        { name: 'SecureNet', industry: 'tech' },
        { name: 'Fashion Forward', industry: 'retail' },
        { name: 'BuildRight', industry: 'tech' },
        { name: 'AgriTech Solutions', industry: 'tech' },
        { name: 'SpaceXplore', industry: 'tech' },
        { name: 'OceanBlue', industry: 'logistics' },
        { name: 'GameZone', industry: 'media' }
    ]

    const titles = [
        { title: 'Senior Software Engineer', level: 'senior' },
        { title: 'Full Stack Developer', level: 'mid' },
        { title: 'Frontend Developer', level: 'mid' },
        { title: 'Backend Engineer', level: 'mid' },
        { title: 'Product Designer', level: 'mid' },
        { title: 'UX Researcher', level: 'mid' },
        { title: 'Data Scientist', level: 'senior' },
        { title: 'DevOps Engineer', level: 'senior' },
        { title: 'Product Manager', level: 'senior' },
        { title: 'Marketing Manager', level: 'mid' },
        { title: 'Sales Executive', level: 'entry' },
        { title: 'Customer Success Manager', level: 'mid' },
        { title: 'Junior Developer', level: 'entry' },
        { title: 'Intern - Engineering', level: 'intern' },
        { title: 'Technical Lead', level: 'lead' },
        { title: 'Engineering Manager', level: 'lead' },
        { title: 'Chief Technology Officer', level: 'executive' },
        { title: 'UI Developer', level: 'mid' },
        { title: 'Mobile Developer', level: 'mid' },
        { title: 'Cloud Architect', level: 'senior' },
        { title: 'Security Engineer', level: 'senior' },
        { title: 'QA Engineer', level: 'mid' },
        { title: 'Business Analyst', level: 'mid' },
        { title: 'Data Analyst', level: 'entry' },
        { title: 'Machine Learning Engineer', level: 'senior' },
        { title: 'Art Director', level: 'senior' },
        { title: 'HR Specialist', level: 'mid' },
        { title: 'Content Writer', level: 'mid' },
        { title: 'Social Media Manager', level: 'mid' },
        { title: 'Financial Analyst', level: 'mid' }
    ]

    const locations = [
        // India
        { name: 'Bangalore, India', lat: 12.9716, lng: 77.5946 },
        { name: 'Mumbai, India', lat: 19.0760, lng: 72.8777 },
        { name: 'Delhi, India', lat: 28.6139, lng: 77.2090 },
        { name: 'Hyderabad, India', lat: 17.3850, lng: 78.4867 },
        { name: 'Chennai, India', lat: 13.0827, lng: 80.2707 },
        { name: 'Pune, India', lat: 18.5204, lng: 73.8567 },
        { name: 'Kolkata, India', lat: 22.5726, lng: 88.3639 },
        { name: 'Gurgaon, India', lat: 28.4595, lng: 77.0266 },
        { name: 'Noida, India', lat: 28.5355, lng: 77.3910 },
        { name: 'Ahmedabad, India', lat: 23.0225, lng: 72.5714 },
        { name: 'Jaipur, India', lat: 26.9124, lng: 75.7873 },
        { name: 'Chandigarh, India', lat: 30.7333, lng: 76.7794 },
        { name: 'Kochi, India', lat: 9.9312, lng: 76.2673 },
        { name: 'Indore, India', lat: 22.7196, lng: 75.8577 },
        { name: 'Lucknow, India', lat: 26.8467, lng: 80.9462 },
        // USA
        { name: 'San Francisco, USA', lat: 37.7749, lng: -122.4194 },
        { name: 'New York, USA', lat: 40.7128, lng: -74.0060 },
        { name: 'Seattle, USA', lat: 47.6062, lng: -122.3321 },
        { name: 'Austin, USA', lat: 30.2672, lng: -97.7431 },
        { name: 'Boston, USA', lat: 42.3601, lng: -71.0589 },
        { name: 'Los Angeles, USA', lat: 34.0522, lng: -118.2437 },
        { name: 'Chicago, USA', lat: 41.8781, lng: -87.6298 },
        { name: 'Denver, USA', lat: 39.7392, lng: -104.9903 },
        { name: 'Miami, USA', lat: 25.7617, lng: -80.1918 },
        { name: 'Atlanta, USA', lat: 33.7490, lng: -84.3880 },
        { name: 'Portland, USA', lat: 45.5152, lng: -122.6784 },
        { name: 'San Diego, USA', lat: 32.7157, lng: -117.1611 },
        { name: 'Dallas, USA', lat: 32.7767, lng: -96.7970 },
        // Europe
        { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
        { name: 'Berlin, Germany', lat: 52.5200, lng: 13.4050 },
        { name: 'Amsterdam, Netherlands', lat: 52.3676, lng: 4.9041 },
        { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
        { name: 'Dublin, Ireland', lat: 53.3498, lng: -6.2603 },
        { name: 'Stockholm, Sweden', lat: 59.3293, lng: 18.0686 },
        { name: 'Zurich, Switzerland', lat: 47.3769, lng: 8.5417 },
        { name: 'Barcelona, Spain', lat: 41.3851, lng: 2.1734 },
        { name: 'Munich, Germany', lat: 48.1351, lng: 11.5820 },
        { name: 'Milan, Italy', lat: 45.4642, lng: 9.1900 },
        { name: 'Lisbon, Portugal', lat: 38.7223, lng: -9.1393 },
        { name: 'Warsaw, Poland', lat: 52.2297, lng: 21.0122 },
        // Others
        { name: 'Toronto, Canada', lat: 43.6532, lng: -79.3832 },
        { name: 'Vancouver, Canada', lat: 49.2827, lng: -123.1207 },
        { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 },
        { name: 'Melbourne, Australia', lat: -37.8136, lng: 144.9631 },
        { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
        { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
        { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708 },
    ]

    const remoteTypes = ['remote', 'hybrid', 'office']

    const descriptions = [
        'Join our dynamic team to build cutting-edge solutions that impact millions of users worldwide. We offer competitive compensation, excellent benefits, and a collaborative work environment.',
        'We are looking for a passionate individual to help us scale our platform. You will work with modern technologies and have the opportunity to make significant contributions to our core products.',
        'Be part of an innovative startup revolutionizing the industry. We value creativity, initiative, and a growth mindset. Great opportunity for career advancement and personal growth.',
        'Help us create beautiful, user-friendly experiences. Work alongside talented designers and engineers in a fast-paced, agile environment where your ideas actually matter.',
        'Drive strategic initiatives and lead cross-functional teams. This role offers high visibility and the chance to shape the company direction while mentoring junior team members.',
        'We are seeking a problem solver who enjoys tackling complex challenges. If you love clean code, best practices, and learning new things, this is the place for you.',
        'Looking for a role with great work-life balance? We prioritize employee well-being while maintaining high standards of excellence. Remote-first culture.',
    ]

    const jobs = []
    const now = new Date()

    // Generate 1200 jobs
    for (let i = 0; i < 1200; i++) {
        const company = companies[Math.floor(Math.random() * companies.length)]
        const titleObj = titles[Math.floor(Math.random() * titles.length)]
        const location = locations[Math.floor(Math.random() * locations.length)]
        const remoteType = remoteTypes[Math.floor(Math.random() * remoteTypes.length)]
        const description = descriptions[Math.floor(Math.random() * descriptions.length)]

        // Add some randomness to location - use Gaussian-like distribution for better clustering
        // This keeps distinct clusters but adds some spread
        const r = 0.1 * Math.sqrt(Math.random()) // radius
        const theta = Math.random() * 2 * Math.PI // angle
        const latOffset = r * Math.cos(theta)
        const lngOffset = r * Math.sin(theta)

        // Generate salary based on level
        let salaryMin, salaryMax
        switch (titleObj.level) {
            case 'intern':
                salaryMin = 15000 + Math.floor(Math.random() * 10000)
                salaryMax = salaryMin + 10000 + Math.floor(Math.random() * 10000)
                break
            case 'entry':
                salaryMin = 40000 + Math.floor(Math.random() * 20000)
                salaryMax = salaryMin + 20000 + Math.floor(Math.random() * 20000)
                break
            case 'mid':
                salaryMin = 70000 + Math.floor(Math.random() * 30000)
                salaryMax = salaryMin + 30000 + Math.floor(Math.random() * 30000)
                break
            case 'senior':
                salaryMin = 120000 + Math.floor(Math.random() * 40000)
                salaryMax = salaryMin + 40000 + Math.floor(Math.random() * 50000)
                break
            case 'lead':
                salaryMin = 160000 + Math.floor(Math.random() * 50000)
                salaryMax = salaryMin + 50000 + Math.floor(Math.random() * 60000)
                break
            case 'executive':
                salaryMin = 250000 + Math.floor(Math.random() * 100000)
                salaryMax = salaryMin + 100000 + Math.floor(Math.random() * 150000)
                break
            default:
                salaryMin = 60000
                salaryMax = 100000
        }

        // Random posted date within last 45 days
        const daysAgo = Math.floor(Math.random() * 45)
        const postedDate = new Date(now)
        postedDate.setDate(postedDate.getDate() - daysAgo)
        // Add random time
        postedDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))

        jobs.push({
            id: `mock-${i + 1}`,
            company: company.name,
            title: titleObj.title,
            description,
            salary_min: salaryMin,
            salary_max: salaryMax,
            location_lat: location.lat + latOffset,
            location_lng: location.lng + lngOffset,
            location_name: location.name,
            remote_type: remoteType,
            url: `https://example.com/jobs/${i + 1}`,
            industry: company.industry,
            experience_level: titleObj.level,
            posted_date: postedDate.toISOString(),
            is_approved: true,
        })
    }

    return jobs
}

// Initialize theme on load
if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme') || 'light'
    document.documentElement.setAttribute('data-theme', savedTheme)
}
