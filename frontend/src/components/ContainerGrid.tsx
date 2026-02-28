import type { Container } from '../types/routing'

interface ContainerGridProps {
  containers: Container[]
}

const AM_COLOR = '#4785BF'
const RE_COLOR = '#2dd4bf'

function ContainerRow({ label, color, containers }: { label: string; color: string; containers: Container[] }) {
  if (containers.length === 0) return null
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs font-medium mt-1 w-6 shrink-0" style={{ color }}>{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {containers.map((c) => {
          const px = 10 + c.size * 5
          return (
            <div
              key={c.container_id}
              title={`${c.container_id} · size ${c.size} · ${c.source_id} → ${c.destination_id}`}
              style={{
                width: px,
                height: px,
                backgroundColor: color,
                opacity: 0.85,
                borderRadius: 3,
                flexShrink: 0,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

export default function ContainerGrid({ containers }: ContainerGridProps) {
  if (containers.length === 0) return null

  const am = containers.filter((c) => c.temperature === 'AM')
  const re = containers.filter((c) => c.temperature === 'RE')

  return (
    <div className="flex flex-col gap-2 pt-1">
      <ContainerRow label="AM" color={AM_COLOR} containers={am} />
      <ContainerRow label="RE" color={RE_COLOR} containers={re} />
    </div>
  )
}
