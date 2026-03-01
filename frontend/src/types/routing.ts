// API contract types (matching CLAUDE.md)

export interface Source {
  id: string
  lat: string
  lon: string
}

export interface Destination {
  id: string
  lat: string
  lon: string
}

export interface Container {
  container_id: string
  destination_id: string
  source_id: string
  size: number
  temperature: 'AM' | 'RE'
}

export interface TruckSize {
  AM: number
  RE: number
}

export interface Truck {
  id: string
  source_id: string
  destination_ids: string[]
  container_ids: string[]
  route_distance_meters: number
  route_duration_seconds: number
}

export interface Node {
  id: number
  name: string
  lat: number
  lon: number
}

// API request/response
export interface OptimizationRequest {
  sources: Source[]
  destinations: Destination[]
  containers: Container[]
  truck_size: TruckSize
}

export interface Solution {
  trucks: Truck[]
  total_distance_meters: number
  total_duration_seconds: number
}

export interface OptimizationResponse {
  greedy: Solution
  optimized: Solution
}

// Map-specific types

export interface LatLon {
  lat: number
  lon: number
}

export interface RouteGeometry {
  coordinates: [number, number][] // [lat, lon] pairs for Leaflet
  distance: number // meters
  duration: number // seconds
}

export interface TruckRoute {
  truckId: string
  legs: RouteGeometry[]
}
