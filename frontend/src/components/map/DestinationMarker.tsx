import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { Destination } from '../../types/routing'

function makeDestinationIcon(highlighted: boolean) {
  return L.divIcon({
    className: '',
    html: highlighted
      ? `<svg width="22" height="22" viewBox="-4 -4 22 22" xmlns="http://www.w3.org/2000/svg">
           <circle cx="7" cy="7" r="10" fill="none" stroke="#facc15" stroke-width="3" opacity="0.9"/>
           <circle cx="7" cy="7" r="6" fill="#FB8500" stroke="white" stroke-width="2"/>
         </svg>`
      : `<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
           <circle cx="7" cy="7" r="6" fill="#FB8500" stroke="white" stroke-width="2"/>
         </svg>`,
    iconSize: highlighted ? [22, 22] : [14, 14],
    iconAnchor: highlighted ? [11, 11] : [7, 7],
    popupAnchor: [0, highlighted ? -11 : -7],
  })
}

interface DestinationMarkerProps {
  destination: Destination
  highlighted?: boolean
}

export default function DestinationMarker({ destination, highlighted = false }: DestinationMarkerProps) {
  return (
    <Marker
      position={[parseFloat(destination.lat), parseFloat(destination.lon)]}
      icon={makeDestinationIcon(highlighted)}
    >
      <Popup>
        <strong>Destination</strong>
        <br />
        ID: {destination.id}
      </Popup>
    </Marker>
  )
}
