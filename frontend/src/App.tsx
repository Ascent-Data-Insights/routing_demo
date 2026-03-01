import { useEffect, useMemo, useRef, useState } from 'react'
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
  Solution,
  TruckRoute,
} from './types/routing'
import { Settings } from 'lucide-react'

function buildWaypoints(request: OptimizationRequest, solution: Solution) {
  const locationMap = new Map(
    [...request.sources, ...request.destinations].map((loc) => [
      loc.id,
      { lat: parseFloat(loc.lat), lon: parseFloat(loc.lon) },
    ])
  )
  return solution.trucks.map((truck) => {
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

  const allPairs = sourceNodes.flatMap((src) => destNodes.map((dst) => ({ src, dst })))

  // Build an ordered pair list that guarantees every source and destination
  // appears at least once before any repeats.
  // 1. One pair per source (round-robin across destinations).
  // 2. One pair per destination not yet covered (using src 0 as fallback).
  // 3. Remainder cycles through allPairs normally.
  const coveredDests = new Set<number>()
  const coveragePairs: typeof allPairs = []
  sourceNodes.forEach((src, si) => {
    const dst = destNodes[si % destNodes.length]
    coveragePairs.push({ src, dst })
    coveredDests.add(dst.id)
  })
  destNodes.forEach((dst) => {
    if (!coveredDests.has(dst.id)) {
      coveragePairs.push({ src: sourceNodes[0], dst })
    }
  })
  const orderedPairs = [...coveragePairs, ...allPairs]

  const amContainers = Array.from({ length: numContainersAM }, (_, k) => {
    const { src, dst } = orderedPairs[k % orderedPairs.length]
    return {
      container_id: `am-${k}`,
      source_id: `src-${src.id}`,
      destination_id: `dst-${dst.id}`,
      size: (k % 3) + 1,
      temperature: 'AM' as const,
    }
  })
  const reContainers = Array.from({ length: numContainersRE }, (_, k) => {
    const { src, dst } = orderedPairs[k % orderedPairs.length]
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
const MAX_DESTINATIONS = 20
const MAX_CONTAINERS = 30

function App() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [numSources, setNumSources] = useState(2)
  const [numDestinations, setNumDestinations] = useState(10)
  const [numContainersAM, setNumContainersAM] = useState(12)
  const [numContainersRE, setNumContainersRE] = useState(10)
  const [truckCapacityAM, setTruckCapacityAM] = useState(10)
  const [truckCapacityRE, setTruckCapacityRE] = useState(6)

  const [solution, setSolution] = useState<OptimizationResponse | null>(null)
  const [submittedRequest, setSubmittedRequest] = useState<OptimizationRequest | null>(null)
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null)
  const [showOptimized, setShowOptimized] = useState(true)
  const [routes, setRoutes] = useState<TruckRoute[]>([])
  const [running, setRunning] = useState(false)
  const [loadingRoutes, setLoadingRoutes] = useState(false)
  const [mobileTab, setMobileTab] = useState<'panel' | 'map'>('panel')
  // Cache fetched OSRM routes per solution type so toggling doesn't re-fetch
  const routeCache = useRef<{ greedy?: TruckRoute[]; optimized?: TruckRoute[] }>({})

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
    routeCache.current = {}  // invalidate cache on new run
    setRunning(true)
    setMobileTab('map')

    optimize(previewRequest)
      .then(setSolution)
      .catch((err) => console.error('Optimization failed:', err))
      .finally(() => setRunning(false))
  }

  const activeSolution = solution ? (showOptimized ? solution.optimized : solution.greedy) : null
  const cacheKey = showOptimized ? 'optimized' : 'greedy'

  // Fetch OSRM routes whenever the active solution changes.
  // Cached results are shown instantly; only uncached solutions trigger network requests.
  useEffect(() => {
    if (!activeSolution || !submittedRequest) return

    setSelectedTruckId(null)

    // If we already fetched this solution's routes, show them immediately
    const cached = routeCache.current[cacheKey]
    if (cached) {
      setRoutes(cached)
      return
    }

    const truckWaypoints = buildWaypoints(submittedRequest, activeSolution)

    // Show straight-line routes immediately while OSRM fetches run in background
    const straightLineRoutes: TruckRoute[] = truckWaypoints.map(({ truckId, waypoints }) => ({
      truckId,
      legs: [{ coordinates: waypoints.map((w) => [w.lat, w.lon] as [number, number]), distance: 0, duration: 0 }],
    }))
    setRoutes(straightLineRoutes)
    setLoadingRoutes(true)

    let cancelled = false
    let remaining = truckWaypoints.length
    // Build the final routes array incrementally so we can cache it when complete
    const finalRoutes: TruckRoute[] = [...straightLineRoutes]

    truckWaypoints.forEach(async ({ truckId, waypoints }, idx) => {
      try {
        const geometry = await getRoute(waypoints)
        if (!cancelled) {
          finalRoutes[idx] = { truckId, legs: [geometry] }
          setRoutes([...finalRoutes])
        }
      } catch {
        // Keep straight-line fallback for this truck
      } finally {
        remaining -= 1
        if (remaining === 0 && !cancelled) {
          routeCache.current[cacheKey] = finalRoutes
          setLoadingRoutes(false)
        }
      }
    })

    return () => { cancelled = true }
  }, [activeSolution])

  // The map always shows the live preview locations (no routes until after Run)
  const mapSources = previewRequest?.sources ?? []
  const mapDestinations = previewRequest?.destinations ?? []

  // Highlighted source/destination IDs for the selected truck
  const { highlightedSourceIds, highlightedDestinationIds } = useMemo(() => {
    if (!selectedTruckId || !activeSolution) {
      return { highlightedSourceIds: undefined, highlightedDestinationIds: undefined }
    }
    const truck = activeSolution.trucks.find((t) => t.id === selectedTruckId)
    if (!truck) return { highlightedSourceIds: undefined, highlightedDestinationIds: undefined }
    return {
      highlightedSourceIds: new Set([truck.source_id]),
      highlightedDestinationIds: new Set(truck.destination_ids),
    }
  }, [selectedTruckId, activeSolution])

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
              <span className="font-heading text-base sm:text-xl lg:text-2xl font-semibold text-primary">
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

      {/* Mobile tab bar */}
      <div className="md:hidden shrink-0 flex border-b border-gray-200 bg-white text-sm font-semibold">
        <button
          onClick={() => setMobileTab('panel')}
          className={`flex-1 py-2.5 transition-colors ${mobileTab === 'panel' ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
        >
          Panel
        </button>
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2.5 transition-colors ${mobileTab === 'map' ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
        >
          Map
        </button>
      </div>

      {/* Main content: left panel + map */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel — config + preview/results */}
        <div className={`${mobileTab === 'map' ? 'hidden' : 'flex'} md:flex w-full md:w-1/2 flex-col border-r border-gray-200`}>
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
            {solution && activeSolution && (
              <div className="p-6 flex flex-col gap-4">
                {/* Toggle + savings summary */}
                <div className="flex flex-col gap-2">
                  <div className="flex rounded-lg overflow-hidden border border-gray-200 text-sm font-semibold">
                    <button
                      onClick={() => setShowOptimized(false)}
                      className={`flex-1 py-1.5 transition-colors ${!showOptimized ? 'bg-primary text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
                    >
                      Greedy (nearest first)
                    </button>
                    <button
                      onClick={() => setShowOptimized(true)}
                      className={`flex-1 py-1.5 transition-colors ${showOptimized ? 'bg-primary text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
                    >
                      Optimized
                    </button>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500 px-1">
                    <span>{activeSolution.trucks.length} trucks</span>
                    <span>{(activeSolution.total_distance_meters / 1000).toFixed(0)} km total
                      {showOptimized && (() => {
                        const saved = solution.greedy.total_distance_meters - solution.optimized.total_distance_meters
                        const pct = 100 * saved / solution.greedy.total_distance_meters
                        return <span className="text-green-600 font-semibold"> ({pct.toFixed(1)}% saved)</span>
                      })()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {activeSolution.trucks.map((truck, i) => (
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
        <div className={`${mobileTab === 'panel' ? 'hidden' : 'flex'} md:flex w-full md:w-1/2 min-h-0 relative`}>
          <RouteMap
            sources={mapSources}
            destinations={mapDestinations}
            routes={routes}
            highlightedTruckId={selectedTruckId}
            highlightedSourceIds={highlightedSourceIds}
            highlightedDestinationIds={highlightedDestinationIds}
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
