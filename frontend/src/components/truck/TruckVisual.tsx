export interface TruckContainer {
  container_id: string
  size: number
  temperature: 'AM' | 'RE'
}

interface TruckVisualProps {
  label: string
  color: string
  ambientCapacity: number
  refrigeratedCapacity: number
  containers: TruckContainer[]
}

const AM_COLOR = '#4785BF'
const RE_COLOR = '#2dd4bf'

// Layout constants (all in px, SVG coords = px)
const H = 56               // total SVG height
const WHEEL_R = 7          // wheel radius
const GROUND_Y = H - WHEEL_R - 1  // wheel center y, with 1px margin at bottom

// Cab (right side) — fixed width, drawn as a sloped polygon (no rectangle)
const CAB_W = 32
const CAB_H = 28           // full height of cab body
const CAB_SLOPE = 10       // how far the windshield slopes back at the top
const CAB_TOP_Y = GROUND_Y - CAB_H

// Bed/trailer (left side) — width scales with capacity
const BED_H = 22
const BED_TOP_Y = GROUND_Y - BED_H
const MIN_BED_W = 20
const MAX_BED_W = 140
const MAX_CAPACITY = 40

function Zone({
  capacity, containers, unitW, zoneH, baseColor,
}: {
  capacity: number; containers: TruckContainer[]; unitW: number; zoneH: number; baseColor: string
}) {
  const usedUnits = containers.reduce((sum, c) => sum + c.size, 0)
  const emptyUnits = Math.max(0, capacity - usedUnits)
  return (
    <div style={{ width: capacity * unitW, height: zoneH, position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: baseColor, opacity: 0.15, borderRadius: 2 }} />
      <div className="absolute inset-0 flex" style={{ gap: 1 }}>
        {containers.map((c) => (
          <div
            key={c.container_id}
            title={`${c.container_id} · size ${c.size}`}
            style={{ width: c.size * unitW - 1, height: '100%', backgroundColor: baseColor, borderRadius: 2, flexShrink: 0, opacity: 0.9 }}
          />
        ))}
        {emptyUnits > 0 && <div style={{ flex: 1 }} />}
      </div>
    </div>
  )
}

export default function TruckVisual({ label, color, ambientCapacity, refrigeratedCapacity, containers }: TruckVisualProps) {
  const totalCapacity = ambientCapacity + refrigeratedCapacity
  const bedW = MIN_BED_W + (MAX_BED_W - MIN_BED_W) * (totalCapacity / MAX_CAPACITY)
  const totalW = bedW + CAB_W + 2  // +2 so right stroke isn't clipped

  // Bed starts at x=0, cab starts at x=bedW
  const cabX = bedW

  // Wheels: rear under bed, front under cab
  const rearWheelX = bedW * 0.25
  const frontWheelX = cabX + CAB_W * 0.65

  // Container overlay inside the bed
  const innerW = bedW - 4
  const innerH = BED_H - 4
  const unitW = innerW / totalCapacity
  const amContainers = containers.filter((c) => c.temperature === 'AM')
  const reContainers = containers.filter((c) => c.temperature === 'RE')

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: totalW, height: H }}>
        <svg
          width={totalW}
          height={H}
          viewBox={`0 0 ${totalW} ${H}`}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Bed rectangle */}
          <rect x={0} y={BED_TOP_Y} width={bedW} height={BED_H} rx={2} />

          {/* Cab — sloped polygon: flat top-left, angled windshield on right (front) */}
          <polygon points={[
            `${cabX},${CAB_TOP_Y}`,                      // top-left
            `${cabX + CAB_W - CAB_SLOPE},${CAB_TOP_Y}`,  // top-right (before slope)
            `${cabX + CAB_W},${CAB_TOP_Y + CAB_SLOPE}`,  // windshield slope end
            `${cabX + CAB_W},${GROUND_Y}`,               // bottom-right
            `${cabX},${GROUND_Y}`,                       // bottom-left
          ].join(' ')} />

          {/* Rear wheel */}
          <circle cx={rearWheelX} cy={GROUND_Y} r={WHEEL_R} />

          {/* Front wheel */}
          <circle cx={frontWheelX} cy={GROUND_Y} r={WHEEL_R} />
        </svg>

        {/* Container overlay inside the bed */}
        <div
          className="absolute flex"
          style={{ top: BED_TOP_Y + 2, left: 2, width: innerW, height: innerH, gap: 1 }}
        >
          <Zone capacity={ambientCapacity} containers={amContainers} unitW={unitW} zoneH={innerH} baseColor={AM_COLOR} />
          <Zone capacity={refrigeratedCapacity} containers={reContainers} unitW={unitW} zoneH={innerH} baseColor={RE_COLOR} />
        </div>
      </div>
      {label && <span className="text-xs font-semibold" style={{ color }}>{label}</span>}
    </div>
  )
}
