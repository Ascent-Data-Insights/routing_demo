import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Source, Destination, TruckRoute, LabelMaps } from '../../types/routing'
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
  labelMaps?: LabelMaps
  mapVisible?: boolean
}

const US_CENTER: [number, number] = [39.8283, -98.5795]
const DEFAULT_ZOOM = 5

function FitBounds({ sources, destinations, mapVisible }: { sources: Source[]; destinations: Destination[]; mapVisible?: boolean }) {
  const map = useMap()

  // Re-fit whenever the source/destination set changes
  useEffect(() => {
    const points = [
      ...sources.map((s) => L.latLng(parseFloat(s.lat), parseFloat(s.lon))),
      ...destinations.map((d) => L.latLng(parseFloat(d.lat), parseFloat(d.lon))),
    ]
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50] })
    }
  }, [map, sources, destinations])

  // When the map tab becomes visible the container goes from display:none → visible,
  // so Leaflet needs invalidateSize before fitBounds will compute correct bounds.
  useEffect(() => {
    if (!mapVisible) return
    const points = [
      ...sources.map((s) => L.latLng(parseFloat(s.lat), parseFloat(s.lon))),
      ...destinations.map((d) => L.latLng(parseFloat(d.lat), parseFloat(d.lon))),
    ]
    map.invalidateSize()
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50] })
    }
  }, [mapVisible])

  return null
}

export default function RouteMap({
  sources,
  destinations,
  routes,
  highlightedTruckId,
  highlightedSourceIds,
  highlightedDestinationIds,
  labelMaps,
  mapVisible,
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
      <FitBounds sources={sources} destinations={destinations} mapVisible={mapVisible} />
      {sources.map((s) => (
        <SourceMarker key={s.id} source={s} highlighted={highlightedSourceIds?.has(s.id)} label={labelMaps?.sources.get(s.id)} />
      ))}
      {destinations.map((d) => (
        <DestinationMarker key={d.id} destination={d} highlighted={highlightedDestinationIds?.has(d.id)} label={labelMaps?.dests.get(d.id)} />
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
