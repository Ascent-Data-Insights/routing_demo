import { SlidersHorizontal, Truck } from 'lucide-react'

export type PanelId = 'config' | 'results'

interface IconRailButtonProps {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}

function IconRailButton({ icon, label, active, onClick }: IconRailButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center w-full py-3 gap-1 transition-colors ${
        active ? 'bg-accent/10 text-accent' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
      }`}
    >
      {active && (
        <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-accent" />
      )}
      {icon}
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  )
}

interface IconRailProps {
  activePanel: PanelId | null
  onToggle: (panel: PanelId) => void
  resultsAvailable: boolean
}

export default function IconRail({ activePanel, onToggle, resultsAvailable }: IconRailProps) {
  return (
    <div className="hidden md:flex flex-col w-14 shrink-0 bg-white border-r border-gray-200">
      <IconRailButton
        icon={<SlidersHorizontal size={20} />}
        label="Config"
        active={activePanel === 'config'}
        onClick={() => onToggle('config')}
      />
      {resultsAvailable && (
        <IconRailButton
          icon={<Truck size={20} />}
          label="Results"
          active={activePanel === 'results'}
          onClick={() => onToggle('results')}
        />
      )}
    </div>
  )
}
