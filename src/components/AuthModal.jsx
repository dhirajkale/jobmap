import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, Loader2 } from 'lucide-react'
import { useStore } from '../lib/store'
import toast from 'react-hot-toast'
import './Modal.css'

export default function AuthModal() {
    const { authModalOpen, setAuthModalOpen, signIn, signUp, isLoading } = useStore()
    const [mode, setMode] = useState('signin') // signin, signup
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [errors, setErrors] = useState({})

    const resetForm = () => {
        setEmail('')
        setPassword('')
        setFullName('')
        setErrors({})
    }

    const handleClose = () => {
        setAuthModalOpen(false)
        resetForm()
    }

    const validate = () => {
        const newErrors = {}

        if (!email) {
            newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Invalid email address'
        }

        if (!password) {
            newErrors.password = 'Password is required'
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters'
        }

        if (mode === 'signup' && !fullName) {
            newErrors.fullName = 'Full name is required'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validate()) return

        if (mode === 'signin') {
            const { error } = await signIn(email, password)
            if (error) {
                toast.error(error.message || 'Failed to sign in')
            } else {
                toast.success('Welcome back!')
                handleClose()
            }
        } else {
            const { data, error } = await signUp(email, password, fullName)
            if (error) {
                toast.error(error.message || 'Failed to sign up')
            } else if (data?.user?.identities?.length === 0) {
                toast.error('An account with this email already exists')
            } else {
                toast.success('Account created! Check your email to verify.')
                handleClose()
            }
        }
    }

    return (
        <AnimatePresence>
            {authModalOpen && (
                <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                >
                    <motion.div
                        className="modal"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="modal__header">
                            <h2 className="modal__title">
                                {mode === 'signin' ? 'Welcome back' : 'Create account'}
                            </h2>
                            <button className="modal__close" onClick={handleClose}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="modal__content">
                            <p className="modal__subtitle">
                                {mode === 'signin'
                                    ? 'Sign in to save and track your job applications'
                                    : 'Join JobMap to save jobs and track your applications'}
                            </p>

                            <form onSubmit={handleSubmit} className="auth-form">
                                {mode === 'signup' && (
                                    <div className="form-group">
                                        <label className="label" htmlFor="fullName">Full Name</label>
                                        <div className="input-wrapper">
                                            <User size={18} className="input-wrapper__icon" />
                                            <input
                                                type="text"
                                                id="fullName"
                                                className={`input input--with-icon ${errors.fullName ? 'input--error' : ''}`}
                                                placeholder="John Doe"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                            />
                                        </div>
                                        {errors.fullName && <span className="form-error">{errors.fullName}</span>}
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="label" htmlFor="email">Email</label>
                                    <div className="input-wrapper">
                                        <Mail size={18} className="input-wrapper__icon" />
                                        <input
                                            type="email"
                                            id="email"
                                            className={`input input--with-icon ${errors.email ? 'input--error' : ''}`}
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    {errors.email && <span className="form-error">{errors.email}</span>}
                                </div>

                                <div className="form-group">
                                    <label className="label" htmlFor="password">Password</label>
                                    <div className="input-wrapper">
                                        <Lock size={18} className="input-wrapper__icon" />
                                        <input
                                            type="password"
                                            id="password"
                                            className={`input input--with-icon ${errors.password ? 'input--error' : ''}`}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                    {errors.password && <span className="form-error">{errors.password}</span>}
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn--primary btn--large auth-form__submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={18} className="spinner-icon" />
                                            {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                                        </>
                                    ) : (
                                        mode === 'signin' ? 'Sign In' : 'Create Account'
                                    )}
                                </button>
                            </form>

                            <div className="auth-form__divider">
                                <span>or</span>
                            </div>

                            <p className="auth-form__switch">
                                {mode === 'signin' ? (
                                    <>
                                        Don't have an account?{' '}
                                        <button
                                            type="button"
                                            className="auth-form__link"
                                            onClick={() => {
                                                setMode('signup')
                                                setErrors({})
                                            }}
                                        >
                                            Sign up
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        Already have an account?{' '}
                                        <button
                                            type="button"
                                            className="auth-form__link"
                                            onClick={() => {
                                                setMode('signin')
                                                setErrors({})
                                            }}
                                        >
                                            Sign in
                                        </button>
                                    </>
                                )}
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
