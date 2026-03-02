import { useEffect, useMemo, useRef, useState } from 'react'
import logo from './assets/logo.png'
import RouteMap from './components/map/RouteMap'
import ConfigPanel from './components/ConfigPanel'
import ResultsPanel from './components/ResultsPanel'
import IconRail from './components/IconRail'
import SlideOutPanel from './components/SlideOutPanel'
import type { PanelId } from './components/IconRail'
import { getRoute } from './services/osrm'
import { getNodes, optimize } from './services/api'
import type {
  Node,
  OptimizationRequest,
  OptimizationResponse,
  Solution,
  TruckRoute,
  LabelMaps,
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

  // Simple random generator with fixed seed
  const seed = 1
  let s = seed
  const rand = () => { s = (s ^ (s << 13)) >>> 0; s = (s ^ (s >> 17)) >>> 0; s = (s ^ (s << 5)) >>> 0; return s / 0x100000000 }

  const makeContainer = (k: number, temp: 'AM' | 'RE') => {
    const srcIdx = Math.floor(rand() * sourceNodes.length)
    const dstIdx = Math.floor(rand() * destNodes.length)
    const size = Math.floor(rand() * 3) + 1
    return {
      container_id: `${temp.toLowerCase()}-${k}`,
      source_id: `src-${sourceNodes[srcIdx].id}`,
      destination_id: `dst-${destNodes[dstIdx].id}`,
      size,
      temperature: temp,
    }
  }

  const amContainers = Array.from({ length: numContainersAM }, (_, k) => makeContainer(k, 'AM'))
  const reContainers = Array.from({ length: numContainersRE }, (_, k) => makeContainer(k, 'RE'))

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
  const [activePanel, setActivePanel] = useState<PanelId | null>('config')
  // Cache fetched OSRM routes per solution type so toggling doesn't re-fetch
  const routeCache = useRef<{ greedy?: TruckRoute[]; optimized?: TruckRoute[] }>({})

  function togglePanel(panel: PanelId) {
    setActivePanel((prev) => (prev === panel ? null : panel))
  }

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
      .then((res) => {
        setSolution(res)
        setActivePanel('results')
      })
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

  // Human-readable labels derived from the live preview (W1, W2…; A, B, C…)
  const labelMaps: LabelMaps = useMemo(() => {
    const sources = new Map<string, string>()
    const dests = new Map<string, string>()
    previewRequest?.sources.forEach((s, i) => sources.set(s.id, `W${i + 1}`))
    previewRequest?.destinations.forEach((d, i) =>
      dests.set(d.id, i < 26 ? String.fromCharCode(65 + i) : `A${String.fromCharCode(65 + i - 26)}`)
    )
    return { sources, dests }
  }, [previewRequest])

  // Container lookup by ID for the submitted request (used to populate truck visuals)
  const containerById = useMemo(() => {
    const map = new Map<string, { size: number; temperature: 'AM' | 'RE' }>()
    submittedRequest?.containers.forEach((c) =>
      map.set(c.container_id, { size: c.size, temperature: c.temperature })
    )
    return map
  }, [submittedRequest])

  const panelTitle = activePanel === 'config' ? 'Configuration' : 'Results'

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
          Config
        </button>
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2.5 transition-colors ${mobileTab === 'map' ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
        >
          Map
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop: Icon Rail + Slide-out Panel */}
        <IconRail
          activePanel={activePanel}
          onToggle={togglePanel}
          resultsAvailable={!!solution}
        />
        <SlideOutPanel
          open={activePanel !== null}
          title={panelTitle}
          onClose={() => setActivePanel(null)}
        >
          {activePanel === 'config' && (
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
              labelMaps={labelMaps}
            />
          )}
          {activePanel === 'results' && solution && activeSolution && (
            <ResultsPanel
              solution={solution}
              activeSolution={activeSolution}
              showOptimized={showOptimized}
              onToggleOptimized={setShowOptimized}
              selectedTruckId={selectedTruckId}
              onSelectTruck={setSelectedTruckId}
              truckCapacityAM={truckCapacityAM}
              truckCapacityRE={truckCapacityRE}
              containerById={containerById}
            />
          )}
        </SlideOutPanel>

        {/* Mobile: stacked panels */}
        <div className={`${mobileTab === 'map' ? 'hidden' : 'flex'} md:hidden w-full flex-col overflow-y-auto`}>
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
            labelMaps={labelMaps}
          />
          {solution && activeSolution && (
            <div className="bg-zinc-50">
              <ResultsPanel
                solution={solution}
                activeSolution={activeSolution}
                showOptimized={showOptimized}
                onToggleOptimized={setShowOptimized}
                selectedTruckId={selectedTruckId}
                onSelectTruck={setSelectedTruckId}
                truckCapacityAM={truckCapacityAM}
                truckCapacityRE={truckCapacityRE}
                containerById={containerById}
              />
            </div>
          )}
        </div>

        {/* Map */}
        <div className={`${mobileTab === 'panel' ? 'hidden' : 'flex'} md:flex flex-1 min-h-0 relative flex-col`}>
          {/* Mobile solution toggle */}
          {solution && activeSolution && (
            <div className="md:hidden shrink-0 bg-white border-b border-gray-200 px-3 py-2 flex flex-col gap-1">
              <div className="flex rounded-lg border border-gray-200 text-sm font-semibold">
                <button
                  onClick={() => setShowOptimized(false)}
                  className={`flex-1 py-1.5 transition-colors rounded-l-lg ${!showOptimized ? 'bg-primary text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
                >
                  Basic (next-nearest)
                </button>
                <div className="w-px bg-gray-200 shrink-0" />
                <button
                  onClick={() => setShowOptimized(true)}
                  className={`flex-1 py-1.5 transition-colors rounded-r-lg ${showOptimized ? 'bg-primary text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
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
          )}
          <div className="flex-1 relative min-h-0">
            <RouteMap
              sources={mapSources}
              destinations={mapDestinations}
              routes={routes}
              highlightedTruckId={selectedTruckId}
              highlightedSourceIds={highlightedSourceIds}
              highlightedDestinationIds={highlightedDestinationIds}
              labelMaps={labelMaps}
              mapVisible={mobileTab === 'map'}
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
    </div>
  )
}

export default App
