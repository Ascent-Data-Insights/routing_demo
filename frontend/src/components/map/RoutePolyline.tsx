import { Polyline, Popup } from 'react-leaflet'
import type { RouteGeometry } from '../../types/routing'

const ROUTE_COLORS = [
  '#03344E', '#FB8500', '#4785BF', '#2a9d8f',
  '#e76f51', '#6a4c93', '#1982c4', '#8ac926',
]

interface RoutePolylineProps {
  legs: RouteGeometry[]
  truckIndex: number
}

export default function RoutePolyline({ legs, truckIndex }: RoutePolylineProps) {
  const color = ROUTE_COLORS[truckIndex % ROUTE_COLORS.length]

  return (
    <>
      {legs.map((leg, i) => (
        <Polyline
          key={i}
          positions={leg.coordinates}
          pathOptions={{ color, weight: 4, opacity: 0.8 }}
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
