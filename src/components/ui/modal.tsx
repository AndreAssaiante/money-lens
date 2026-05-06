'use client'

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { HTMLAttributes, forwardRef } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
  className?: string
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ className, isOpen, onClose, title, children }, ref) => {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={onClose}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                ref={ref}
                className={cn(
                  'w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl',
                  className
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  {title && (
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                {children}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    )
  }
)

Modal.displayName = 'Modal'

export { Modal }