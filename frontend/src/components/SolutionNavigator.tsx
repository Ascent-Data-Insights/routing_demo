import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SolutionNavigatorProps {
  current: number
  total: number
  onPrev: () => void
  onNext: () => void
}

export default function SolutionNavigator({ current, total, onPrev, onNext }: SolutionNavigatorProps) {
  return (
    <div className="shrink-0 flex items-center justify-center gap-4 py-2.5 bg-white border-b border-gray-200">
      <button
        onClick={onPrev}
        disabled={current === 0}
        className="p-1.5 rounded-full hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={20} className="text-primary" />
      </button>
      <span className="font-heading text-sm font-semibold text-primary min-w-[140px] text-center">
        Solution {current + 1} of {total}
      </span>
      <button
        onClick={onNext}
        disabled={current === total - 1}
        className="p-1.5 rounded-full hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={20} className="text-primary" />
      </button>
    </div>
  )
}
