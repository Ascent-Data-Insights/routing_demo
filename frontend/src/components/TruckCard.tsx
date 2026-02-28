import { Truck } from 'lucide-react'
import clsx from 'clsx'

interface TruckCardProps {
  truckId: string
  stopCount: number
  color: string
  selected: boolean
  onClick: () => void
}

export default function TruckCard({ truckId, stopCount, color, selected, onClick }: TruckCardProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex flex-col items-center justify-center p-5 rounded-xl cursor-pointer transition-all duration-200 border-2',
        selected
          ? 'bg-white shadow-lg scale-105'
          : 'bg-white/60 border-transparent hover:bg-white hover:shadow-md',
      )}
      style={{ borderColor: selected ? color : 'transparent' }}
    >
      <Truck size={56} strokeWidth={1.5} style={{ color }} />
      <span className="mt-2 text-sm font-semibold" style={{ color }}>
        {truckId}
      </span>
      <span className="text-xs text-zinc-400">
        {stopCount} stop{stopCount !== 1 ? 's' : ''}
      </span>
    </button>
  )
}
