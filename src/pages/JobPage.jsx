import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ArrowLeft,
    MapPin,
    Building2,
    DollarSign,
    Calendar,
    Briefcase,
    ExternalLink,
    Heart,
    Check,
    Share2,
    Globe,
    Clock
} from 'lucide-react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import { useStore } from '../lib/store'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import Header from '../components/Header'
import './JobPage.css'

export default function JobPage() {
    const { jobId } = useParams()
    const navigate = useNavigate()
    const {
        jobs,
        mockJobs,
        savedJobs,
        appliedJobs,
        saveJob,
        unsaveJob,
        markApplied,
        user,
        setAuthModalOpen,
        theme
    } = useStore()

    const [job, setJob] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        // Find job from store
        const allJobs = jobs.length > 0 ? jobs : mockJobs
        const foundJob = allJobs.find(j => j.id === jobId || j.id === `mock-${jobId}`)

        if (foundJob) {
            setJob(foundJob)
        }
        setLoading(false)
    }, [jobId, jobs, mockJobs])

    const isSaved = savedJobs.some(j => j.id === job?.id)
    const isApplied = appliedJobs.some(j => j.id === job?.id)

    const formatSalary = (min, max) => {
        if (!min && !max) return 'Salary not disclosed'
        const format = (n) => {
            if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
            if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
            return `$${n}`
        }
        if (min && max) return `${format(min)} - ${format(max)}`
        if (min) return `From ${format(min)}`
        return `Up to ${format(max)}`
    }

    const handleSave = async () => {
        if (!user) {
            setAuthModalOpen(true)
            return
        }

        setActionLoading(true)
        if (isSaved) {
            await unsaveJob(job.id)
            toast.success('Job removed from saved')
        } else {
            await saveJob(job.id)
            toast.success('Job saved!')
        }
        setActionLoading(false)
    }

    const handleApply = async () => {
        if (!user) {
            setAuthModalOpen(true)
            return
        }

        setActionLoading(true)
        await markApplied(job.id)
        toast.success('Marked as applied!')
        if (job.url) {
            window.open(job.url, '_blank')
        }
        setActionLoading(false)
    }

    const handleShare = async () => {
        const url = window.location.href

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${job.title} at ${job.company}`,
                    text: `Check out this job opportunity!`,
                    url,
                })
            } catch (err) {
                // User cancelled
            }
        } else {
            await navigator.clipboard.writeText(url)
            toast.success('Link copied to clipboard!')
        }
    }

    // Custom marker icon
    const createMarkerIcon = () => {
        const colors = {
            remote: { main: '#3b82f6', dark: '#1d4ed8' },
            hybrid: { main: '#22c55e', dark: '#16a34a' },
            office: { main: '#ef4444', dark: '#dc2626' },
        }
        const color = colors[job?.remote_type] || colors.office

        return L.divIcon({
            html: `<div style="
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, ${color.main}, ${color.dark});
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 3px solid white;
      ">
        <div style="transform: rotate(45deg); width: 16px; height: 16px; background: white; border-radius: 50%;"></div>
      </div>`,
            className: 'job-page-marker',
            iconSize: [48, 58],
            iconAnchor: [24, 58],
        })
    }

    const tileUrl = theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

    if (loading) {
        return (
            <div className="job-page">
                <Header />
                <div className="job-page__loading">
                    <div className="spinner spinner--large"></div>
                </div>
            </div>
        )
    }

    if (!job) {
        return (
            <div className="job-page">
                <Header />
                <div className="job-page__not-found">
                    <h2>Job not found</h2>
                    <p>This job listing may have been removed or the link is invalid.</p>
                    <Link to="/" className="btn btn--primary">
                        <ArrowLeft size={18} />
                        Back to Map
                    </Link>
                </div>
            </div>
        )
    }

    const timeAgo = job.posted_date
        ? formatDistanceToNow(new Date(job.posted_date), { addSuffix: true })
        : 'Recently posted'

    return (
        <div className="job-page">
            <Header />

            <div className="job-page__content">
                <motion.div
                    className="job-page__container"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Back Button */}
                    <Link to="/" className="job-page__back">
                        <ArrowLeft size={20} />
                        Back to Map
                    </Link>

                    {/* Main Content */}
                    <div className="job-page__grid">
                        {/* Left Column - Job Details */}
                        <div className="job-page__details">
                            {/* Header */}
                            <div className="job-page__header">
                                <div className="job-page__company-logo">
                                    <Building2 size={32} />
                                </div>
                                <div className="job-page__header-content">
                                    <div className="job-page__badges">
                                        <span className={`badge badge--${job.remote_type}`}>
                                            {job.remote_type === 'remote' ? '🌐 Remote' :
                                                job.remote_type === 'hybrid' ? '🏠 Hybrid' : '🏢 Office'}
                                        </span>
                                        {job.industry && (
                                            <span className="badge badge--industry">{job.industry}</span>
                                        )}
                                    </div>
                                    <h1 className="job-page__title">{job.title}</h1>
                                    <div className="job-page__company">{job.company}</div>
                                </div>
                            </div>

                            {/* Meta Info */}
                            <div className="job-page__meta">
                                <div className="job-page__meta-item">
                                    <MapPin size={20} />
                                    <span>{job.location_name || 'Location not specified'}</span>
                                </div>
                                <div className="job-page__meta-item">
                                    <DollarSign size={20} />
                                    <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                                </div>
                                {job.experience_level && (
                                    <div className="job-page__meta-item">
                                        <Briefcase size={20} />
                                        <span className="capitalize">{job.experience_level} level</span>
                                    </div>
                                )}
                                <div className="job-page__meta-item">
                                    <Clock size={20} />
                                    <span>{timeAgo}</span>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="job-page__section">
                                <h2>About this role</h2>
                                <p>{job.description || 'No description provided.'}</p>
                            </div>

                            {/* Additional Info */}
                            <div className="job-page__section">
                                <h2>Additional Information</h2>
                                <div className="job-page__info-grid">
                                    <div className="job-page__info-item">
                                        <span className="job-page__info-label">Work Type</span>
                                        <span className="job-page__info-value capitalize">{job.remote_type}</span>
                                    </div>
                                    <div className="job-page__info-item">
                                        <span className="job-page__info-label">Industry</span>
                                        <span className="job-page__info-value capitalize">{job.industry || 'Not specified'}</span>
                                    </div>
                                    <div className="job-page__info-item">
                                        <span className="job-page__info-label">Experience</span>
                                        <span className="job-page__info-value capitalize">{job.experience_level || 'Not specified'}</span>
                                    </div>
                                    <div className="job-page__info-item">
                                        <span className="job-page__info-label">Posted</span>
                                        <span className="job-page__info-value">{timeAgo}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Actions & Map */}
                        <div className="job-page__sidebar">
                            {/* Actions Card */}
                            <div className="job-page__actions-card">
                                <div className="job-page__salary-display">
                                    <span className="job-page__salary-label">Salary Range</span>
                                    <span className="job-page__salary-value">{formatSalary(job.salary_min, job.salary_max)}</span>
                                </div>

                                <div className="job-page__actions">
                                    {isApplied ? (
                                        <button className="btn btn--large job-page__btn--applied" disabled>
                                            <Check size={20} />
                                            Already Applied
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn--primary btn--large"
                                            onClick={handleApply}
                                            disabled={actionLoading}
                                        >
                                            <ExternalLink size={20} />
                                            Apply Now
                                        </button>
                                    )}

                                    <div className="job-page__secondary-actions">
                                        <button
                                            className={`btn btn--secondary ${isSaved ? 'job-page__btn--saved' : ''}`}
                                            onClick={handleSave}
                                            disabled={actionLoading}
                                        >
                                            <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
                                            {isSaved ? 'Saved' : 'Save'}
                                        </button>
                                        <button
                                            className="btn btn--secondary"
                                            onClick={handleShare}
                                        >
                                            <Share2 size={18} />
                                            Share
                                        </button>
                                    </div>
                                </div>

                                {job.url && (
                                    <a
                                        href={job.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="job-page__external-link"
                                    >
                                        <Globe size={16} />
                                        View on company website
                                    </a>
                                )}
                            </div>

                            {/* Map Card */}
                            <div className="job-page__map-card">
                                <h3>Location</h3>
                                <div className="job-page__map">
                                    <MapContainer
                                        center={[job.location_lat, job.location_lng]}
                                        zoom={12}
                                        className="job-page__map-container"
                                        scrollWheelZoom={false}
                                        dragging={false}
                                        zoomControl={false}
                                    >
                                        <TileLayer url={tileUrl} />
                                        <Marker
                                            position={[job.location_lat, job.location_lng]}
                                            icon={createMarkerIcon()}
                                        />
                                    </MapContainer>
                                </div>
                                <div className="job-page__map-location">
                                    <MapPin size={16} />
                                    {job.location_name || 'Location on map'}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
