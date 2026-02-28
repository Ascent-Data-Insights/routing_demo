import { useEffect, useMemo, useState } from 'react'
import logo from './assets/logo.png'
import RouteMap from './components/map/RouteMap'
import TruckCard from './components/TruckCard'
import ConfigPanel from './components/ConfigPanel'
import { getRoute } from './services/osrm'
import { getNodes, optimize } from './services/api'
import { ROUTE_COLORS } from './constants'
import type {
  Node,
  OptimizationRequest,
  OptimizationResponse,
  TruckRoute,
} from './types/routing'
import { Settings } from 'lucide-react'

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
    return { truckId: truck.id, waypoints: [source, ...stops, source] }
  })
}

function buildRequest(
  nodes: Node[],
  numSources: number,
  numDests: number,
  numContainersAM: number,
  numContainersRE: number,
  truckCapacityAM: number,
  truckCapacityRE: number,
): OptimizationRequest {
  const sourceNodes = nodes.slice(0, numSources)
  const destNodes = nodes.slice(numSources, numSources + numDests)

  const sources = sourceNodes.map((n) => ({
    id: `src-${n.id}`,
    lat: String(n.lat),
    lon: String(n.lon),
  }))
  const destinations = destNodes.map((n) => ({
    id: `dst-${n.id}`,
    lat: String(n.lat),
    lon: String(n.lon),
  }))

  const pairs = sourceNodes.flatMap((src) => destNodes.map((dst) => ({ src, dst })))
  const amContainers = Array.from({ length: numContainersAM }, (_, k) => {
    const { src, dst } = pairs[k % pairs.length]
    return {
      container_id: `am-${k}`,
      source_id: `src-${src.id}`,
      destination_id: `dst-${dst.id}`,
      size: (k % 3) + 1,
      temperature: 'AM' as const,
    }
  })
  const reContainers = Array.from({ length: numContainersRE }, (_, k) => {
    const { src, dst } = pairs[k % pairs.length]
    return {
      container_id: `re-${k}`,
      source_id: `src-${src.id}`,
      destination_id: `dst-${dst.id}`,
      size: (k % 3) + 1,
      temperature: 'RE' as const,
    }
  })

  return {
    sources,
    destinations,
    containers: [...amContainers, ...reContainers],
    truck_size: { AM: truckCapacityAM, RE: truckCapacityRE },
  }
}

const MAX_SOURCES = 5
const MAX_DESTINATIONS = 10
const MAX_CONTAINERS = 30

function App() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [numSources, setNumSources] = useState(2)
  const [numDestinations, setNumDestinations] = useState(5)
  const [numContainersAM, setNumContainersAM] = useState(6)
  const [numContainersRE, setNumContainersRE] = useState(4)
  const [truckCapacityAM, setTruckCapacityAM] = useState(10)
  const [truckCapacityRE, setTruckCapacityRE] = useState(6)

  const [solution, setSolution] = useState<OptimizationResponse | null>(null)
  const [submittedRequest, setSubmittedRequest] = useState<OptimizationRequest | null>(null)
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null)
  const [routes, setRoutes] = useState<TruckRoute[]>([])
  const [running, setRunning] = useState(false)
  const [loadingRoutes, setLoadingRoutes] = useState(false)

  useEffect(() => {
    getNodes()
      .then(setNodes)
      .catch((err) => console.error('Failed to fetch nodes:', err))
  }, [])

  // Derived live preview — updates instantly as sliders move
  const previewRequest = useMemo(
    () =>
      nodes.length
        ? buildRequest(nodes, numSources, numDestinations, numContainersAM, numContainersRE, truckCapacityAM, truckCapacityRE)
        : null,
    [nodes, numSources, numDestinations, numContainersAM, numContainersRE, truckCapacityAM, truckCapacityRE]
  )

  function handleRun() {
    if (!previewRequest) return
    setSubmittedRequest(previewRequest)
    setSolution(null)
    setRoutes([])
    setSelectedTruckId(null)
    setRunning(true)

    optimize(previewRequest)
      .then(setSolution)
      .catch((err) => console.error('Optimization failed:', err))
      .finally(() => setRunning(false))
  }

  // Fetch OSRM routes whenever a new solution arrives
  useEffect(() => {
    if (!solution || !submittedRequest) return

    setLoadingRoutes(true)
    setSelectedTruckId(null)

    const truckWaypoints = buildWaypoints(submittedRequest, solution)
    Promise.all(
      truckWaypoints.map(async ({ truckId, waypoints }) => {
        const geometry = await getRoute(waypoints)
        return { truckId, legs: [geometry] } as TruckRoute
      })
    ).then((newRoutes) => {
      setRoutes(newRoutes)
      setLoadingRoutes(false)
    })
  }, [solution])

  // The map always shows the live preview locations (no routes until after Run)
  const mapSources = previewRequest?.sources ?? []
  const mapDestinations = previewRequest?.destinations ?? []

  // Container lookup by ID for the submitted request (used to populate truck visuals)
  const containerById = useMemo(() => {
    const map = new Map<string, { size: number; temperature: 'AM' | 'RE' }>()
    submittedRequest?.containers.forEach((c) =>
      map.set(c.container_id, { size: c.size, temperature: c.temperature })
    )
    return map
  }, [submittedRequest])

  return (
    <div className="h-screen flex flex-col bg-zinc-100 font-body">
      {/* Header */}
      <header className="shrink-0 bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <nav className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center space-x-4">
              <a href="https://ascentdi.com" target="_blank" rel="noopener noreferrer">
                <img src={logo} alt="Ascent Data Insights" className="h-10 lg:h-14 w-auto" />
              </a>
              <div className="h-8 w-px bg-gray-300" />
              <span className="font-heading text-xl lg:text-2xl font-semibold text-primary">
                Routing Tech Demo
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg text-primary hover:bg-zinc-100 transition-colors" title="Configuration">
                <Settings size={22} />
              </button>
              <a href="https://github.com/Ascent-Data-Insights/routing_demo" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-secondary transition-colors">
                <svg className="h-6 w-6 lg:h-7 lg:w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </nav>
      </header>

      {/* Main content: left panel + map */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel — config + preview/results */}
        <div className="w-1/2 flex flex-col border-r border-gray-200">
          <ConfigPanel
            numSources={numSources}
            numDestinations={numDestinations}
            numContainersAM={numContainersAM}
            numContainersRE={numContainersRE}
            truckCapacityAM={truckCapacityAM}
            truckCapacityRE={truckCapacityRE}
            maxSources={MAX_SOURCES}
            maxDestinations={MAX_DESTINATIONS}
            maxContainers={MAX_CONTAINERS}
            containers={previewRequest?.containers ?? []}
            onChangeSources={setNumSources}
            onChangeDestinations={setNumDestinations}
            onChangeContainersAM={setNumContainersAM}
            onChangeContainersRE={setNumContainersRE}
            onChangeTruckCapacityAM={setTruckCapacityAM}
            onChangeTruckCapacityRE={setTruckCapacityRE}
            onRun={handleRun}
            running={running}
          />
          <div className="flex-1 overflow-y-auto bg-zinc-50">
            {solution && (
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {solution.trucks.map((truck, i) => (
                    <TruckCard
                      key={truck.id}
                      truckId={truck.id}
                      label={`Truck ${i + 1}`}
                      stopCount={truck.destination_ids.length}
                      color={ROUTE_COLORS[i % ROUTE_COLORS.length]}
                      selected={selectedTruckId === truck.id}
                      ambientCapacity={truckCapacityAM}
                      refrigeratedCapacity={truckCapacityRE}
                      containers={truck.container_ids.flatMap((id) => {
                        const c = containerById.get(id)
                        return c ? [{ container_id: id, size: c.size, temperature: c.temperature }] : []
                      })}
                      onClick={() =>
                        setSelectedTruckId(selectedTruckId === truck.id ? null : truck.id)
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right panel — Map */}
        <div className="w-1/2 min-h-0 relative">
          <RouteMap
            sources={mapSources}
            destinations={mapDestinations}
            routes={routes}
            highlightedTruckId={selectedTruckId}
          />
          {(running || loadingRoutes) && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-[1000]">
              <span className="font-heading text-sm font-semibold text-primary animate-pulse">
                {running ? 'Optimizing…' : 'Loading routes…'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
