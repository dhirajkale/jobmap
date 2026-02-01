import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { useStore } from '../lib/store'
import JobMarker from './JobMarker'
import './Map.css'

// Component to handle map events
function MapController() {
    const map = useMap()
    const { setMapCenter, setMapZoom, filters, setFilters } = useStore()

    useEffect(() => {
        const handleMoveEnd = () => {
            const center = map.getCenter()
            setMapCenter([center.lat, center.lng])
            setMapZoom(map.getZoom())

            // Update center for radius filter
            if (filters.radius > 0) {
                setFilters({
                    centerLat: center.lat,
                    centerLng: center.lng
                })
            }
        }

        map.on('moveend', handleMoveEnd)

        return () => {
            map.off('moveend', handleMoveEnd)
        }
    }, [map, filters.radius])

    return null
}

// Custom cluster icon
const createClusterCustomIcon = (cluster) => {
    const count = cluster.getChildCount()
    let size = 'small'
    if (count >= 100) size = 'large'
    else if (count >= 10) size = 'medium'

    return L.divIcon({
        html: `<div class="marker-cluster marker-cluster-${size}">${count}</div>`,
        className: 'custom-cluster-icon',
        iconSize: L.point(size === 'large' ? 60 : size === 'medium' ? 50 : 40, size === 'large' ? 60 : size === 'medium' ? 50 : 40, true),
    })
}

export default function Map() {
    const { filteredJobs, mapCenter, mapZoom, theme, jobsLoading } = useStore()

    // Use OpenStreetMap standard tiles
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

    const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

    return (
        <div className="map-container">
            {jobsLoading && (
                <div className="map-loading">
                    <div className="spinner spinner--large"></div>
                    <p>Loading jobs...</p>
                </div>
            )}

            <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                className="map"
                zoomControl={true}
                scrollWheelZoom={true}
            >
                <TileLayer url={tileUrl} attribution={attribution} />
                <MapController />

                <MarkerClusterGroup
                    chunkedLoading
                    iconCreateFunction={createClusterCustomIcon}
                    maxClusterRadius={60}
                    spiderfyOnMaxZoom={true}
                    showCoverageOnHover={false}
                    zoomToBoundsOnClick={true}
                    disableClusteringAtZoom={16}
                >
                    {filteredJobs.map((job) => (
                        <JobMarker key={job.id} job={job} />
                    ))}
                </MarkerClusterGroup>
            </MapContainer>

            {/* Map Legend */}
            <div className="map-legend glass">
                <div className="map-legend__item">
                    <span className="map-legend__dot map-legend__dot--remote"></span>
                    <span>Remote</span>
                </div>
                <div className="map-legend__item">
                    <span className="map-legend__dot map-legend__dot--hybrid"></span>
                    <span>Hybrid</span>
                </div>
                <div className="map-legend__item">
                    <span className="map-legend__dot map-legend__dot--office"></span>
                    <span>Office</span>
                </div>
            </div>

            {/* Job Count Badge */}
            <div className="map-count glass">
                <strong>{filteredJobs.length}</strong> jobs found
            </div>
        </div>
    )
}
