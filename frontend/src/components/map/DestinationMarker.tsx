import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { Destination } from '../../types/routing'

function makeDestinationIcon(highlighted: boolean, label?: string) {
  const text = label
    ? `<text x="11" y="11" font-size="9" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central" font-family="sans-serif">${label}</text>`
    : ''
  if (highlighted) {
    return L.divIcon({
      className: '',
      html: `<svg width="28" height="28" viewBox="-3 -3 28 28" xmlns="http://www.w3.org/2000/svg">
               <circle cx="11" cy="11" r="13" fill="none" stroke="#facc15" stroke-width="3" opacity="0.9"/>
               <circle cx="11" cy="11" r="10" fill="#FB8500" stroke="white" stroke-width="1.5"/>
               ${text}
             </svg>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    })
  }
  return L.divIcon({
    className: '',
    html: `<svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
             <circle cx="11" cy="11" r="10" fill="#FB8500" stroke="white" stroke-width="1.5"/>
             ${text}
           </svg>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  })
}

interface DestinationMarkerProps {
  destination: Destination
  highlighted?: boolean
  label?: string
}

export default function DestinationMarker({ destination, highlighted = false, label }: DestinationMarkerProps) {
  return (
    <Marker
      position={[parseFloat(destination.lat), parseFloat(destination.lon)]}
      icon={makeDestinationIcon(highlighted, label)}
    >
      <Popup>
        <strong>{label ?? 'Destination'}</strong>
        <br />
        ID: {destination.id}
      </Popup>
    </Marker>
  )
}
