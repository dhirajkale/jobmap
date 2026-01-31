import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft,
    Bookmark,
    CheckCircle,
    Clock,
    XCircle,
    Star,
    MapPin,
    List,
    Map as MapIcon,
    Filter,
    MoreVertical,
    Trash2,
    Edit3
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useStore } from '../lib/store'
import Header from '../components/Header'
import JobCard from '../components/JobCard'
import toast from 'react-hot-toast'
import './TrackerPage.css'

const statusConfig = {
    saved: { label: 'Saved', icon: Bookmark, color: '#6366f1' },
    applied: { label: 'Applied', icon: Clock, color: '#f59e0b' },
    interviewing: { label: 'Interviewing', icon: Star, color: '#8b5cf6' },
    offered: { label: 'Offered', icon: CheckCircle, color: '#10b981' },
    rejected: { label: 'Rejected', icon: XCircle, color: '#ef4444' },
}

export default function TrackerPage() {
    const { user, authLoading, savedJobs, appliedJobs, updateJobStatus, unsaveJob, theme } = useStore()
    const [view, setView] = useState('list') // list, map
    const [filter, setFilter] = useState('all') // all, saved, applied, interviewing, offered, rejected
    const [activeMenu, setActiveMenu] = useState(null)

    // Redirect if not authenticated
    if (!authLoading && !user) {
        return <Navigate to="/" replace />
    }

    const allJobs = [...savedJobs, ...appliedJobs]

    const filteredJobs = filter === 'all'
        ? allJobs
        : filter === 'saved'
            ? savedJobs
            : appliedJobs.filter(j => j.applicationStatus === filter)

    const counts = {
        all: allJobs.length,
        saved: savedJobs.length,
        applied: appliedJobs.filter(j => j.applicationStatus === 'applied').length,
        interviewing: appliedJobs.filter(j => j.applicationStatus === 'interviewing').length,
        offered: appliedJobs.filter(j => j.applicationStatus === 'offered').length,
        rejected: appliedJobs.filter(j => j.applicationStatus === 'rejected').length,
    }

    const handleStatusChange = async (jobId, newStatus) => {
        const result = await updateJobStatus(jobId, newStatus)
        if (!result.error) {
            toast.success(`Status updated to ${statusConfig[newStatus].label}`)
        }
        setActiveMenu(null)
    }

    const handleRemove = async (jobId) => {
        const result = await unsaveJob(jobId)
        if (!result.error) {
            toast.success('Job removed')
        }
        setActiveMenu(null)
    }

    // Custom marker icon
    const createMarkerIcon = (status) => {
        const config = statusConfig[status] || statusConfig.saved
        return L.divIcon({
            html: `<div style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${config.color};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
          ${status === 'saved' ? '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>' : ''}
          ${status === 'applied' ? '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>' : ''}
          ${status === 'interviewing' ? '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>' : ''}
          ${status === 'offered' ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>' : ''}
          ${status === 'rejected' ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>' : ''}
        </svg>
      </div>`,
            className: 'tracker-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
        })
    }

    const tileUrl = theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

    if (authLoading) {
        return (
            <div className="tracker-page">
                <Header />
                <div className="tracker-page__loading">
                    <div className="spinner spinner--large"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="tracker-page">
            <Header />

            <div className="tracker-page__content">
                {/* Header */}
                <div className="tracker-header">
                    <div className="tracker-header__left">
                        <Link to="/" className="tracker-header__back">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="tracker-header__title">My Jobs</h1>
                            <p className="tracker-header__subtitle">Track your saved and applied jobs</p>
                        </div>
                    </div>

                    <div className="tracker-header__actions">
                        <div className="tracker-view-toggle">
                            <button
                                className={`tracker-view-toggle__btn ${view === 'list' ? 'active' : ''}`}
                                onClick={() => setView('list')}
                            >
                                <List size={18} />
                            </button>
                            <button
                                className={`tracker-view-toggle__btn ${view === 'map' ? 'active' : ''}`}
                                onClick={() => setView('map')}
                            >
                                <MapIcon size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="tracker-filters">
                    {Object.entries(statusConfig).map(([key, config]) => {
                        const Icon = config.icon
                        const count = key === 'saved' ? counts.saved : counts[key]
                        return (
                            <button
                                key={key}
                                className={`tracker-filter ${filter === key ? 'active' : ''}`}
                                style={{ '--filter-color': config.color }}
                                onClick={() => setFilter(key)}
                            >
                                <Icon size={16} />
                                <span>{config.label}</span>
                                <span className="tracker-filter__count">{count}</span>
                            </button>
                        )
                    })}
                    <button
                        className={`tracker-filter ${filter === 'all' ? 'active' : ''}`}
                        style={{ '--filter-color': '#64748b' }}
                        onClick={() => setFilter('all')}
                    >
                        <Filter size={16} />
                        <span>All</span>
                        <span className="tracker-filter__count">{counts.all}</span>
                    </button>
                </div>

                {/* Content */}
                {filteredJobs.length === 0 ? (
                    <div className="tracker-empty">
                        <div className="tracker-empty__icon">
                            <Bookmark size={48} />
                        </div>
                        <h3>No jobs yet</h3>
                        <p>Start exploring and save jobs you're interested in</p>
                        <Link to="/" className="btn btn--primary">
                            <MapIcon size={18} />
                            Explore Jobs
                        </Link>
                    </div>
                ) : view === 'list' ? (
                    <div className="tracker-list">
                        <AnimatePresence>
                            {filteredJobs.map((job, index) => (
                                <motion.div
                                    key={job.id}
                                    className="tracker-job"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div className="tracker-job__status">
                                        {(() => {
                                            const status = job.applicationStatus || 'saved'
                                            const config = statusConfig[status]
                                            const Icon = config.icon
                                            return (
                                                <div
                                                    className="tracker-job__status-badge"
                                                    style={{ background: config.color }}
                                                >
                                                    <Icon size={14} />
                                                    {config.label}
                                                </div>
                                            )
                                        })()}
                                    </div>

                                    <JobCard
                                        job={job}
                                        isSaved={savedJobs.some(j => j.id === job.id)}
                                        isApplied={appliedJobs.some(j => j.id === job.id)}
                                    />

                                    <div className="tracker-job__actions">
                                        <button
                                            className="btn btn--icon btn--ghost"
                                            onClick={() => setActiveMenu(activeMenu === job.id ? null : job.id)}
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        <AnimatePresence>
                                            {activeMenu === job.id && (
                                                <motion.div
                                                    className="tracker-job__menu"
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                >
                                                    <div className="tracker-job__menu-header">Update Status</div>
                                                    {Object.entries(statusConfig).map(([key, config]) => {
                                                        const Icon = config.icon
                                                        return (
                                                            <button
                                                                key={key}
                                                                className="tracker-job__menu-item"
                                                                onClick={() => handleStatusChange(job.id, key)}
                                                            >
                                                                <Icon size={16} style={{ color: config.color }} />
                                                                {config.label}
                                                            </button>
                                                        )
                                                    })}
                                                    <div className="dropdown__divider" />
                                                    <button
                                                        className="tracker-job__menu-item tracker-job__menu-item--danger"
                                                        onClick={() => handleRemove(job.id)}
                                                    >
                                                        <Trash2 size={16} />
                                                        Remove
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="tracker-map">
                        <MapContainer
                            center={[20, 0]}
                            zoom={2}
                            className="tracker-map__container"
                            scrollWheelZoom={true}
                        >
                            <TileLayer url={tileUrl} />
                            {filteredJobs.map((job) => (
                                <Marker
                                    key={job.id}
                                    position={[job.location_lat, job.location_lng]}
                                    icon={createMarkerIcon(job.applicationStatus || 'saved')}
                                >
                                    <Popup>
                                        <JobCard job={job} compact />
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                )}
            </div>
        </div>
    )
}
