import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Source, Destination, TruckRoute } from '../../types/routing'
import SourceMarker from './SourceMarker'
import DestinationMarker from './DestinationMarker'
import RoutePolyline from './RoutePolyline'

interface RouteMapProps {
  sources: Source[]
  destinations: Destination[]
  routes: TruckRoute[]
  highlightedTruckId?: string | null
  highlightedSourceIds?: Set<string>
  highlightedDestinationIds?: Set<string>
}

const US_CENTER: [number, number] = [39.8283, -98.5795]
const DEFAULT_ZOOM = 5

function FitBounds({ sources, destinations }: { sources: Source[]; destinations: Destination[] }) {
  const map = useMap()

  useEffect(() => {
    const points = [
      ...sources.map((s) => L.latLng(parseFloat(s.lat), parseFloat(s.lon))),
      ...destinations.map((d) => L.latLng(parseFloat(d.lat), parseFloat(d.lon))),
    ]
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50] })
    }
  }, [map, sources, destinations])

  return null
}

export default function RouteMap({
  sources,
  destinations,
  routes,
  highlightedTruckId,
  highlightedSourceIds,
  highlightedDestinationIds,
}: RouteMapProps) {
  return (
    <MapContainer
      center={US_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />
      <FitBounds sources={sources} destinations={destinations} />
      {sources.map((s) => (
        <SourceMarker key={s.id} source={s} highlighted={highlightedSourceIds?.has(s.id)} />
      ))}
      {destinations.map((d) => (
        <DestinationMarker key={d.id} destination={d} highlighted={highlightedDestinationIds?.has(d.id)} />
      ))}
      {routes.map((r, i) => (
        <RoutePolyline
          key={r.truckId}
          legs={r.legs}
          truckIndex={i}
          dimmed={highlightedTruckId != null && r.truckId !== highlightedTruckId}
        />
      ))}
    </MapContainer>
  )
}
