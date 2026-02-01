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
    <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-${remoteType}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color.main};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color.dark};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow-${remoteType}" x="-50%" y="-50%" width="200%" height="200%">
           <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
           <feOffset dx="0" dy="2" result="offsetblur"/>
           <feFlood flood-color="rgba(0,0,0,0.2)"/>
           <feComposite in2="offsetblur" operator="in"/>
           <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#shadow-${remoteType})">
        <path d="M20 0C8.954 0 0 8.954 0 20c0 15 20 28 20 28s20-13 20-28C40 8.954 31.046 0 20 0z" 
              fill="url(#grad-${remoteType})"/>
        <circle cx="20" cy="20" r="8" fill="white" fill-opacity="0.95"/>
        ${remoteType === 'remote' ? '<path d="M16 20h8M20 16v8" stroke="' + color.main + '" stroke-width="2" stroke-linecap="round"/>' : ''}
        ${remoteType === 'hybrid' ? '<circle cx="20" cy="20" r="2" fill="' + color.main + '"/>' : ''}
      </g>
    </svg>
  `

  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48],
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
