import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Heart,
    Check,
    MapPin,
    Building2,
    DollarSign,
    ExternalLink,
    Share2,
    Briefcase
} from 'lucide-react'
import { useStore } from '../lib/store'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import './JobCard.css'

export default function JobCard({ job, isSaved, isApplied, compact = false }) {
    const { user, saveJob, unsaveJob, markApplied, setAuthModalOpen } = useStore()
    const [loading, setLoading] = useState(false)

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

    const handleSave = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (!user) {
            setAuthModalOpen(true)
            return
        }

        setLoading(true)
        if (isSaved) {
            const result = await unsaveJob(job.id)
            if (!result.error) {
                toast.success('Job removed from saved')
            }
        } else {
            const result = await saveJob(job.id)
            if (!result.error) {
                toast.success('Job saved!')
            }
        }
        setLoading(false)
    }

    const handleApply = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (!user) {
            setAuthModalOpen(true)
            return
        }

        setLoading(true)
        const result = await markApplied(job.id)
        if (!result.error) {
            toast.success('Marked as applied!')
            // Open job URL
            if (job.url) {
                window.open(job.url, '_blank')
            }
        }
        setLoading(false)
    }

    const handleShare = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        const url = `${window.location.origin}/job/${job.id}`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${job.title} at ${job.company}`,
                    text: `Check out this job: ${job.title} at ${job.company}`,
                    url,
                })
            } catch (err) {
                // User cancelled share
            }
        } else {
            await navigator.clipboard.writeText(url)
            toast.success('Link copied to clipboard!')
        }
    }

    const timeAgo = job.posted_date
        ? formatDistanceToNow(new Date(job.posted_date), { addSuffix: true })
        : 'Recently'

    return (
        <motion.div
            className={`job-card ${compact ? 'job-card--compact' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
        >
            {/* Header */}
            <div className="job-card__header">
                <div className="job-card__company-logo">
                    <Building2 size={20} />
                </div>
                <div className="job-card__company-info">
                    <span className="job-card__company">{job.company}</span>
                    <span className="job-card__time">{timeAgo}</span>
                </div>
                <div className="job-card__badges">
                    <span className={`badge badge--${job.remote_type}`}>
                        {job.remote_type === 'remote' ? '🌐 Remote' :
                            job.remote_type === 'hybrid' ? '🏠 Hybrid' : '🏢 Office'}
                    </span>
                </div>
            </div>

            {/* Title */}
            <h3 className="job-card__title">{job.title}</h3>

            {/* Location & Salary */}
            <div className="job-card__meta">
                {job.location_name && (
                    <div className="job-card__meta-item">
                        <MapPin size={14} />
                        <span>{job.location_name}</span>
                    </div>
                )}
                <div className="job-card__meta-item">
                    <DollarSign size={14} />
                    <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                </div>
                {job.experience_level && (
                    <div className="job-card__meta-item">
                        <Briefcase size={14} />
                        <span className="capitalize">{job.experience_level}</span>
                    </div>
                )}
            </div>

            {/* Description */}
            {!compact && job.description && (
                <p className="job-card__description">{job.description}</p>
            )}

            {/* Industry Tag */}
            {job.industry && (
                <div className="job-card__tags">
                    <span className="badge badge--industry">{job.industry}</span>
                </div>
            )}

            {/* Actions */}
            <div className="job-card__actions">
                <button
                    className={`btn btn--icon ${isSaved ? 'job-card__btn--saved' : 'btn--ghost'}`}
                    onClick={handleSave}
                    disabled={loading}
                    title={isSaved ? 'Remove from saved' : 'Save job'}
                >
                    <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
                </button>

                <button
                    className="btn btn--icon btn--ghost"
                    onClick={handleShare}
                    title="Share job"
                >
                    <Share2 size={18} />
                </button>

                {isApplied ? (
                    <button className="btn btn--secondary job-card__btn--applied" disabled>
                        <Check size={16} />
                        Applied
                    </button>
                ) : (
                    <button
                        className="btn btn--primary"
                        onClick={handleApply}
                        disabled={loading}
                    >
                        <ExternalLink size={16} />
                        Apply Now
                    </button>
                )}
            </div>

            {/* Link overlay for full card */}
            {!compact && (
                <Link to={`/job/${job.id}`} className="job-card__link-overlay" aria-label={`View ${job.title} details`} />
            )}
        </motion.div>
    )
}
