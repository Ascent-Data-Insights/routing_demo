import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { Source } from '../../types/routing'

const sourceIcon = L.divIcon({
  className: '',
  html: `<svg width="32" height="32" viewBox="-2 -2 28 28" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="15" fill="#03344E" stroke="white" stroke-width="1.5"/>
    <g stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.132-1.803l7.95-3.974a2 2 0 0 1 1.837 0l7.948 3.974A2 2 0 0 1 22 8z"/>
      <path d="M18 21V10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v11"/>
      <path d="M6 13h12"/>
      <path d="M6 17h12"/>
    </g>
  </svg>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
})

interface SourceMarkerProps {
  source: Source
}

export default function SourceMarker({ source }: SourceMarkerProps) {
  return (
    <Marker
      position={[parseFloat(source.lat), parseFloat(source.lon)]}
      icon={sourceIcon}
    >
      <Popup>
        <strong>Source</strong>
        <br />
        ID: {source.id}
      </Popup>
    </Marker>
  )
}
