import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Moon,
    Sun,
    User,
    LogOut,
    Bookmark,
    Plus,
    Settings,
    ChevronDown,
    Menu,
    Map,
    LayoutDashboard
} from 'lucide-react'
import { useStore } from '../lib/store'
import './Header.css'

export default function Header() {
    const {
        user,
        profile,
        theme,
        toggleTheme,
        signOut,
        setAuthModalOpen,
        setSuggestionModalOpen
    } = useStore()
    const navigate = useNavigate()
    const location = useLocation()
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleSignOut = async () => {
        await signOut()
        setDropdownOpen(false)
        navigate('/')
    }

    const getInitials = () => {
        if (profile?.full_name) {
            return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
        }
        if (user?.email) {
            return user.email[0].toUpperCase()
        }
        return 'U'
    }

    return (
        <header className="header glass">
            {/* Logo */}
            <Link to="/" className="header__logo">
                <div className="header__logo-icon gradient-text">
                    <Map size={28} />
                </div>
                <span className="gradient-text">JobMap</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="header__nav hide-mobile">
                <Link
                    to="/"
                    className={`header__nav-link ${location.pathname === '/' ? 'header__nav-link--active' : ''}`}
                >
                    <Map size={18} />
                    Explore
                </Link>
                {user && (
                    <Link
                        to="/tracker"
                        className={`header__nav-link ${location.pathname === '/tracker' ? 'header__nav-link--active' : ''}`}
                    >
                        <Bookmark size={18} />
                        My Jobs
                    </Link>
                )}
                {profile?.is_admin && (
                    <Link
                        to="/admin"
                        className={`header__nav-link ${location.pathname === '/admin' ? 'header__nav-link--active' : ''}`}
                    >
                        <LayoutDashboard size={18} />
                        Admin
                    </Link>
                )}
            </nav>

            {/* Actions */}
            <div className="header__actions">
                {/* Suggest Job Button */}
                <button
                    className="btn btn--secondary hide-mobile"
                    onClick={() => user ? setSuggestionModalOpen(true) : setAuthModalOpen(true)}
                >
                    <Plus size={16} />
                    Suggest Job
                </button>

                {/* Theme Toggle */}
                <button
                    className="btn btn--icon btn--ghost"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                >
                    <AnimatePresence mode="wait">
                        {theme === 'light' ? (
                            <motion.div
                                key="moon"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Moon size={20} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="sun"
                                initial={{ rotate: 90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: -90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Sun size={20} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>

                {/* User Menu */}
                {user ? (
                    <div className="dropdown">
                        <button
                            className="header__user-btn"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                        >
                            <div className="avatar avatar--small">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="" />
                                ) : (
                                    getInitials()
                                )}
                            </div>
                            <ChevronDown size={16} className={`header__dropdown-arrow ${dropdownOpen ? 'rotate' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {dropdownOpen && (
                                <>
                                    <motion.div
                                        className="dropdown__backdrop"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setDropdownOpen(false)}
                                    />
                                    <motion.div
                                        className="dropdown__menu"
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <div className="dropdown__header">
                                            <div className="avatar">
                                                {profile?.avatar_url ? (
                                                    <img src={profile.avatar_url} alt="" />
                                                ) : (
                                                    getInitials()
                                                )}
                                            </div>
                                            <div className="dropdown__user-info">
                                                <span className="dropdown__user-name">{profile?.full_name || 'User'}</span>
                                                <span className="dropdown__user-email">{user.email}</span>
                                            </div>
                                        </div>

                                        <div className="dropdown__divider" />

                                        <Link
                                            to="/tracker"
                                            className="dropdown__item"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <Bookmark size={18} />
                                            My Jobs
                                        </Link>

                                        <button
                                            className="dropdown__item"
                                            onClick={() => {
                                                setSuggestionModalOpen(true)
                                                setDropdownOpen(false)
                                            }}
                                        >
                                            <Plus size={18} />
                                            Suggest a Job
                                        </button>

                                        {profile?.is_admin && (
                                            <Link
                                                to="/admin"
                                                className="dropdown__item"
                                                onClick={() => setDropdownOpen(false)}
                                            >
                                                <Settings size={18} />
                                                Admin Dashboard
                                            </Link>
                                        )}

                                        <div className="dropdown__divider" />

                                        <button
                                            className="dropdown__item dropdown__item--danger"
                                            onClick={handleSignOut}
                                        >
                                            <LogOut size={18} />
                                            Sign Out
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <button
                        className="btn btn--primary"
                        onClick={() => setAuthModalOpen(true)}
                    >
                        <User size={16} />
                        <span className="hide-mobile">Sign In</span>
                    </button>
                )}

                {/* Mobile Menu Toggle */}
                <button
                    className="btn btn--icon btn--ghost hide-desktop"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    <Menu size={20} />
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            className="header__mobile-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <motion.nav
                            className="header__mobile-menu glass"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <Link
                                to="/"
                                className="header__mobile-link"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Map size={20} />
                                Explore Map
                            </Link>
                            {user && (
                                <Link
                                    to="/tracker"
                                    className="header__mobile-link"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Bookmark size={20} />
                                    My Jobs
                                </Link>
                            )}
                            <button
                                className="header__mobile-link"
                                onClick={() => {
                                    setMobileMenuOpen(false)
                                    user ? setSuggestionModalOpen(true) : setAuthModalOpen(true)
                                }}
                            >
                                <Plus size={20} />
                                Suggest Job
                            </button>
                            {profile?.is_admin && (
                                <Link
                                    to="/admin"
                                    className="header__mobile-link"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Settings size={20} />
                                    Admin
                                </Link>
                            )}
                        </motion.nav>
                    </>
                )}
            </AnimatePresence>
        </header>
    )
}
