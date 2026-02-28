import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { Destination } from '../../types/routing'

const destinationIcon = L.divIcon({
  className: '',
  html: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="3" fill="#FB8500" stroke="white" stroke-width="2"/>
  </svg>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
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
