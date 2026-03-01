import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { Source } from '../../types/routing'

// Simple house: triangle roof + square body with label inside.
// viewBox 0 0 36 36. Roof: (1,15)→(18,1)→(35,15). Body: rect (3,14)→(33,34).
function makeSourceIcon(highlighted: boolean, label?: string) {
  const ring = highlighted
    ? `<circle cx="18" cy="18" r="22" fill="none" stroke="#facc15" stroke-width="3" opacity="0.9"/>`
    : ''
  const text = label
    ? `<text x="18" y="29" font-size="10" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="auto" font-family="sans-serif">${label}</text>`
    : ''
  return L.divIcon({
    className: '',
    html: `<svg width="56" height="56" viewBox="-10 -10 56 56" xmlns="http://www.w3.org/2000/svg">
      ${ring}
      <polygon points="1,15 18,1 35,15" fill="#03344E" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="3" y="14" width="30" height="20" rx="1" fill="#03344E" stroke="white" stroke-width="1.5"/>
      ${text}
    </svg>`,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
    popupAnchor: [0, -28],
  })
}

interface SourceMarkerProps {
  source: Source
  highlighted?: boolean
  label?: string
}

export default function SourceMarker({ source, highlighted = false, label }: SourceMarkerProps) {
  return (
    <Marker
      position={[parseFloat(source.lat), parseFloat(source.lon)]}
      icon={makeSourceIcon(highlighted, label)}
    >
      <Popup>
        <strong>{label ?? 'Source'}</strong>
        <br />
        ID: {source.id}
      </Popup>
    </Marker>
  )
}
