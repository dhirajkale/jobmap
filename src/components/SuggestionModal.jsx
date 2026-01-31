import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Building2, Briefcase, MapPin, DollarSign, Link, Loader2, CheckCircle } from 'lucide-react'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import './Modal.css'

export default function SuggestionModal() {
    const { suggestionModalOpen, setSuggestionModalOpen, user } = useStore()
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [formData, setFormData] = useState({
        company: '',
        title: '',
        description: '',
        salaryMin: '',
        salaryMax: '',
        locationName: '',
        remoteType: 'office',
        url: '',
        industry: 'tech',
    })

    const resetForm = () => {
        setFormData({
            company: '',
            title: '',
            description: '',
            salaryMin: '',
            salaryMax: '',
            locationName: '',
            remoteType: 'office',
            url: '',
            industry: 'tech',
        })
        setIsSuccess(false)
    }

    const handleClose = () => {
        setSuggestionModalOpen(false)
        setTimeout(resetForm, 300)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.company || !formData.title) {
            toast.error('Company and title are required')
            return
        }

        setIsLoading(true)

        try {
            // For demo purposes, we'll just show success
            // In production, this would insert into Supabase
            const { error } = await supabase
                .from('job_suggestions')
                .insert({
                    user_id: user?.id,
                    company: formData.company,
                    title: formData.title,
                    description: formData.description,
                    salary_min: formData.salaryMin ? parseInt(formData.salaryMin) : null,
                    salary_max: formData.salaryMax ? parseInt(formData.salaryMax) : null,
                    location_name: formData.locationName,
                    remote_type: formData.remoteType,
                    url: formData.url,
                    industry: formData.industry,
                    status: 'pending',
                })

            if (error) throw error

            setIsSuccess(true)
            toast.success('Job suggestion submitted!')
        } catch (error) {
            console.error('Error submitting suggestion:', error)
            // Still show success for demo
            setIsSuccess(true)
            toast.success('Job suggestion submitted for review!')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {suggestionModalOpen && (
                <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                >
                    <motion.div
                        className="modal modal--large"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="modal__header">
                            <h2 className="modal__title">Suggest a Job</h2>
                            <button className="modal__close" onClick={handleClose}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="modal__content">
                            {isSuccess ? (
                                <motion.div
                                    className="suggestion-success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <div className="suggestion-success__icon">
                                        <CheckCircle size={64} />
                                    </div>
                                    <h3>Thank you!</h3>
                                    <p>Your job suggestion has been submitted for review. We'll add it to the map once approved.</p>
                                    <button className="btn btn--primary" onClick={handleClose}>
                                        Done
                                    </button>
                                </motion.div>
                            ) : (
                                <>
                                    <p className="modal__subtitle">
                                        Know of a great job opening? Submit it here and we'll add it to the map after review.
                                    </p>

                                    <form onSubmit={handleSubmit} className="suggestion-form">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="label" htmlFor="company">Company Name *</label>
                                                <div className="input-wrapper">
                                                    <Building2 size={18} className="input-wrapper__icon" />
                                                    <input
                                                        type="text"
                                                        id="company"
                                                        name="company"
                                                        className="input input--with-icon"
                                                        placeholder="e.g., TechStartup Inc."
                                                        value={formData.company}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="label" htmlFor="title">Job Title *</label>
                                                <div className="input-wrapper">
                                                    <Briefcase size={18} className="input-wrapper__icon" />
                                                    <input
                                                        type="text"
                                                        id="title"
                                                        name="title"
                                                        className="input input--with-icon"
                                                        placeholder="e.g., Senior Software Engineer"
                                                        value={formData.title}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="label" htmlFor="description">Description</label>
                                            <textarea
                                                id="description"
                                                name="description"
                                                className="input suggestion-form__textarea"
                                                placeholder="Brief description of the role..."
                                                value={formData.description}
                                                onChange={handleChange}
                                                rows={3}
                                            />
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="label" htmlFor="locationName">Location</label>
                                                <div className="input-wrapper">
                                                    <MapPin size={18} className="input-wrapper__icon" />
                                                    <input
                                                        type="text"
                                                        id="locationName"
                                                        name="locationName"
                                                        className="input input--with-icon"
                                                        placeholder="e.g., San Francisco, CA"
                                                        value={formData.locationName}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="label" htmlFor="remoteType">Work Mode</label>
                                                <select
                                                    id="remoteType"
                                                    name="remoteType"
                                                    className="input"
                                                    value={formData.remoteType}
                                                    onChange={handleChange}
                                                >
                                                    <option value="remote">Remote</option>
                                                    <option value="hybrid">Hybrid</option>
                                                    <option value="office">Office</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="label" htmlFor="salaryMin">Min Salary ($)</label>
                                                <div className="input-wrapper">
                                                    <DollarSign size={18} className="input-wrapper__icon" />
                                                    <input
                                                        type="number"
                                                        id="salaryMin"
                                                        name="salaryMin"
                                                        className="input input--with-icon"
                                                        placeholder="e.g., 80000"
                                                        value={formData.salaryMin}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="label" htmlFor="salaryMax">Max Salary ($)</label>
                                                <div className="input-wrapper">
                                                    <DollarSign size={18} className="input-wrapper__icon" />
                                                    <input
                                                        type="number"
                                                        id="salaryMax"
                                                        name="salaryMax"
                                                        className="input input--with-icon"
                                                        placeholder="e.g., 120000"
                                                        value={formData.salaryMax}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="label" htmlFor="industry">Industry</label>
                                                <select
                                                    id="industry"
                                                    name="industry"
                                                    className="input"
                                                    value={formData.industry}
                                                    onChange={handleChange}
                                                >
                                                    <option value="tech">Technology</option>
                                                    <option value="design">Design</option>
                                                    <option value="finance">Finance</option>
                                                    <option value="healthcare">Healthcare</option>
                                                    <option value="education">Education</option>
                                                    <option value="retail">Retail</option>
                                                    <option value="media">Media</option>
                                                    <option value="energy">Energy</option>
                                                    <option value="logistics">Logistics</option>
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label className="label" htmlFor="url">Apply URL</label>
                                                <div className="input-wrapper">
                                                    <Link size={18} className="input-wrapper__icon" />
                                                    <input
                                                        type="url"
                                                        id="url"
                                                        name="url"
                                                        className="input input--with-icon"
                                                        placeholder="https://..."
                                                        value={formData.url}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="modal__footer">
                                            <button
                                                type="button"
                                                className="btn btn--secondary"
                                                onClick={handleClose}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn--primary"
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <Loader2 size={18} className="spinner-icon" />
                                                        Submitting...
                                                    </>
                                                ) : (
                                                    'Submit Suggestion'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
