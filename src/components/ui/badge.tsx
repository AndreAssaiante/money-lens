'use client'

import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-slate-700 text-slate-300': variant === 'default',
          'bg-emerald-900/50 text-emerald-400': variant === 'success',
          'bg-amber-900/50 text-amber-400': variant === 'warning',
          'bg-red-900/50 text-red-400': variant === 'danger',
          'bg-blue-900/50 text-blue-400': variant === 'info',
        },
        className
      )}
    >
      {children}
    </span>
  )
}