import { useState, useEffect } from 'react'
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
    ChevronDown
} from 'lucide-react'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'
import toast from 'react-hot-toast'
import './AdminPage.css'

export default function AdminPage() {
    const { user, profile, authLoading } = useStore()
    const [activeTab, setActiveTab] = useState('suggestions')
    const [suggestions, setSuggestions] = useState([])
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(null)

    // For demo, we'll use mock data
    const mockSuggestions = [
        {
            id: 1,
            company: 'StartupX',
            title: 'Senior React Developer',
            location_name: 'Remote',
            remote_type: 'remote',
            salary_min: 120000,
            salary_max: 160000,
            industry: 'tech',
            status: 'pending',
            created_at: new Date().toISOString(),
            url: 'https://startupx.com/careers',
        },
        {
            id: 2,
            company: 'DesignCo',
            title: 'Product Designer',
            location_name: 'New York, USA',
            remote_type: 'hybrid',
            salary_min: 90000,
            salary_max: 130000,
            industry: 'design',
            status: 'pending',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            url: 'https://designco.com/jobs',
        },
    ]

    useEffect(() => {
        // Simulate loading
        const timer = setTimeout(() => {
            setSuggestions(mockSuggestions)
            setLoading(false)
        }, 500)
        return () => clearTimeout(timer)
    }, [])

    // Redirect if not admin
    if (!authLoading && (!user || !profile?.is_admin)) {
        // For demo purposes, show the page anyway
        // return <Navigate to="/" replace />
    }

    const handleApproveSuggestion = async (id) => {
        setActionLoading(id)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500))

        setSuggestions(prev => prev.filter(s => s.id !== id))
        toast.success('Job approved and added to map!')
        setActionLoading(null)
    }

    const handleRejectSuggestion = async (id) => {
        setActionLoading(id)
        await new Promise(resolve => setTimeout(resolve, 500))

        setSuggestions(prev => prev.filter(s => s.id !== id))
        toast.success('Suggestion rejected')
        setActionLoading(null)
    }

    const formatSalary = (min, max) => {
        const format = (n) => `$${(n / 1000).toFixed(0)}K`
        if (min && max) return `${format(min)} - ${format(max)}`
        return 'Not specified'
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
                </div>

                {/* Stats */}
                <div className="admin-stats">
                    <div className="admin-stat">
                        <div className="admin-stat__value">{suggestions.length}</div>
                        <div className="admin-stat__label">Pending Suggestions</div>
                    </div>
                    <div className="admin-stat">
                        <div className="admin-stat__value">500</div>
                        <div className="admin-stat__label">Total Jobs</div>
                    </div>
                    <div className="admin-stat">
                        <div className="admin-stat__value">1.2K</div>
                        <div className="admin-stat__label">Active Users</div>
                    </div>
                    <div className="admin-stat">
                        <div className="admin-stat__value">5.8K</div>
                        <div className="admin-stat__label">Applications</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="admin-tabs">
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
                    <button
                        className={`admin-tab ${activeTab === 'jobs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('jobs')}
                    >
                        <Building2 size={18} />
                        All Jobs
                    </button>
                </div>

                {/* Content */}
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
                                                    <span className="badge badge--industry">{suggestion.industry}</span>
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
                                                    onClick={() => handleApproveSuggestion(suggestion.id)}
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

                {activeTab === 'jobs' && (
                    <div className="admin-jobs">
                        <div className="admin-jobs__header">
                            <div className="input-wrapper" style={{ maxWidth: 300 }}>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Search jobs..."
                                />
                            </div>
                            <button className="btn btn--primary">
                                <Plus size={16} />
                                Add Job
                            </button>
                        </div>

                        <div className="admin-jobs__table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Job Title</th>
                                        <th>Company</th>
                                        <th>Location</th>
                                        <th>Type</th>
                                        <th>Posted</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { id: 1, title: 'Senior Software Engineer', company: 'TechNova AI', location: 'San Francisco', type: 'remote', posted: '2 days ago' },
                                        { id: 2, title: 'Product Designer', company: 'DesignHub', location: 'New York', type: 'hybrid', posted: '3 days ago' },
                                        { id: 3, title: 'Full Stack Developer', company: 'CloudScale', location: 'London', type: 'office', posted: '5 days ago' },
                                        { id: 4, title: 'Data Scientist', company: 'DataWave', location: 'Berlin', type: 'remote', posted: '1 week ago' },
                                        { id: 5, title: 'DevOps Engineer', company: 'CyberShield', location: 'Bangalore', type: 'hybrid', posted: '1 week ago' },
                                    ].map(job => (
                                        <tr key={job.id}>
                                            <td className="admin-jobs__title">{job.title}</td>
                                            <td>{job.company}</td>
                                            <td>{job.location}</td>
                                            <td>
                                                <span className={`badge badge--${job.type}`}>{job.type}</span>
                                            </td>
                                            <td className="admin-jobs__date">{job.posted}</td>
                                            <td>
                                                <div className="admin-jobs__actions">
                                                    <button className="btn btn--icon btn--ghost" title="View">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button className="btn btn--icon btn--ghost" title="Edit">
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button className="btn btn--icon btn--ghost" title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
