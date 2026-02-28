import clsx from 'clsx'
import TruckVisual, { type TruckContainer } from './truck/TruckVisual'

interface TruckCardProps {
  truckId: string
  label: string
  stopCount: number
  color: string
  selected: boolean
  ambientCapacity: number
  refrigeratedCapacity: number
  containers: TruckContainer[]
  onClick: () => void
}

export default function TruckCard({
  truckId,
  label,
  stopCount,
  color,
  selected,
  ambientCapacity,
  refrigeratedCapacity,
  containers,
  onClick,
}: TruckCardProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer transition-all duration-200 border-2',
        selected
          ? 'bg-white shadow-lg scale-105'
          : 'bg-white/60 border-transparent hover:bg-white hover:shadow-md',
      )}
      style={{ borderColor: selected ? color : 'transparent' }}
    >
      <TruckVisual
        label={label}
        color={color}
        ambientCapacity={ambientCapacity}
        refrigeratedCapacity={refrigeratedCapacity}
        containers={containers}
      />
      <span className="mt-1 text-xs text-zinc-400">
        {stopCount} stop{stopCount !== 1 ? 's' : ''}
      </span>
    </button>
  )
}
