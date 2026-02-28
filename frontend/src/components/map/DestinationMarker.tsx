import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { Destination } from '../../types/routing'

const destinationIcon = L.divIcon({
  className: '',
  html: `<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="6" fill="#FB8500" stroke="white" stroke-width="2"/>
  </svg>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -7],
})

interface DestinationMarkerProps {
  destination: Destination
}

export default function DestinationMarker({ destination }: DestinationMarkerProps) {
  return (
    <Marker
      position={[parseFloat(destination.lat), parseFloat(destination.lon)]}
      icon={destinationIcon}
    >
      <Popup>
        <strong>Destination</strong>
        <br />
        ID: {destination.id}
      </Popup>
    </Marker>
  )
}
