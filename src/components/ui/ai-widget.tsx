'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, RefreshCw, ChevronDown, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatMonth, getCurrentMonth, getCurrentYear } from '@/lib/utils'
import type { ConsultantPayload } from '@/app/api/consultant/route'

function MarkdownBlock({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1.5 text-gray-300 text-xs leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-0.5" />
        if (line.startsWith('## ')) {
          return (
            <p key={i} className="text-white font-semibold text-sm mt-3 mb-0.5">
              {line.replace(/^## /, '')}
            </p>
          )
        }
        if (line.startsWith('### ')) {
          return (
            <p key={i} className="text-gray-200 font-medium mt-2">
              {line.replace(/^### /, '')}
            </p>
          )
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          const content = line.replace(/^[-*] /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          return (
            <div key={i} className="flex items-start gap-1.5 pl-1">
              <span className="text-emerald-400 mt-0.5 flex-shrink-0 text-xs">•</span>
              <span dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          )
        }
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
        return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />
      })}
    </div>
  )
}

export function AIWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<{ income: number; expenses: number; balance: number } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const month = getCurrentMonth()
  const year = getCurrentYear()

  useEffect(() => {
    if (open && !summary && user) fetchSummary()
  }, [open, user])

  useEffect(() => {
    if (analysis && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [analysis])

  const fetchSummary = async () => {
    if (!user) return
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const [{ data: txData }, { data: incData }] = await Promise.all([
      supabase.from('transactions').select('amount, is_expense').eq('user_id', user.id).gte('transaction_date', startDate).lte('transaction_date', endDate),
      supabase.from('incomes').select('amount').eq('user_id', user.id).eq('month', month).eq('year', year),
    ])

    const income = (incData ?? []).reduce((s, i) => s + i.amount, 0)
    const expenses = (txData ?? []).filter(t => t.is_expense).reduce((s, t) => s + t.amount, 0)
    setSummary({ income, expenses, balance: income - expenses })
  }

  const handleAnalyze = async () => {
    if (!user) return
    setAnalyzing(true)
    setError('')
    setAnalysis('')

    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]

      const [{ data: txData }, { data: incData }, { data: goalsData }] = await Promise.all([
        supabase.from('transactions').select('*, category:categories(*)').eq('user_id', user.id).gte('transaction_date', startDate).lte('transaction_date', endDate),
        supabase.from('incomes').select('*').eq('user_id', user.id).eq('month', month).eq('year', year),
        supabase.from('goals').select('*').eq('user_id', user.id),
      ])

      const incomes = incData ?? []
      const transactions = txData ?? []
      const goals = goalsData ?? []

      const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
      const expenses = transactions.filter(t => t.is_expense)
      const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0)

      const catMap = new Map<string, { name: string; total: number }>()
      expenses.forEach(t => {
        if (!t.category_id || !t.category) return
        const cur = catMap.get(t.category_id) ?? { name: t.category.name, total: 0 }
        cur.total += t.amount
        catMap.set(t.category_id, cur)
      })
      const expensesByCategory = Array.from(catMap.values())
        .map(c => ({ ...c, percentage: totalExpenses > 0 ? (c.total / totalExpenses) * 100 : 0 }))
        .sort((a, b) => b.total - a.total)

      setSummary({ income: totalIncome, expenses: totalExpenses, balance: totalIncome - totalExpenses })

      const payload: ConsultantPayload = {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        expensesByCategory,
        topCategories: expensesByCategory.slice(0, 5),
        goals: goals.map(g => ({ name: g.name, target_amount: g.target_amount, current_amount: g.current_amount, deadline: g.deadline })),
        month: formatMonth(month, year),
      }

      const res = await fetch('/api/consultant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAnalysis(data.analysis ?? '')
    } catch {
      setError('Não foi possível gerar a análise. Verifique a chave ANTHROPIC_API_KEY.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Painel expandido */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[360px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col"
            style={{ maxHeight: '520px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Consultor IA</p>
                  <p className="text-gray-400 text-xs">{formatMonth(month, year)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-emerald-400"
                  title="Analisar"
                >
                  <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Resumo rápido */}
            {summary && (
              <div className="grid grid-cols-3 gap-0 border-b border-gray-700 flex-shrink-0">
                <div className="px-3 py-2 text-center border-r border-gray-700">
                  <p className="text-gray-500 text-xs">Receitas</p>
                  <p className="text-emerald-400 font-bold text-xs">{formatCurrency(summary.income)}</p>
                </div>
                <div className="px-3 py-2 text-center border-r border-gray-700">
                  <p className="text-gray-500 text-xs">Despesas</p>
                  <p className="text-red-400 font-bold text-xs">{formatCurrency(summary.expenses)}</p>
                </div>
                <div className="px-3 py-2 text-center">
                  <p className="text-gray-500 text-xs">Saldo</p>
                  <p className={`font-bold text-xs ${summary.balance >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                    {formatCurrency(summary.balance)}
                  </p>
                </div>
              </div>
            )}

            {/* Conteúdo scrollável */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 min-h-0">
              {!analysis && !analyzing && !error && (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-gray-500 text-xs text-center leading-relaxed">
                    Clique em <span className="text-emerald-400">↺</span> para receber uma análise completa dos seus gastos deste mês.
                  </p>
                  <button
                    onClick={handleAnalyze}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-medium rounded-lg transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Analisar agora
                  </button>
                </div>
              )}

              {analyzing && (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
                  <p className="text-gray-500 text-xs">Analisando seus dados...</p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-400 text-xs">{error}</p>
                </div>
              )}

              {analysis && !analyzing && (
                <MarkdownBlock text={analysis} />
              )}
            </div>

            {/* Footer */}
            {analysis && !analyzing && (
              <div className="px-4 py-2.5 border-t border-gray-700 flex-shrink-0">
                <button
                  onClick={handleAnalyze}
                  className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Atualizar análise
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão flutuante */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-shadow"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
