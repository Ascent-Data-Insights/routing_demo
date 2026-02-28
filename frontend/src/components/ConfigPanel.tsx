import { Play } from 'lucide-react'
import TruckVisual from './truck/TruckVisual'
import ContainerGrid from './ContainerGrid'
import type { Container } from '../types/routing'

interface ConfigPanelProps {
  numSources: number
  numDestinations: number
  numContainers: number
  truckCapacityAM: number
  truckCapacityRE: number
  maxSources: number
  maxDestinations: number
  maxContainers: number
  containers: Container[]
  onChangeSources: (v: number) => void
  onChangeDestinations: (v: number) => void
  onChangeContainers: (v: number) => void
  onChangeTruckCapacityAM: (v: number) => void
  onChangeTruckCapacityRE: (v: number) => void
  onRun: () => void
  running: boolean
}

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}

function SliderRow({ label, value, min, max, onChange }: SliderRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-medium text-zinc-700">{label}</span>
        <span className="text-sm font-semibold text-primary tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-secondary"
      />
      <div className="flex justify-between text-xs text-zinc-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

export default function ConfigPanel({
  numSources,
  numDestinations,
  numContainers,
  truckCapacityAM,
  truckCapacityRE,
  maxSources,
  maxDestinations,
  maxContainers,
  containers,
  onChangeSources,
  onChangeDestinations,
  onChangeContainers,
  onChangeTruckCapacityAM,
  onChangeTruckCapacityRE,
  onRun,
  running,
}: ConfigPanelProps) {
  return (
    <div className="p-6 border-b border-gray-200 bg-white">
      <h2 className="font-heading text-base font-semibold text-primary mb-4">Configuration</h2>
      <div className="flex flex-col gap-5">
        <SliderRow label="Sources" value={numSources} min={1} max={maxSources} onChange={onChangeSources} />
        <SliderRow label="Destinations" value={numDestinations} min={1} max={maxDestinations} onChange={onChangeDestinations} />
        <div className="flex flex-col gap-2">
          <SliderRow label="Containers" value={numContainers} min={1} max={maxContainers} onChange={onChangeContainers} />
          <ContainerGrid containers={containers} />
        </div>

        <div>
          <span className="text-sm font-medium text-zinc-700">Truck capacity</span>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-blue-600 font-medium">Ambient</span>
                  <span className="text-xs font-semibold text-primary tabular-nums">{truckCapacityAM}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={truckCapacityAM}
                  onChange={(e) => onChangeTruckCapacityAM(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-cyan-600 font-medium">Refrigerated</span>
                  <span className="text-xs font-semibold text-primary tabular-nums">{truckCapacityRE}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={truckCapacityRE}
                  onChange={(e) => onChangeTruckCapacityRE(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
            <TruckVisual
              label=""
              color="#94a3b8"
              ambientCapacity={truckCapacityAM}
              refrigeratedCapacity={truckCapacityRE}
              containers={[]}
            />
          </div>
        </div>

        <button
          onClick={onRun}
          disabled={running}
          className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={15} />
          {running ? 'Running…' : 'Run Optimization'}
        </button>
      </div>
    </div>
  )
}
