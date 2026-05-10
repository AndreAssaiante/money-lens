'use client'

import { User, Bell, Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface HeaderProps {
  title: string
  subtitle?: string
  balance?: number
}

export function Header({ title, subtitle, balance }: HeaderProps) {
  return (
    <header className="h-16 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {balance !== undefined && (
          <div className="text-right mr-4">
            <p className="text-xs text-slate-400">Saldo Disponivel</p>
            <p className="text-lg font-semibold text-emerald-400">{formatCurrency(balance)}</p>
          </div>
        )}
        <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5 text-slate-400" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
        </button>
        <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <Search className="w-5 h-5 text-slate-400" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    </header>
  )
}