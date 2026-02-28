import { useEffect, useState } from 'react'
import logo from './assets/logo.png'
import RouteMap from './components/map/RouteMap'
import { getRoute } from './services/osrm'
import type { Source, Destination, TruckRoute } from './types/routing'

const TEST_SOURCE: Source = {
  id: 'bristol-court',
  lat: '39.2731574',
  lon: '-84.3042902',
}

const TEST_DESTINATION: Destination = {
  id: 'cocoon-coffee',
  lat: '39.3303521',
  lon: '-84.3304552',
}

function App() {
  const [routes, setRoutes] = useState<TruckRoute[]>([])

  useEffect(() => {
    getRoute([
      { lat: parseFloat(TEST_SOURCE.lat), lon: parseFloat(TEST_SOURCE.lon) },
      { lat: parseFloat(TEST_DESTINATION.lat), lon: parseFloat(TEST_DESTINATION.lon) },
    ]).then((geometry) => {
      setRoutes([{ truckId: 'test-truck', legs: [geometry] }])
    })
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

        {/* Right panel — Map */}
        <main className="flex-1 min-w-0">
          <RouteMap
            sources={[TEST_SOURCE]}
            destinations={[TEST_DESTINATION]}
            routes={routes}
          />
        </main>
      </div>
    </div>
  )
}

export default App
