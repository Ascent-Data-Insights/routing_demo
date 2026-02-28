import { Truck } from 'lucide-react'

interface TruckVisualProps {
  truckId: string
  ambientCapacity: number
  refrigeratedCapacity: number
  ambientUsed: number
  refrigeratedUsed: number
}

export default function TruckVisual({
  truckId,
  ambientCapacity,
  refrigeratedCapacity,
  ambientUsed,
  refrigeratedUsed,
}: TruckVisualProps) {
  const emptyAmbient = ambientCapacity - ambientUsed
  const emptyRefrigerated = refrigeratedCapacity - refrigeratedUsed

  const slots: ('ambient' | 'refrigerated' | 'empty')[] = [
    ...Array<'ambient'>(ambientUsed).fill('ambient'),
    ...Array<'refrigerated'>(refrigeratedUsed).fill('refrigerated'),
    ...Array<'empty'>(emptyAmbient + emptyRefrigerated).fill('empty'),
  ]

  const cols = 5
  const rows = Math.ceil(slots.length / cols)

  // Truck icon viewBox is 24x24. Cargo bed: x 2–14, y 4–17 (above wheels at y=18).
  // At 160px that's ~6.667px per unit.
  // Add inner margin to keep containers off the stroke edges and above wheels.
  const iconSize = 160
  const pxPerUnit = iconSize / 24
  const bedLeft = 3.5 * pxPerUnit
  const bedTop = 5.5 * pxPerUnit
  const bedRight = 13 * pxPerUnit
  const bedBottom = 14.5 * pxPerUnit // stay well above wheel centers at y=18

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <Truck size={iconSize} strokeWidth={1} className="text-zinc-400" />

        <div
          className="absolute grid gap-[3px]"
          style={{
            top: bedTop,
            left: bedLeft,
            width: bedRight - bedLeft,
            height: bedBottom - bedTop,
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
          }}
        >
          {slots.map((type, i) => (
            <div
              key={i}
              className={`rounded-sm ${
                type === 'ambient'
                  ? 'bg-green-500'
                  : type === 'refrigerated'
                    ? 'bg-blue-500'
                    : 'border-2 border-dashed border-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      <span className="text-xs font-semibold text-zinc-600">{truckId}</span>
    </div>
  )
}
