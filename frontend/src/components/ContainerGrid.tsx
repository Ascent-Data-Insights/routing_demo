import type { Container, LabelMaps } from '../types/routing'

interface ContainerGridProps {
  containers: Container[]
  labelMaps?: LabelMaps
}

const AM_COLOR = '#4785BF'
const RE_COLOR = '#2dd4bf'

const SIZE_W: Record<number, number> = { 1: 20, 2: 28, 3: 36 }
const SIZE_H: Record<number, number> = { 1: 20, 2: 28, 3: 36 }

// One warehouse "building" per source — triangle roof on top, container grid as the body.
function SourceWarehouse({
  sourceLabel,
  containers,
  labelMaps,
}: {
  sourceLabel: string
  containers: Container[]
  labelMaps?: LabelMaps
}) {
  return (
    <div className="flex flex-col" style={{ minWidth: 80 }}>
      {/* Roof — triangle stretches with body width; label is HTML overlay at fixed size */}
      <div className="relative" style={{ height: 28 }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          style={{ display: 'block' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon points="0,40 50,0 100,40" fill="#03344E" />
        </svg>
        <span
          className="absolute inset-0 flex items-end justify-center pb-0.5 text-white font-bold"
          style={{ fontSize: 13, lineHeight: 1 }}
        >
          {sourceLabel}
        </span>
      </div>
      {/* Body — the warehouse "walls" containing the containers */}
      <div
        className="flex flex-wrap items-end gap-1 p-1.5"
        style={{ backgroundColor: '#03344E', borderRadius: '0 0 4px 4px' }}
      >
        {containers.map((c) => {
          const dstLabel = labelMaps?.dests.get(c.destination_id) ?? c.destination_id
          const color = c.temperature === 'AM' ? AM_COLOR : RE_COLOR
          const w = SIZE_W[c.size] ?? 28
          const h = SIZE_H[c.size] ?? 28
          return (
            <div
              key={c.container_id}
              style={{ backgroundColor: color, width: w, height: h, flexShrink: 0, fontSize: h < 24 ? 9 : 11 }}
              className="flex items-center justify-center rounded text-white font-bold leading-none overflow-hidden"
              title={`${sourceLabel}→${dstLabel} · size ${c.size} · ${c.temperature}`}
            >
              {dstLabel}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ContainerGrid({ containers, labelMaps }: ContainerGridProps) {
  if (containers.length === 0) return null

  // Group containers by source ID, preserving source order from labelMaps
  const bySource = new Map<string, Container[]>()
  for (const c of containers) {
    if (!bySource.has(c.source_id)) bySource.set(c.source_id, [])
    bySource.get(c.source_id)!.push(c)
  }

  return (
    <div className="flex flex-wrap gap-3 pt-1">
      {Array.from(bySource.entries()).map(([srcId, srcContainers]) => {
        const sourceLabel = labelMaps?.sources.get(srcId) ?? srcId
        return (
          <SourceWarehouse
            key={srcId}
            sourceLabel={sourceLabel}
            containers={srcContainers}
            labelMaps={labelMaps}
          />
        )
      })}
    </div>
  )
}
