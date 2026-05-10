'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatMonth, getCurrentMonth, getCurrentYear } from '@/lib/utils'
import {
  Sparkles,
  RefreshCw,
  TrendingDown,
  AlertTriangle,
  Target,
  PiggyBank,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Transaction, Income, Category, Goal } from '@/types'
import { motion } from 'framer-motion'
import type { ConsultantPayload } from '@/app/api/consultant/route'

// Renderiza Markdown simples (negrito, itálico, listas, títulos)
function MarkdownBlock({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-2 text-gray-300 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />

        // ## Título
        if (line.startsWith('## ')) {
          return (
            <h3 key={i} className="text-white font-semibold text-base mt-4 mb-1 flex items-center gap-2">
              {line.replace(/^## /, '')}
            </h3>
          )
        }
        // ### Subtítulo
        if (line.startsWith('### ')) {
          return (
            <h4 key={i} className="text-gray-200 font-medium mt-3 mb-0.5">
              {line.replace(/^### /, '')}
            </h4>
          )
        }
        // Item de lista
        if (line.startsWith('- ') || line.startsWith('* ')) {
          const content = line.replace(/^[-*] /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          return (
            <div key={i} className="flex items-start gap-2 pl-2">
              <span className="text-emerald-400 mt-1 flex-shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          )
        }
        // Linha normal com negrito
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
        return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />
      })}
    </div>
  )
}

export default function ConsultantPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [analysis, setAnalysis] = useState<string>('')
  const [analysisError, setAnalysisError] = useState<string>('')
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  const [currentYear, setCurrentYear] = useState(getCurrentYear())

  useEffect(() => {
    if (user) fetchData()
  }, [user, currentMonth, currentYear])

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    setAnalysis('')
    setAnalysisError('')
    try {
      const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
      const endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]

      const [
        { data: catData },
        { data: txData },
        { data: incData },
        { data: goalsData },
      ] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', user.id),
        supabase.from('transactions').select('*, category:categories(*)').eq('user_id', user.id).gte('transaction_date', startDate).lte('transaction_date', endDate),
        supabase.from('incomes').select('*').eq('user_id', user.id).eq('month', currentMonth).eq('year', currentYear),
        supabase.from('goals').select('*').eq('user_id', user.id),
      ])

      setCategories(catData ?? [])
      setTransactions(txData ?? [])
      setIncomes(incData ?? [])
      setGoals(goalsData ?? [])
    } catch (err) {
      console.error('Erro ao buscar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalIncome = useMemo(() => incomes.reduce((s, i) => s + i.amount, 0), [incomes])
  const expenses = useMemo(() => transactions.filter(t => t.is_expense), [transactions])
  const totalExpenses = useMemo(() => expenses.reduce((s, t) => s + t.amount, 0), [expenses])
  const balance = totalIncome - totalExpenses

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, { name: string; total: number }>()
    expenses.forEach(t => {
      if (!t.category_id || !t.category) return
      const cur = map.get(t.category_id) ?? { name: t.category.name, total: 0 }
      cur.total += t.amount
      map.set(t.category_id, cur)
    })
    return Array.from(map.values())
      .map(c => ({ ...c, percentage: totalExpenses > 0 ? (c.total / totalExpenses) * 100 : 0 }))
      .sort((a, b) => b.total - a.total)
  }, [expenses, totalExpenses])

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setAnalysisError('')
    try {
      const payload: ConsultantPayload = {
        totalIncome,
        totalExpenses,
        balance,
        expensesByCategory,
        topCategories: expensesByCategory.slice(0, 5),
        goals: goals.map(g => ({
          name: g.name,
          target_amount: g.target_amount,
          current_amount: g.current_amount,
          deadline: g.deadline,
        })),
        month: formatMonth(currentMonth, currentYear),
      }

      const res = await fetch('/api/consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Falha na API')
      const data = await res.json()
      setAnalysis(data.analysis ?? '')
    } catch (err) {
      setAnalysisError('Não foi possível gerar a análise. Verifique a chave ANTHROPIC_API_KEY no .env.local.')
    } finally {
      setAnalyzing(false)
    }
  }

  const navigateMonth = (dir: -1 | 1) => {
    let m = currentMonth + dir
    let y = currentYear
    if (m < 1) { m = 12; y -= 1 }
    if (m > 12) { m = 1; y += 1 }
    setCurrentMonth(m)
    setCurrentYear(y)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <Header title="Consultor IA" subtitle={formatMonth(currentMonth, currentYear)} />

      {/* Navegação de mês */}
      <div className="flex items-center gap-3 mt-6 mb-2">
        <button onClick={() => navigateMonth(-1)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>
        <span className="text-white font-medium">{formatMonth(currentMonth, currentYear)}</span>
        <button onClick={() => navigateMonth(1)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Resumo do mês */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {[
          { label: 'Receitas', value: formatCurrency(totalIncome), color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: <TrendingDown className="w-5 h-5 text-emerald-400 rotate-180" /> },
          { label: 'Despesas', value: formatCurrency(totalExpenses), color: 'text-red-400', bg: 'bg-red-500/20', icon: <TrendingDown className="w-5 h-5 text-red-400" /> },
          { label: 'Saldo', value: formatCurrency(balance), color: balance >= 0 ? 'text-cyan-400' : 'text-red-400', bg: balance >= 0 ? 'bg-cyan-500/20' : 'bg-red-500/20', icon: <PiggyBank className="w-5 h-5 text-cyan-400" /> },
          { label: 'Taxa de Poupança', value: totalIncome > 0 ? `${((balance / totalIncome) * 100).toFixed(0)}%` : '—', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: <Target className="w-5 h-5 text-amber-400" /> },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card variant="gradient">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
                <div>
                  <p className="text-gray-400 text-xs">{s.label}</p>
                  <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Gastos por categoria */}
      {expensesByCategory.length > 0 && (
        <Card className="mt-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            Distribuição de Gastos
          </h3>
          <div className="space-y-3">
            {expensesByCategory.slice(0, 8).map((cat, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-gray-500 text-xs w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-300 text-sm">{cat.name}</span>
                    <span className="text-gray-400 text-sm">{formatCurrency(cat.total)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-gray-500 text-xs w-10 text-right">{cat.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Análise IA */}
      <Card variant="gradient" className="mt-6 border-emerald-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Análise com IA</h2>
              <p className="text-gray-400 text-xs">Claude analisa seus dados e gera recomendações personalizadas</p>
            </div>
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={analyzing}
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Analisando...' : analysis ? 'Reanalisar' : 'Analisar'}
          </Button>
        </div>

        {!analysis && !analyzing && !analysisError && (
          <div className="text-center py-10">
            <Sparkles className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              Clique em <span className="text-emerald-400 font-medium">Analisar</span> para receber uma análise completa dos seus gastos deste mês com recomendações personalizadas.
            </p>
          </div>
        )}

        {analyzing && (
          <div className="flex flex-col items-center py-10 gap-3">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
            <p className="text-gray-400 text-sm">Analisando seus dados financeiros...</p>
          </div>
        )}

        {analysisError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mt-2">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-red-400 text-sm font-medium">Erro na análise</p>
            </div>
            <p className="text-gray-400 text-sm">{analysisError}</p>
          </div>
        )}

        {analysis && !analyzing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 border-t border-gray-700 pt-4"
          >
            <MarkdownBlock text={analysis} />
          </motion.div>
        )}
      </Card>

      {/* Metas */}
      {goals.length > 0 && (
        <Card className="mt-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Progresso das Metas
          </h3>
          <div className="space-y-4">
            {goals.filter(g => !g.is_completed).map(g => {
              const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100))
              return (
                <div key={g.id}>
                  <div className="flex justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span>{g.icon}</span>
                      <span className="text-gray-300 text-sm">{g.name}</span>
                    </div>
                    <span className="text-gray-400 text-sm">{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: g.color }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-500 text-xs">{formatCurrency(g.current_amount)}</span>
                    <span className="text-gray-500 text-xs">{formatCurrency(g.target_amount)}</span>
                  </div>
                </div>
              )
            })}
            {goals.every(g => g.is_completed) && (
              <p className="text-emerald-400 text-sm text-center py-4">🎉 Todas as metas concluídas!</p>
            )}
          </div>
        </Card>
      )}

      {/* Dicas gerais */}
      <Card className="mt-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-amber-400" />
          Princípios Financeiros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Regra 50/30/20', body: '50% para necessidades (moradia, alimentação), 30% para desejos (lazer) e 20% para poupança e investimentos.' },
            { title: 'Fundo de Emergência', body: 'Mantenha 3 a 6 meses de despesas em aplicações de alta liquidez antes de investir em outras categorias.' },
            { title: 'Pague-se Primeiro', body: 'Separe a parcela de poupança logo que receber, antes de gastar. Trate como uma despesa obrigatória.' },
            { title: 'Revise Assinaturas', body: 'Cancele serviços que não usa. Streaming, apps e planos desnecessários podem custar mais do que parecem ao final do ano.' },
          ].map((tip, i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2 text-sm">{tip.title}</h4>
              <p className="text-gray-400 text-xs leading-relaxed">{tip.body}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
