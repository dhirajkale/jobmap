import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search,
    X,
    Filter,
    ChevronDown,
    ChevronUp,
    RotateCcw,
    MapPin,
    DollarSign,
    Briefcase,
    Building
} from 'lucide-react'
import { useStore } from '../lib/store'
import './Sidebar.css'

const industries = [
    'tech', 'design', 'finance', 'healthcare',
    'education', 'energy', 'retail', 'logistics', 'media'
]

const experienceLevels = [
    'intern', 'entry', 'mid', 'senior', 'lead', 'executive'
]

export default function Sidebar() {
    const {
        filters,
        setFilters,
        resetFilters,
        sidebarOpen,
        setSidebarOpen,
        filteredJobs
    } = useStore()

    const [expandedSections, setExpandedSections] = useState({
        workMode: true,
        salary: true,
        industry: false,
        experience: false,
        location: false,
    })

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }))
    }

    const handleRemoteTypeToggle = (type) => {
        const current = filters.remoteTypes
        if (current.includes(type)) {
            if (current.length > 1) {
                setFilters({ remoteTypes: current.filter(t => t !== type) })
            }
        } else {
            setFilters({ remoteTypes: [...current, type] })
        }
    }

    const handleIndustryToggle = (industry) => {
        const current = filters.industries
        if (current.includes(industry)) {
            setFilters({ industries: current.filter(i => i !== industry) })
        } else {
            setFilters({ industries: [...current, industry] })
        }
    }

    const handleExperienceToggle = (level) => {
        const current = filters.experienceLevels
        if (current.includes(level)) {
            setFilters({ experienceLevels: current.filter(l => l !== level) })
        } else {
            setFilters({ experienceLevels: [...current, level] })
        }
    }

    const hasActiveFilters =
        filters.search ||
        filters.remoteTypes.length < 3 ||
        filters.salaryMin > 0 ||
        filters.salaryMax < 500000 ||
        filters.industries.length > 0 ||
        filters.experienceLevels.length > 0 ||
        filters.radius > 0

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                className="sidebar-toggle hide-desktop"
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
                <Filter size={20} />
                <span>Filters</span>
                {hasActiveFilters && <span className="sidebar-toggle__badge" />}
            </button>

            {/* Sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        {/* Mobile Overlay */}
                        <motion.div
                            className="sidebar-overlay hide-desktop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                        />

                        <motion.aside
                            className="sidebar glass"
                            initial={{ x: -380, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -380, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        >
                            {/* Header */}
                            <div className="sidebar__header">
                                <div className="sidebar__title">
                                    <Filter size={20} />
                                    <h2>Filters</h2>
                                </div>

                                <div className="sidebar__header-actions">
                                    {hasActiveFilters && (
                                        <button
                                            className="btn btn--ghost btn--small"
                                            onClick={resetFilters}
                                        >
                                            <RotateCcw size={14} />
                                            Reset
                                        </button>
                                    )}
                                    <button
                                        className="btn btn--icon btn--ghost hide-desktop"
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Results Count */}
                            <div className="sidebar__results">
                                <strong>{filteredJobs.length}</strong> jobs match your filters
                            </div>

                            {/* Search */}
                            <div className="sidebar__section">
                                <div className="input-wrapper">
                                    <Search size={18} className="input-wrapper__icon" />
                                    <input
                                        type="text"
                                        className="input input--with-icon"
                                        placeholder="Search company, role..."
                                        value={filters.search}
                                        onChange={(e) => setFilters({ search: e.target.value })}
                                    />
                                    {filters.search && (
                                        <button
                                            className="sidebar__search-clear"
                                            onClick={() => setFilters({ search: '' })}
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="sidebar__content">
                                {/* Work Mode */}
                                <div className="sidebar__section">
                                    <button
                                        className="sidebar__section-header"
                                        onClick={() => toggleSection('workMode')}
                                    >
                                        <div className="sidebar__section-title">
                                            <Building size={18} />
                                            <span>Work Mode</span>
                                        </div>
                                        {expandedSections.workMode ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>

                                    <AnimatePresence>
                                        {expandedSections.workMode && (
                                            <motion.div
                                                className="sidebar__section-content"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="sidebar__toggles">
                                                    <label className="toggle">
                                                        <input
                                                            type="checkbox"
                                                            className="toggle__input"
                                                            checked={filters.remoteTypes.includes('remote')}
                                                            onChange={() => handleRemoteTypeToggle('remote')}
                                                        />
                                                        <span className="toggle__slider" />
                                                        <span className="toggle__label">
                                                            <span className="sidebar__toggle-dot sidebar__toggle-dot--remote" />
                                                            Remote
                                                        </span>
                                                    </label>

                                                    <label className="toggle">
                                                        <input
                                                            type="checkbox"
                                                            className="toggle__input"
                                                            checked={filters.remoteTypes.includes('hybrid')}
                                                            onChange={() => handleRemoteTypeToggle('hybrid')}
                                                        />
                                                        <span className="toggle__slider" />
                                                        <span className="toggle__label">
                                                            <span className="sidebar__toggle-dot sidebar__toggle-dot--hybrid" />
                                                            Hybrid
                                                        </span>
                                                    </label>

                                                    <label className="toggle">
                                                        <input
                                                            type="checkbox"
                                                            className="toggle__input"
                                                            checked={filters.remoteTypes.includes('office')}
                                                            onChange={() => handleRemoteTypeToggle('office')}
                                                        />
                                                        <span className="toggle__slider" />
                                                        <span className="toggle__label">
                                                            <span className="sidebar__toggle-dot sidebar__toggle-dot--office" />
                                                            Office
                                                        </span>
                                                    </label>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Salary Range */}
                                <div className="sidebar__section">
                                    <button
                                        className="sidebar__section-header"
                                        onClick={() => toggleSection('salary')}
                                    >
                                        <div className="sidebar__section-title">
                                            <DollarSign size={18} />
                                            <span>Salary Range</span>
                                        </div>
                                        {expandedSections.salary ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>

                                    <AnimatePresence>
                                        {expandedSections.salary && (
                                            <motion.div
                                                className="sidebar__section-content"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="sidebar__salary">
                                                    <div className="sidebar__salary-display">
                                                        <span>${(filters.salaryMin / 1000).toFixed(0)}K</span>
                                                        <span>-</span>
                                                        <span>${(filters.salaryMax / 1000).toFixed(0)}K</span>
                                                    </div>

                                                    <div className="sidebar__slider-group">
                                                        <label className="sidebar__slider-label">Minimum</label>
                                                        <input
                                                            type="range"
                                                            className="range-slider"
                                                            min="0"
                                                            max="300000"
                                                            step="10000"
                                                            value={filters.salaryMin}
                                                            onChange={(e) => setFilters({ salaryMin: parseInt(e.target.value) })}
                                                        />
                                                    </div>

                                                    <div className="sidebar__slider-group">
                                                        <label className="sidebar__slider-label">Maximum</label>
                                                        <input
                                                            type="range"
                                                            className="range-slider"
                                                            min="50000"
                                                            max="500000"
                                                            step="10000"
                                                            value={filters.salaryMax}
                                                            onChange={(e) => setFilters({ salaryMax: parseInt(e.target.value) })}
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Industry */}
                                <div className="sidebar__section">
                                    <button
                                        className="sidebar__section-header"
                                        onClick={() => toggleSection('industry')}
                                    >
                                        <div className="sidebar__section-title">
                                            <Briefcase size={18} />
                                            <span>Industry</span>
                                            {filters.industries.length > 0 && (
                                                <span className="sidebar__count">{filters.industries.length}</span>
                                            )}
                                        </div>
                                        {expandedSections.industry ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>

                                    <AnimatePresence>
                                        {expandedSections.industry && (
                                            <motion.div
                                                className="sidebar__section-content"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="sidebar__tags">
                                                    {industries.map(industry => (
                                                        <button
                                                            key={industry}
                                                            className={`tag ${filters.industries.includes(industry) ? 'tag--active' : ''}`}
                                                            onClick={() => handleIndustryToggle(industry)}
                                                        >
                                                            {industry}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Experience Level */}
                                <div className="sidebar__section">
                                    <button
                                        className="sidebar__section-header"
                                        onClick={() => toggleSection('experience')}
                                    >
                                        <div className="sidebar__section-title">
                                            <Briefcase size={18} />
                                            <span>Experience Level</span>
                                            {filters.experienceLevels.length > 0 && (
                                                <span className="sidebar__count">{filters.experienceLevels.length}</span>
                                            )}
                                        </div>
                                        {expandedSections.experience ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>

                                    <AnimatePresence>
                                        {expandedSections.experience && (
                                            <motion.div
                                                className="sidebar__section-content"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="sidebar__tags">
                                                    {experienceLevels.map(level => (
                                                        <button
                                                            key={level}
                                                            className={`tag ${filters.experienceLevels.includes(level) ? 'tag--active' : ''}`}
                                                            onClick={() => handleExperienceToggle(level)}
                                                        >
                                                            {level}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Location Radius */}
                                <div className="sidebar__section">
                                    <button
                                        className="sidebar__section-header"
                                        onClick={() => toggleSection('location')}
                                    >
                                        <div className="sidebar__section-title">
                                            <MapPin size={18} />
                                            <span>Location Radius</span>
                                        </div>
                                        {expandedSections.location ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>

                                    <AnimatePresence>
                                        {expandedSections.location && (
                                            <motion.div
                                                className="sidebar__section-content"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="sidebar__radius">
                                                    <p className="sidebar__radius-info">
                                                        Filter jobs within a radius from map center
                                                    </p>
                                                    <div className="sidebar__radius-display">
                                                        {filters.radius === 0 ? 'No limit' : `${filters.radius} km`}
                                                    </div>
                                                    <input
                                                        type="range"
                                                        className="range-slider"
                                                        min="0"
                                                        max="500"
                                                        step="25"
                                                        value={filters.radius}
                                                        onChange={(e) => setFilters({ radius: parseInt(e.target.value) })}
                                                    />
                                                    <div className="sidebar__radius-labels">
                                                        <span>No limit</span>
                                                        <span>500 km</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
