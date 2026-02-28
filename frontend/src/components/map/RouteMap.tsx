import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Source, Destination, TruckRoute } from '../../types/routing'
import SourceMarker from './SourceMarker'
import DestinationMarker from './DestinationMarker'
import RoutePolyline from './RoutePolyline'

interface RouteMapProps {
  sources: Source[]
  destinations: Destination[]
  routes: TruckRoute[]
}

const US_CENTER: [number, number] = [39.8283, -98.5795]
const DEFAULT_ZOOM = 5

export default function RouteMap({ sources, destinations, routes }: RouteMapProps) {
  return (
    <MapContainer
      center={US_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {sources.map((s) => (
        <SourceMarker key={s.id} source={s} />
      ))}
      {destinations.map((d) => (
        <DestinationMarker key={d.id} destination={d} />
      ))}
      {routes.map((r, i) => (
        <RoutePolyline key={r.truckId} legs={r.legs} truckIndex={i} />
      ))}
    </MapContainer>
  )
}
