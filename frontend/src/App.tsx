import { useEffect, useState } from 'react'
import logo from './assets/logo.png'
import RouteMap from './components/map/RouteMap'
import TruckVisual from './components/truck/TruckVisual'
import { getRoute } from './services/osrm'
import type {
  OptimizationRequest,
  OptimizationResponse,
  TruckRoute,
} from './types/routing'

// Mock request — what the frontend would send to the backend
const TEST_REQUEST: OptimizationRequest = {
  sources: [
    { id: 'bristol-court', lat: '39.2731574', lon: '-84.3042902' },
  ],
  destinations: [
    { id: 'cocoon-coffee', lat: '39.3303521', lon: '-84.3304552' },
    { id: '100-w-5th', lat: '39.1013303', lon: '-84.5150988' },
    { id: 'nku', lat: '39.0346853', lon: '-84.4659598' },
  ],
  containers: [
    { container_id: 'C1', source_id: 'bristol-court', destination_id: 'cocoon-coffee', size: 2, temperature: 'AM' },
    { container_id: 'C2', source_id: 'bristol-court', destination_id: '100-w-5th', size: 3, temperature: 'RE' },
    { container_id: 'C3', source_id: 'bristol-court', destination_id: 'nku', size: 4, temperature: 'AM' },
  ],
  truck_size: { AM: 10, RE: 5 },
}

// Mock response — what the backend would return
const TEST_RESPONSE: OptimizationResponse = {
  trucks: [
    {
      id: 'T1',
      source_id: 'bristol-court',
      destination_ids: ['cocoon-coffee', '100-w-5th'],
      container_ids: ['C1', 'C2'],
    },
    {
      id: 'T2',
      source_id: 'bristol-court',
      destination_ids: ['nku'],
      container_ids: ['C3'],
    },
  ],
}

function buildWaypoints(request: OptimizationRequest, response: OptimizationResponse) {
  const locationMap = new Map(
    [...request.sources, ...request.destinations].map((loc) => [
      loc.id,
      { lat: parseFloat(loc.lat), lon: parseFloat(loc.lon) },
    ])
  )

  return response.trucks.map((truck) => {
    const source = locationMap.get(truck.source_id)!
    const stops = truck.destination_ids.map((id) => locationMap.get(id)!)
    // source → destinations in order → back to source
    return { truckId: truck.id, waypoints: [source, ...stops, source] }
  })
}

function App() {
  const [routes, setRoutes] = useState<TruckRoute[]>([])

  useEffect(() => {
    const truckWaypoints = buildWaypoints(TEST_REQUEST, TEST_RESPONSE)

    Promise.all(
      truckWaypoints.map(async ({ truckId, waypoints }) => {
        const geometry = await getRoute(waypoints)
        return { truckId, legs: [geometry] } as TruckRoute
      })
    ).then(setRoutes)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-zinc-100 font-body">
      {/* Header */}
      <header className="shrink-0 bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <nav className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center space-x-4">
              <img src={logo} alt="Ascent Data Insights" className="h-10 lg:h-14 w-auto" />
              <div className="h-8 w-px bg-gray-300" />
              <span className="font-heading text-xl lg:text-2xl font-semibold text-primary">
                Routing Tech Demo
              </span>
            </div>
          </div>
        </nav>
      </header>

      {/* Two-panel layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel — Configuration sidebar */}
        <aside className="w-80 shrink-0 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <h2 className="font-heading text-lg font-semibold text-primary mb-4">Configuration</h2>
          <p className="text-sm text-gray-500">Controls will go here.</p>
        </aside>

        {/* Right panel — Map + Trucks */}
        <div className="flex-1 min-w-0 flex flex-col">
          <main className="flex-1 min-h-0">
            <RouteMap
              sources={TEST_REQUEST.sources}
              destinations={TEST_REQUEST.destinations}
              routes={routes}
            />
          </main>

          {/* Bottom panel — Truck visuals */}
          <div className="shrink-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center gap-6 overflow-x-auto">
            <TruckVisual
              truckId="T-TEST"
              ambientCapacity={10}
              refrigeratedCapacity={10}
              ambientUsed={5}
              refrigeratedUsed={5}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
