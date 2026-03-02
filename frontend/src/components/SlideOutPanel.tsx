import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'

interface SlideOutPanelProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}

export default function SlideOutPanel({ open, title, onClose, children }: SlideOutPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="hidden md:flex flex-col shrink-0 bg-white border-r border-gray-200 overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: 380 }}
          exit={{ width: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        >
          <div className="w-[380px] flex flex-col h-full min-w-[380px]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h2 className="font-heading text-sm font-semibold text-primary">{title}</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
