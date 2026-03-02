import { useState } from 'react'
import { Play } from 'lucide-react'
import TruckVisual from './truck/TruckVisual'
import ContainerGrid from './ContainerGrid'
import type { Container, LabelMaps } from '../types/routing'

const ABOUT_TEXT = `This demo optimizes container delivery routes across sources and destinations.

Basic (next-nearest) strategy:
1. Group containers by source — trucks never cross sources.
2. Assign containers to trucks greedily: prefer a truck already heading to the same destination, then one with capacity whose stops are closest, otherwise open a new truck.
3. Route each truck with nearest-neighbor.

Optimization strategy:
1. Utilizing the Clarke-Wright and 2-opt algorithms: Start with one truck per destination (direct source → dest → source).
2. Compute savings(i,j) = dist(src,i) + dist(src,j) − dist(i,j) for all pairs.
3. Select the best savings if capacity allows.
4. Re-route updated trucks.`

function AboutDisclosure() {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-zinc-100">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-2.5 text-xs font-medium text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors select-none"
      >
        <span>{open ? '🔽' : '▶️'} About this demo</span>
        <span className="text-[10px]"></span>
      </button>
      {open && (
        <div className="px-5 pb-3 text-xs text-zinc-600 whitespace-pre-wrap leading-relaxed">
          {ABOUT_TEXT}
        </div>
      )}
    </div>
  )
}

interface ConfigPanelProps {
  numSources: number
  numDestinations: number
  numContainersAM: number
  numContainersRE: number
  truckCapacityAM: number
  truckCapacityRE: number
  maxSources: number
  maxDestinations: number
  maxContainers: number
  containers: Container[]
  onChangeSources: (v: number) => void
  onChangeDestinations: (v: number) => void
  onChangeContainersAM: (v: number) => void
  onChangeContainersRE: (v: number) => void
  onChangeTruckCapacityAM: (v: number) => void
  onChangeTruckCapacityRE: (v: number) => void
  onRun: () => void
  running: boolean
  labelMaps?: LabelMaps
  pulsingContainerIds?: Set<string>
}

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  accent?: string
  labelClass?: string
}

function SliderRow({ label, value, min, max, onChange, accent = 'accent-secondary', labelClass = 'text-sm font-medium text-zinc-700' }: SliderRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className={`${labelClass} shrink-0 w-24`}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`flex-1 ${accent}`}
      />
      <span className="text-sm font-semibold text-primary tabular-nums w-6 text-right">{value}</span>
    </div>
  )
}

export default function ConfigPanel({
  numSources,
  numDestinations,
  numContainersAM,
  numContainersRE,
  truckCapacityAM,
  truckCapacityRE,
  maxSources,
  maxDestinations,
  maxContainers,
  containers,
  onChangeSources,
  onChangeDestinations,
  onChangeContainersAM,
  onChangeContainersRE,
  onChangeTruckCapacityAM,
  onChangeTruckCapacityRE,
  onRun,
  running,
  labelMaps,
  pulsingContainerIds,
}: ConfigPanelProps) {
  return (
    <div className="bg-white">
      <AboutDisclosure />
      <div className="px-5 py-4">
      <div className="flex flex-col gap-2">
        <SliderRow label="Sources" value={numSources} min={1} max={maxSources} onChange={onChangeSources} />
        <SliderRow label="Destinations" value={numDestinations} min={5} max={maxDestinations} onChange={onChangeDestinations} />

        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide w-24 shrink-0">Containers</span>
          <div className="flex-1 border-t border-zinc-100" />
        </div>
        <SliderRow label="Ambient" value={numContainersAM} min={8} max={maxContainers} onChange={onChangeContainersAM} accent="accent-blue-500" labelClass="text-sm font-medium text-blue-600" />
        <SliderRow label="Refrigerated" value={numContainersRE} min={8} max={maxContainers} onChange={onChangeContainersRE} accent="accent-cyan-500" labelClass="text-sm font-medium text-cyan-600" />
        <ContainerGrid containers={containers} labelMaps={labelMaps} pulsingContainerIds={pulsingContainerIds} />

        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide shrink-0">Truck capacity</span>
          <div className="flex-1 border-t border-zinc-100" />
          <TruckVisual label="" color="#94a3b8" ambientCapacity={truckCapacityAM} refrigeratedCapacity={truckCapacityRE} containers={[]} />
        </div>
        <SliderRow label="Ambient" value={truckCapacityAM} min={4} max={20} onChange={onChangeTruckCapacityAM} accent="accent-blue-500" labelClass="text-sm font-medium text-blue-600" />
        <SliderRow label="Refrigerated" value={truckCapacityRE} min={4} max={20} onChange={onChangeTruckCapacityRE} accent="accent-cyan-500" labelClass="text-sm font-medium text-cyan-600" />

        <button
          onClick={onRun}
          disabled={running}
          className="mt-2 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={15} />
          {running ? 'Running…' : 'Run Optimization'}
        </button>
      </div>
      </div>
    </div>
  )
}
