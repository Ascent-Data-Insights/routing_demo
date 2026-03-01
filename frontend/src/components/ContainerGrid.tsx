import type { Container, LabelMaps } from '../types/routing'

interface ContainerGridProps {
  containers: Container[]
  labelMaps?: LabelMaps
}

const AM_COLOR = '#4785BF'
const RE_COLOR = '#2dd4bf'

// Both width and height scale with container size.
// Containers align to bottom so size differences read like stacked boxes.
const SIZE_W: Record<number, number> = { 1: 40, 2: 56, 3: 72 }
const SIZE_H: Record<number, number> = { 1: 24, 2: 36, 3: 48 }

function ContainerRow({ label, color, containers, labelMaps }: { label: string; color: string; containers: Container[]; labelMaps?: LabelMaps }) {
  if (containers.length === 0) return null
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs font-medium mt-1 w-6 shrink-0" style={{ color }}>{label}</span>
      <div className="flex flex-wrap items-end gap-1.5">
        {containers.map((c) => {
          const srcLabel = labelMaps?.sources.get(c.source_id) ?? c.source_id
          const dstLabel = labelMaps?.dests.get(c.destination_id) ?? c.destination_id
          const width = SIZE_W[c.size] ?? 56
          const height = SIZE_H[c.size] ?? 36
          return (
            <div
              key={c.container_id}
              style={{ backgroundColor: color, width, height, flexShrink: 0 }}
              className="flex items-center justify-center rounded text-white font-semibold text-xs leading-none overflow-hidden"
            >
              {srcLabel}→{dstLabel}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ContainerGrid({ containers, labelMaps }: ContainerGridProps) {
  if (containers.length === 0) return null

  const am = containers.filter((c) => c.temperature === 'AM')
  const re = containers.filter((c) => c.temperature === 'RE')

  return (
    <div className="flex flex-col gap-2 pt-1">
      <ContainerRow label="AM" color={AM_COLOR} containers={am} labelMaps={labelMaps} />
      <ContainerRow label="RE" color={RE_COLOR} containers={re} labelMaps={labelMaps} />
    </div>
  )
}
