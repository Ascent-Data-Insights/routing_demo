import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { Source } from '../../types/routing'

const sourceIcon = L.divIcon({
  className: '',
  html: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#03344E" stroke="white" stroke-width="2"/>
  </svg>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
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
