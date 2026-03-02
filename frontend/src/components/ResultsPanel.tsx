import TruckCard from './TruckCard'
import { ROUTE_COLORS } from '../constants'
import type { OptimizationResponse, Solution } from '../types/routing'
import type { TruckContainer } from './truck/TruckVisual'

interface ResultsPanelProps {
  solution: OptimizationResponse
  activeSolution: Solution
  showOptimized: boolean
  onToggleOptimized: (optimized: boolean) => void
  selectedTruckId: string | null
  onSelectTruck: (id: string | null) => void
  truckCapacityAM: number
  truckCapacityRE: number
  containerById: Map<string, { size: number; temperature: 'AM' | 'RE' }>
}

export default function ResultsPanel({
  solution,
  activeSolution,
  showOptimized,
  onToggleOptimized,
  selectedTruckId,
  onSelectTruck,
  truckCapacityAM,
  truckCapacityRE,
  containerById,
}: ResultsPanelProps) {
  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex rounded-lg border border-gray-200 text-sm font-semibold">
          <button
            onClick={() => onToggleOptimized(false)}
            className={`flex-1 py-1.5 transition-colors rounded-l-lg ${!showOptimized ? 'bg-primary text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
          >
            Basic (next-nearest)
          </button>
          <div className="w-px bg-gray-200 shrink-0" />
          <button
            onClick={() => onToggleOptimized(true)}
            className={`flex-1 py-1.5 transition-colors rounded-r-lg ${showOptimized ? 'bg-primary text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
          >
            Optimized
          </button>
        </div>
        <div className="flex justify-between text-xs text-zinc-500 px-1">
          <span>{activeSolution.trucks.length} trucks</span>
          <span>
            {(activeSolution.total_distance_meters / 1000).toFixed(0)} km total
            {showOptimized && (() => {
              const saved = solution.greedy.total_distance_meters - solution.optimized.total_distance_meters
              const pct = (100 * saved) / solution.greedy.total_distance_meters
              return <span className="text-green-600 font-semibold"> ({pct.toFixed(1)}% saved)</span>
            })()}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
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
              return c ? [{ container_id: id, size: c.size, temperature: c.temperature } as TruckContainer] : []
            })}
            onClick={() =>
              onSelectTruck(selectedTruckId === truck.id ? null : truck.id)
            }
          />
        ))}
      </div>
    </div>
  )
}
