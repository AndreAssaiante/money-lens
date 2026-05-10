'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Receipt,
  Tags,
  Wallet,
  TrendingUp,
  CreditCard,
  FileText,
  Lightbulb,
  Target,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

const sidebarLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/transactions', label: 'Transações', icon: Receipt },
  { href: '/dashboard/categories', label: 'Categorias', icon: Tags },
  { href: '/dashboard/incomes', label: 'Rendas', icon: Wallet },
  { href: '/dashboard/investments', label: 'Investimentos', icon: TrendingUp },
  { href: '/dashboard/goals', label: 'Metas', icon: Target },
  { href: '/dashboard/cards', label: 'Cartões', icon: CreditCard },
  { href: '/dashboard/invoices', label: 'Faturas', icon: FileText },
  { href: '/dashboard/consultant', label: 'Consultor IA', icon: Lightbulb },
]

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void
}

export function Sidebar({ onCollapse }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const handleCollapse = (value: boolean) => {
    setCollapsed(value)
    onCollapse?.(value)
  }

  const handleLogout = async () => {
    const { supabase } = await import('@/lib/supabase')
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ duration: 0.2 }}
      className="fixed left-0 top-0 h-screen bg-gray-950 border-r border-gray-800 flex flex-col z-30"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-800 px-4 overflow-hidden">
        {!collapsed ? (
          <Link href="/dashboard" className="flex items-center gap-2 whitespace-nowrap">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <path d="M8 24L16 8L24 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 18H20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              home-yield<span className="text-emerald-400">.app</span>
            </span>
          </Link>
        ) : (
          <Link href="/dashboard">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <path d="M8 24L16 8L24 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 18H20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              )}
            >
              <link.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{link.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 p-3 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all">
          <User className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm truncate">{user?.email?.split('@')[0] || 'Perfil'}</span>}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Sair</span>}
        </button>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => handleCollapse(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  )
}
