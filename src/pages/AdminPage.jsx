import { useState, useEffect, useRef } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft,
    Plus,
    Check,
    X,
    Trash2,
    Edit3,
    Eye,
    Clock,
    Building2,
    MapPin,
    Loader2,
    Save,
    DollarSign,
    Globe,
    Briefcase
} from 'lucide-react'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'
import toast from 'react-hot-toast'
import './AdminPage.css'

const industries = ['tech', 'design', 'finance', 'healthcare', 'education', 'energy', 'retail', 'logistics', 'media']
const experienceLevels = ['intern', 'entry', 'mid', 'senior', 'lead', 'executive']
const remoteTypes = ['remote', 'hybrid', 'office']

const emptyJob = {
    company: '',
    title: '',
    description: '',
    salary_min: '',
    salary_max: '',
    location_lat: '',
    location_lng: '',
    location_name: '',
    remote_type: 'office',
    url: '',
    industry: 'tech',
    experience_level: 'mid',
    is_approved: true
}

export default function AdminPage() {
    const { user, profile, authLoading, fetchJobs } = useStore()
    const [activeTab, setActiveTab] = useState('jobs')
    const [jobs, setJobs] = useState([])
    const [suggestions, setSuggestions] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(null)

    // Job form state
    const [showJobForm, setShowJobForm] = useState(false)
    const [editingJob, setEditingJob] = useState(null)
    const [jobForm, setJobForm] = useState(emptyJob)
    const [formLoading, setFormLoading] = useState(false)

    // Track if initial data has been loaded (prevents re-fetch on tab change)
    const dataLoadedRef = useRef(false)

    // Check if user is admin
    const isAdmin = profile?.is_admin === true

    useEffect(() => {
        // Only load data once when user is admin and data hasn't been loaded yet
        if (user && isAdmin && !dataLoadedRef.current) {
            dataLoadedRef.current = true
            loadData()
        } else if (!authLoading && !user) {
            setLoading(false)
        } else if (!authLoading && user && !isAdmin) {
            setLoading(false)
        }
    }, [user, isAdmin, authLoading])


    const loadData = async () => {
        setLoading(true)
        try {
            // Fetch all jobs
            const { data: jobsData, error: jobsError } = await supabase
                .from('jobs')
                .select('*')
                .order('posted_date', { ascending: false })

            if (jobsError) throw jobsError
            setJobs(jobsData || [])

            // Fetch pending suggestions
            const { data: suggestionsData, error: suggestionsError } = await supabase
                .from('job_suggestions')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            if (!suggestionsError) {
                setSuggestions(suggestionsData || [])
            }
        } catch (error) {
            console.error('Error loading data:', error)
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const handleFormChange = (field, value) => {
        setJobForm(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmitJob = async (e) => {
        e.preventDefault()
        setFormLoading(true)

        try {
            // Validate required fields
            if (!jobForm.company || !jobForm.title || !jobForm.location_lat || !jobForm.location_lng) {
                toast.error('Please fill in all required fields')
                setFormLoading(false)
                return
            }

            const jobData = {
                company: jobForm.company,
                title: jobForm.title,
                description: jobForm.description || null,
                salary_min: jobForm.salary_min ? parseInt(jobForm.salary_min) : null,
                salary_max: jobForm.salary_max ? parseInt(jobForm.salary_max) : null,
                location_lat: parseFloat(jobForm.location_lat),
                location_lng: parseFloat(jobForm.location_lng),
                location_name: jobForm.location_name || null,
                remote_type: jobForm.remote_type,
                url: jobForm.url || null,
                industry: jobForm.industry,
                experience_level: jobForm.experience_level,
                is_approved: jobForm.is_approved,
                posted_date: editingJob ? editingJob.posted_date : new Date().toISOString()
            }

            if (editingJob) {
                // Update existing job
                const { error } = await supabase
                    .from('jobs')
                    .update(jobData)
                    .eq('id', editingJob.id)

                if (error) throw error
                toast.success('Job updated successfully!')
            } else {
                // Insert new job
                const { error } = await supabase
                    .from('jobs')
                    .insert(jobData)

                if (error) throw error
                toast.success('Job added successfully!')
            }

            // Reset form and reload data
            setJobForm(emptyJob)
            setEditingJob(null)
            setShowJobForm(false)
            loadData()
            fetchJobs() // Refresh the main jobs list
        } catch (error) {
            console.error('Error saving job:', error)
            toast.error('Failed to save job: ' + error.message)
        } finally {
            setFormLoading(false)
        }
    }

    const handleEditJob = (job) => {
        setEditingJob(job)
        setJobForm({
            company: job.company || '',
            title: job.title || '',
            description: job.description || '',
            salary_min: job.salary_min || '',
            salary_max: job.salary_max || '',
            location_lat: job.location_lat || '',
            location_lng: job.location_lng || '',
            location_name: job.location_name || '',
            remote_type: job.remote_type || 'office',
            url: job.url || '',
            industry: job.industry || 'tech',
            experience_level: job.experience_level || 'mid',
            is_approved: job.is_approved !== false
        })
        setShowJobForm(true)
    }

    const handleDeleteJob = async (jobId) => {
        if (!confirm('Are you sure you want to delete this job?')) return

        setActionLoading(jobId)
        try {
            const { error } = await supabase
                .from('jobs')
                .delete()
                .eq('id', jobId)

            if (error) throw error
            toast.success('Job deleted')
            loadData()
            fetchJobs()
        } catch (error) {
            console.error('Error deleting job:', error)
            toast.error('Failed to delete job')
        } finally {
            setActionLoading(null)
        }
    }

    const handleApproveSuggestion = async (suggestion) => {
        setActionLoading(suggestion.id)
        try {
            // Add as a new job
            const { error: insertError } = await supabase
                .from('jobs')
                .insert({
                    company: suggestion.company,
                    title: suggestion.title,
                    description: suggestion.description,
                    salary_min: suggestion.salary_min,
                    salary_max: suggestion.salary_max,
                    location_lat: suggestion.location_lat || 0,
                    location_lng: suggestion.location_lng || 0,
                    location_name: suggestion.location_name,
                    remote_type: suggestion.remote_type,
                    url: suggestion.url,
                    industry: suggestion.industry,
                    is_approved: true,
                    posted_date: new Date().toISOString()
                })

            if (insertError) throw insertError

            // Update suggestion status
            const { error: updateError } = await supabase
                .from('job_suggestions')
                .update({ status: 'approved' })
                .eq('id', suggestion.id)

            if (updateError) throw updateError

            toast.success('Job approved and added!')
            loadData()
            fetchJobs()
        } catch (error) {
            console.error('Error approving suggestion:', error)
            toast.error('Failed to approve')
        } finally {
            setActionLoading(null)
        }
    }

    const handleRejectSuggestion = async (suggestionId) => {
        setActionLoading(suggestionId)
        try {
            const { error } = await supabase
                .from('job_suggestions')
                .update({ status: 'rejected' })
                .eq('id', suggestionId)

            if (error) throw error
            toast.success('Suggestion rejected')
            loadData()
        } catch (error) {
            console.error('Error rejecting suggestion:', error)
            toast.error('Failed to reject')
        } finally {
            setActionLoading(null)
        }
    }

    const formatSalary = (min, max) => {
        const format = (n) => `$${(n / 1000).toFixed(0)}K`
        if (min && max) return `${format(min)} - ${format(max)}`
        if (min) return `From ${format(min)}`
        if (max) return `Up to ${format(max)}`
        return 'Not specified'
    }

    // Redirect if not authenticated
    if (!authLoading && !user) {
        return <Navigate to="/" replace />
    }

    // Show access denied for non-admins
    if (!authLoading && user && !isAdmin) {
        return (
            <div className="admin-page">
                <Header />
                <div className="admin-page__access-denied">
                    <div className="admin-page__access-denied-icon">🔒</div>
                    <h2>Admin Access Required</h2>
                    <p>You don't have admin privileges to access this page.</p>
                    <p className="admin-page__hint">
                        To become an admin, run this SQL in Supabase:
                        <code>UPDATE profiles SET is_admin = true WHERE email = '{user.email}';</code>
                    </p>
                    <Link to="/" className="btn btn--primary">
                        <ArrowLeft size={18} />
                        Back to Map
                    </Link>
                </div>
            </div>
        )
    }

    if (authLoading || loading) {
        return (
            <div className="admin-page">
                <Header />
                <div className="admin-page__loading">
                    <div className="spinner spinner--large"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="admin-page">
            <Header />

            <div className="admin-page__content">
                {/* Header */}
                <div className="admin-header">
                    <div className="admin-header__left">
                        <Link to="/" className="admin-header__back">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="admin-header__title">Admin Dashboard</h1>
                            <p className="admin-header__subtitle">Manage jobs and suggestions</p>
                        </div>
                    </div>
                    <button
                        className="btn btn--primary"
                        onClick={() => {
                            setEditingJob(null)
                            setJobForm(emptyJob)
                            setShowJobForm(true)
                        }}
                    >
                        <Plus size={18} />
                        Add Job
                    </button>
                </div>

                {/* Stats */}
                <div className="admin-stats">
                    <div className="admin-stat">
                        <div className="admin-stat__value">{jobs.length}</div>
                        <div className="admin-stat__label">Total Jobs</div>
                    </div>
                    <div className="admin-stat">
                        <div className="admin-stat__value">{suggestions.length}</div>
                        <div className="admin-stat__label">Pending Suggestions</div>
                    </div>
                    <div className="admin-stat">
                        <div className="admin-stat__value">{jobs.filter(j => j.remote_type === 'remote').length}</div>
                        <div className="admin-stat__label">Remote Jobs</div>
                    </div>
                    <div className="admin-stat">
                        <div className="admin-stat__value">{jobs.filter(j => j.is_approved).length}</div>
                        <div className="admin-stat__label">Approved</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="admin-tabs">
                    <button
                        className={`admin-tab ${activeTab === 'jobs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('jobs')}
                    >
                        <Building2 size={18} />
                        All Jobs
                        <span className="admin-tab__count">{jobs.length}</span>
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'suggestions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('suggestions')}
                    >
                        <Clock size={18} />
                        Pending Suggestions
                        {suggestions.length > 0 && (
                            <span className="admin-tab__badge">{suggestions.length}</span>
                        )}
                    </button>
                </div>

                {/* Job Form Modal */}
                <AnimatePresence>
                    {showJobForm && (
                        <motion.div
                            className="admin-form-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowJobForm(false)}
                        >
                            <motion.div
                                className="admin-form"
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="admin-form__header">
                                    <h2>{editingJob ? 'Edit Job' : 'Add New Job'}</h2>
                                    <button className="btn btn--icon btn--ghost" onClick={() => setShowJobForm(false)}>
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmitJob} className="admin-form__body">
                                    <div className="admin-form__row">
                                        <div className="admin-form__field">
                                            <label>Company *</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={jobForm.company}
                                                onChange={e => handleFormChange('company', e.target.value)}
                                                placeholder="e.g., TechCorp"
                                                required
                                            />
                                        </div>
                                        <div className="admin-form__field">
                                            <label>Job Title *</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={jobForm.title}
                                                onChange={e => handleFormChange('title', e.target.value)}
                                                placeholder="e.g., Senior Software Engineer"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="admin-form__field">
                                        <label>Description</label>
                                        <textarea
                                            className="input"
                                            rows="3"
                                            value={jobForm.description}
                                            onChange={e => handleFormChange('description', e.target.value)}
                                            placeholder="Job description..."
                                        />
                                    </div>

                                    <div className="admin-form__row">
                                        <div className="admin-form__field">
                                            <label>Min Salary ($)</label>
                                            <input
                                                type="number"
                                                className="input"
                                                value={jobForm.salary_min}
                                                onChange={e => handleFormChange('salary_min', e.target.value)}
                                                placeholder="e.g., 80000"
                                            />
                                        </div>
                                        <div className="admin-form__field">
                                            <label>Max Salary ($)</label>
                                            <input
                                                type="number"
                                                className="input"
                                                value={jobForm.salary_max}
                                                onChange={e => handleFormChange('salary_max', e.target.value)}
                                                placeholder="e.g., 120000"
                                            />
                                        </div>
                                    </div>

                                    <div className="admin-form__row">
                                        <div className="admin-form__field">
                                            <label>Latitude *</label>
                                            <input
                                                type="number"
                                                step="any"
                                                className="input"
                                                value={jobForm.location_lat}
                                                onChange={e => handleFormChange('location_lat', e.target.value)}
                                                placeholder="e.g., 37.7749"
                                                required
                                            />
                                        </div>
                                        <div className="admin-form__field">
                                            <label>Longitude *</label>
                                            <input
                                                type="number"
                                                step="any"
                                                className="input"
                                                value={jobForm.location_lng}
                                                onChange={e => handleFormChange('location_lng', e.target.value)}
                                                placeholder="e.g., -122.4194"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="admin-form__field">
                                        <label>Location Name</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={jobForm.location_name}
                                            onChange={e => handleFormChange('location_name', e.target.value)}
                                            placeholder="e.g., San Francisco, USA"
                                        />
                                    </div>

                                    <div className="admin-form__row">
                                        <div className="admin-form__field">
                                            <label>Work Type</label>
                                            <select
                                                className="input"
                                                value={jobForm.remote_type}
                                                onChange={e => handleFormChange('remote_type', e.target.value)}
                                            >
                                                {remoteTypes.map(type => (
                                                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="admin-form__field">
                                            <label>Industry</label>
                                            <select
                                                className="input"
                                                value={jobForm.industry}
                                                onChange={e => handleFormChange('industry', e.target.value)}
                                            >
                                                {industries.map(ind => (
                                                    <option key={ind} value={ind}>{ind.charAt(0).toUpperCase() + ind.slice(1)}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="admin-form__row">
                                        <div className="admin-form__field">
                                            <label>Experience Level</label>
                                            <select
                                                className="input"
                                                value={jobForm.experience_level}
                                                onChange={e => handleFormChange('experience_level', e.target.value)}
                                            >
                                                {experienceLevels.map(level => (
                                                    <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="admin-form__field">
                                            <label>Apply URL</label>
                                            <input
                                                type="url"
                                                className="input"
                                                value={jobForm.url}
                                                onChange={e => handleFormChange('url', e.target.value)}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>

                                    <div className="admin-form__field admin-form__checkbox">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={jobForm.is_approved}
                                                onChange={e => handleFormChange('is_approved', e.target.checked)}
                                            />
                                            <span>Approved (visible on map)</span>
                                        </label>
                                    </div>

                                    <div className="admin-form__actions">
                                        <button
                                            type="button"
                                            className="btn btn--secondary"
                                            onClick={() => setShowJobForm(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn--primary"
                                            disabled={formLoading}
                                        >
                                            {formLoading ? (
                                                <Loader2 size={18} className="spinner-icon" />
                                            ) : (
                                                <Save size={18} />
                                            )}
                                            {editingJob ? 'Update Job' : 'Add Job'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Jobs List */}
                {activeTab === 'jobs' && (
                    <div className="admin-jobs">
                        {jobs.length === 0 ? (
                            <div className="admin-empty">
                                <Building2 size={48} />
                                <h3>No jobs yet</h3>
                                <p>Click "Add Job" to create your first job listing</p>
                            </div>
                        ) : (
                            <div className="admin-jobs__table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Job Title</th>
                                            <th>Company</th>
                                            <th>Location</th>
                                            <th>Type</th>
                                            <th>Salary</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobs.map(job => (
                                            <tr key={job.id}>
                                                <td className="admin-jobs__title">{job.title}</td>
                                                <td>{job.company}</td>
                                                <td>{job.location_name || `${job.location_lat?.toFixed(2)}, ${job.location_lng?.toFixed(2)}`}</td>
                                                <td>
                                                    <span className={`badge badge--${job.remote_type}`}>{job.remote_type}</span>
                                                </td>
                                                <td>{formatSalary(job.salary_min, job.salary_max)}</td>
                                                <td>
                                                    <span className={`badge ${job.is_approved ? 'badge--success' : 'badge--warning'}`}>
                                                        {job.is_approved ? 'Approved' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="admin-jobs__actions">
                                                        <button
                                                            className="btn btn--icon btn--ghost"
                                                            title="Edit"
                                                            onClick={() => handleEditJob(job)}
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button
                                                            className="btn btn--icon btn--ghost"
                                                            title="Delete"
                                                            onClick={() => handleDeleteJob(job.id)}
                                                            disabled={actionLoading === job.id}
                                                        >
                                                            {actionLoading === job.id ? (
                                                                <Loader2 size={16} className="spinner-icon" />
                                                            ) : (
                                                                <Trash2 size={16} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Suggestions */}
                {activeTab === 'suggestions' && (
                    <div className="admin-suggestions">
                        {suggestions.length === 0 ? (
                            <div className="admin-empty">
                                <Clock size={48} />
                                <h3>No pending suggestions</h3>
                                <p>All job suggestions have been reviewed</p>
                            </div>
                        ) : (
                            <div className="admin-list">
                                <AnimatePresence>
                                    {suggestions.map((suggestion) => (
                                        <motion.div
                                            key={suggestion.id}
                                            className="admin-suggestion"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -100 }}
                                            layout
                                        >
                                            <div className="admin-suggestion__content">
                                                <div className="admin-suggestion__header">
                                                    <h3>{suggestion.title}</h3>
                                                    <span className={`badge badge--${suggestion.remote_type}`}>
                                                        {suggestion.remote_type}
                                                    </span>
                                                </div>

                                                <div className="admin-suggestion__company">
                                                    <Building2 size={14} />
                                                    {suggestion.company}
                                                </div>

                                                <div className="admin-suggestion__meta">
                                                    <span>
                                                        <MapPin size={14} />
                                                        {suggestion.location_name || 'Location not specified'}
                                                    </span>
                                                    <span>{formatSalary(suggestion.salary_min, suggestion.salary_max)}</span>
                                                    {suggestion.industry && (
                                                        <span className="badge badge--industry">{suggestion.industry}</span>
                                                    )}
                                                </div>

                                                {suggestion.url && (
                                                    <a
                                                        href={suggestion.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="admin-suggestion__link"
                                                    >
                                                        {suggestion.url}
                                                    </a>
                                                )}
                                            </div>

                                            <div className="admin-suggestion__actions">
                                                <button
                                                    className="btn btn--primary"
                                                    onClick={() => handleApproveSuggestion(suggestion)}
                                                    disabled={actionLoading === suggestion.id}
                                                >
                                                    {actionLoading === suggestion.id ? (
                                                        <Loader2 size={16} className="spinner-icon" />
                                                    ) : (
                                                        <Check size={16} />
                                                    )}
                                                    Approve
                                                </button>
                                                <button
                                                    className="btn btn--secondary"
                                                    onClick={() => handleRejectSuggestion(suggestion.id)}
                                                    disabled={actionLoading === suggestion.id}
                                                >
                                                    <X size={16} />
                                                    Reject
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
