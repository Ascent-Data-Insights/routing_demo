import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { Source } from '../../types/routing'

function makeSourceIcon(highlighted: boolean) {
  const ring = highlighted
    ? `<circle cx="12" cy="12" r="18" fill="none" stroke="#facc15" stroke-width="3" opacity="0.9"/>`
    : ''
  return L.divIcon({
    className: '',
    html: `<svg width="40" height="40" viewBox="-6 -6 36 36" xmlns="http://www.w3.org/2000/svg">
      ${ring}
      <circle cx="12" cy="12" r="15" fill="#03344E" stroke="white" stroke-width="1.5"/>
      <g stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.132-1.803l7.95-3.974a2 2 0 0 1 1.837 0l7.948 3.974A2 2 0 0 1 22 8z"/>
        <path d="M18 21V10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v11"/>
        <path d="M6 13h12"/>
        <path d="M6 17h12"/>
      </g>
    </svg>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  })
}

interface SourceMarkerProps {
  source: Source
  highlighted?: boolean
}

export default function SourceMarker({ source, highlighted = false }: SourceMarkerProps) {
  return (
    <Marker
      position={[parseFloat(source.lat), parseFloat(source.lon)]}
      icon={makeSourceIcon(highlighted)}
    >
      <Popup>
        <strong>Source</strong>
        <br />
        ID: {source.id}
      </Popup>
    </Marker>
  )
}
