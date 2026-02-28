import { Polyline, Popup } from 'react-leaflet'
import type { RouteGeometry } from '../../types/routing'
import { ROUTE_COLORS } from '../../constants'

interface RoutePolylineProps {
  legs: RouteGeometry[]
  truckIndex: number
  dimmed?: boolean
}

export default function RoutePolyline({ legs, truckIndex, dimmed = false }: RoutePolylineProps) {
  const color = ROUTE_COLORS[truckIndex % ROUTE_COLORS.length]

  return (
    <>
      {legs.map((leg, i) => (
        <Polyline
          key={i}
          positions={leg.coordinates}
          pathOptions={{
            color,
            weight: dimmed ? 2 : 4,
            opacity: dimmed ? 0.15 : 0.8,
          }}
        >
          <Popup>
            <strong>Leg {i + 1}</strong>
            <br />
            Distance: {(leg.distance / 1609.34).toFixed(1)} mi
            <br />
            Duration: {Math.round(leg.duration / 60)} min
          </Popup>
        </Polyline>
      ))}
    </>
  )
}
