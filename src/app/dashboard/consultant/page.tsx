'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatMonth, getCurrentMonth, getCurrentYear } from '@/lib/utils'
import {
  Lightbulb,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  PiggyBank,
} from 'lucide-react'
import { Transaction, Income, Category, AISuggestion } from '@/types'
import { motion } from 'framer-motion'

export default function ConsultantPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])

  const currentMonth = getCurrentMonth()
  const currentYear = getCurrentYear()

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)

      if (categoriesData) {
        setCategories(categoriesData)
      }

      // Fetch transactions for current month
      const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
      const endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]

      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)

      if (transactionsData) {
        setTransactions(transactionsData)
      }

      // Fetch incomes
      const { data: incomesData } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)

      if (incomesData) {
        setIncomes(incomesData)
      }

      // Generate suggestions
      generateSuggestions(transactionsData || [], incomesData || [], categoriesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSuggestions = (
    transactions: Transaction[],
    incomes: Income[],
    categories: Category[]
  ) => {
    const newSuggestions: AISuggestion[] = []
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)
    const expenses = transactions.filter(t => t.is_expense)

    // Calculate expenses by category
    const expensesByCategory = new Map<string, { total: number; category: Category }>()
    expenses.forEach(t => {
      if (t.category_id && t.category) {
        const current = expensesByCategory.get(t.category_id) || { total: 0, category: t.category }
        current.total += t.amount
        expensesByCategory.set(t.category_id, current)
      }
    })

    // Check for bottlenecks (>30% in one category)
    expensesByCategory.forEach(({ total, category }) => {
      if (totalIncome > 0 && (total / totalIncome) > 0.3) {
        newSuggestions.push({
          id: `bottleneck-${category.id}`,
          category: category.name,
          icon: category.icon,
          title: `Gargalo em ${category.name}`,
          description: `Voce gastou ${formatCurrency(total)} (${((total / totalIncome) * 100).toFixed(0)}%) em ${category.name}, mais do que o ideal de 30% da sua renda. Considere reduzir esses gastos.`,
          potentialSavings: total * 0.15,
          severity: (total / totalIncome) > 0.5 ? 'high' : 'medium',
        })
      }
    })

    // Find recurring expenses (mock logic)
    const descriptionCounts = new Map<string, number>()
    expenses.forEach(t => {
      const count = descriptionCounts.get(t.description) || 0
      descriptionCounts.set(t.description, count + 1)
    })

    descriptionCounts.forEach((count, description) => {
      if (count >= 2) {
        const expense = expenses.find(e => e.description === description)
        newSuggestions.push({
          id: `recurring-${description}`,
          category: expense?.category?.name || 'Outros',
          icon: 'refresh',
          title: `Gasto Recorrente: ${description}`,
          description: `Esta despesa aparece ${count} vezes este mes. Considere cancelar ou renegociar se nao for essencial.`,
          potentialSavings: (expense?.amount || 0) * count * 0.5,
          severity: 'medium',
        })
      }
    })

    // High spending categories
    const sortedCategories = Array.from(expensesByCategory.entries())
      .sort((a, b) => b[1].total - a[1].total)

    if (sortedCategories.length > 0) {
      const [catId, { total, category }] = sortedCategories[0]
      if (totalIncome > 0) {
        newSuggestions.push({
          id: `top-spending-${catId}`,
          category: category.name,
          icon: category.icon,
          title: `Maior Gasto: ${category.name}`,
          description: `${category.name} e sua maior despesa este mes, totalizando ${formatCurrency(total)}. Analise se ha gastos desnecessarios.`,
          potentialSavings: total * 0.1,
          severity: 'low',
        })
      }
    }

    // General tips if no specific suggestions
    if (newSuggestions.length === 0) {
      newSuggestions.push({
        id: 'general-tip-1',
        category: 'Geral',
        icon: 'star',
        title: 'Parabens! Seus gastos estao equilibrados',
        description: 'Voce nao tem nenhum gargalo significativo este mes. Continue assim!',
        potentialSavings: 0,
        severity: 'low',
      })
    }

    // Add emergency fund suggestion
    if (totalIncome > 0) {
      const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0)
      const balance = totalIncome - totalExpenses

      if (balance > 0) {
        newSuggestions.push({
          id: 'savings-tip',
          category: 'Poupanca',
          icon: 'piggy-bank',
          title: 'Reserve parte do seu saldo',
          description: `Voce tem ${formatCurrency(balance)} disponivel. Considere poupar pelo menos 20% para emergencias.`,
          potentialSavings: balance * 0.2,
          severity: 'low',
        })
      }
    }

    setSuggestions(newSuggestions)
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-400" />
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />
      default:
        return <CheckCircle className="w-5 h-5 text-emerald-400" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-500/30 bg-red-500/10'
      case 'medium':
        return 'border-amber-500/30 bg-amber-500/10'
      default:
        return 'border-emerald-500/30 bg-emerald-500/10'
    }
  }

  const totalPotentialSavings = suggestions.reduce(
    (sum, s) => sum + (s.severity !== 'low' ? s.potentialSavings : 0),
    0
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <Header
        title="Consultor IA"
        subtitle={formatMonth(currentMonth, currentYear)}
      />

      {/* Summary Card */}
      <Card variant="gradient" className="mt-6 border-violet-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-white text-xl font-semibold">Analise Inteligente</h2>
              <p className="text-slate-400 text-sm mt-1">
                Analise dos seus gastos do mes com suggestions personalizadas
              </p>
            </div>
          </div>
          {totalPotentialSavings > 0 && (
            <div className="text-right">
              <p className="text-slate-400 text-sm">Economia Potencial</p>
              <p className="text-2xl font-bold text-emerald-400">
                {formatCurrency(totalPotentialSavings)}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Sugestoes</p>
              <p className="text-white font-semibold text-lg">{suggestions.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Alertas</p>
              <p className="text-white font-semibold text-lg">
                {suggestions.filter(s => s.severity === 'high').length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Oportunidades</p>
              <p className="text-white font-semibold text-lg">
                {suggestions.filter(s => s.severity === 'medium').length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Economia Total</p>
              <p className="text-white font-semibold text-lg">
                {formatCurrency(totalPotentialSavings)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Suggestions List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-6 space-y-4"
      >
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-violet-400" />
          Sugestoes Personalizadas
        </h3>

        {suggestions.map((suggestion, index) => (
          <motion.div
            key={suggestion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={getSeverityColor(suggestion.severity)}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                  {getSeverityIcon(suggestion.severity)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-semibold">{suggestion.title}</h4>
                      <Badge
                        variant={
                          suggestion.severity === 'high'
                            ? 'danger'
                            : suggestion.severity === 'medium'
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {suggestion.severity === 'high'
                          ? 'Critico'
                          : suggestion.severity === 'medium'
                          ? 'Atencao'
                          : 'OK'}
                      </Badge>
                    </div>
                    {suggestion.potentialSavings > 0 && (
                      <p className="text-emerald-400 text-sm font-medium">
                        Economia: {formatCurrency(suggestion.potentialSavings)}
                      </p>
                    )}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {suggestion.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-slate-500 text-xs">
                      Categoria: {suggestion.category}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Tips Section */}
      <Card className="mt-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-amber-400" />
          Dicas Gerais de Economia
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Regra 50/30/20</h4>
            <p className="text-slate-400 text-sm">
              Destine 50% para necessidades (moradia, alimentacao), 30% para desejos (lazer) e 20% para poupanca e investimentos.
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Antecipe Vencimentos</h4>
            <p className="text-slate-400 text-sm">
              Pagar contas antes do vencimento pode evitar juros e multas, alem de liberar espaco no orcamento.
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Revise Assinaturas</h4>
            <p className="text-slate-400 text-sm">
              Cancele assinaturas que nao usa mais. Streaming, apps e magazines podem estar custando mais do que voce percebe.
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Fundo de Emergencia</h4>
            <p className="text-slate-400 text-sm">
              Mantenha pelo menos 3-6 meses de despesas em investimentos de alta liquidez para emergencias.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}