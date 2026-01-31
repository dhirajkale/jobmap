import { useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useStore } from '../lib/store'
import JobCard from './JobCard'

// Create custom marker icons
const createMarkerIcon = (remoteType) => {
    const colors = {
        remote: { main: '#3b82f6', dark: '#1d4ed8' },
        hybrid: { main: '#22c55e', dark: '#16a34a' },
        office: { main: '#ef4444', dark: '#dc2626' },
    }

    const color = colors[remoteType] || colors.office

    const svg = `
    <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-${remoteType}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color.main};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color.dark};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow-${remoteType}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24c0-8.837-7.163-16-16-16z" 
            fill="url(#grad-${remoteType})" filter="url(#shadow-${remoteType})"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>
  `

    return L.divIcon({
        html: svg,
        className: 'custom-marker',
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -40],
    })
}

export default function JobMarker({ job }) {
    const { savedJobs, appliedJobs, user } = useStore()

    const icon = useMemo(() => createMarkerIcon(job.remote_type), [job.remote_type])

    const isSaved = savedJobs.some(j => j.id === job.id)
    const isApplied = appliedJobs.some(j => j.id === job.id)

    return (
        <Marker
            position={[job.location_lat, job.location_lng]}
            icon={icon}
        >
            <Popup className="job-popup" maxWidth={320} minWidth={280}>
                <JobCard job={job} isSaved={isSaved} isApplied={isApplied} compact />
            </Popup>
        </Marker>
    )
}
