import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useStore } from './lib/store'
import HomePage from './pages/HomePage'
import TrackerPage from './pages/TrackerPage'
import AdminPage from './pages/AdminPage'
import JobPage from './pages/JobPage'
import AuthModal from './components/AuthModal'
import SuggestionModal from './components/SuggestionModal'
import './App.css'

function App() {
  const { initAuth, fetchJobs, fetchUserJobs, user, theme } = useStore()

  useEffect(() => {
    // Initialize authentication
    initAuth()
    // Fetch jobs
    fetchJobs()
  }, [])

  useEffect(() => {
    // Fetch user's saved/applied jobs when user changes
    if (user) {
      fetchUserJobs()
    }
  }, [user])

  useEffect(() => {
    // Apply theme
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tracker" element={<TrackerPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/job/:jobId" element={<JobPage />} />
      </Routes>

      <AuthModal />
      <SuggestionModal />
    </div>
  )
}

export default App
