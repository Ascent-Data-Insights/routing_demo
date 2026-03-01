import type { LatLon, RouteGeometry, TruckRoute } from '../types/routing'

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving'

export async function getRoute(waypoints: LatLon[]): Promise<RouteGeometry> {
  // OSRM expects lon,lat order
  const coords = waypoints.map((w) => `${w.lon},${w.lat}`).join(';')
  const url = `${OSRM_BASE}/${coords}?overview=simplified&geometries=geojson`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`OSRM request failed: ${res.status}`)

  const data = await res.json()
  const route = data.routes?.[0]
  if (!route) throw new Error('No route found')

  return {
    // GeoJSON is [lon, lat] — flip to [lat, lon] for Leaflet
    coordinates: route.geometry.coordinates.map(
      ([lon, lat]: [number, number]) => [lat, lon] as [number, number]
    ),
    distance: route.distance,
    duration: route.duration,
  }
}

export async function getTruckRoute(
  source: LatLon,
  destinations: LatLon[]
): Promise<TruckRoute> {
  const legs: RouteGeometry[] = []
  let current = source

  for (const dest of destinations) {
    const leg = await getRoute([current, dest])
    legs.push(leg)
    current = dest
  }

  return {
    truckId: '',
    legs,
  }
}
