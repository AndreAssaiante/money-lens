'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExpensePieChart } from '@/components/charts/expense-pie-chart'
import { MonthlyBarChart } from '@/components/charts/monthly-bar-chart'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatMonth, getCurrentMonth, getCurrentYear } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank,
  CreditCard,
  Target,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { CategoryExpense, MonthlyData, Transaction, Income, Category } from '@/types'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [totalInvestments, setTotalInvestments] = useState(0)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  const [currentYear, setCurrentYear] = useState(getCurrentYear())

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, currentMonth, currentYear])

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

      // Fetch investments total
      const { data: investmentsData } = await supabase
        .from('investments')
        .select('value')
        .eq('user_id', user.id)

      if (investmentsData) {
        setTotalInvestments(investmentsData.reduce((sum, inv) => sum + inv.value, 0))
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
        .order('transaction_date', { ascending: false })

      if (transactionsData) {
        setTransactions(transactionsData)
      }

      // Fetch incomes for current month
      const { data: incomesData } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)

      if (incomesData) {
        setIncomes(incomesData)
      }

      // Fetch monthly data for the last 6 months
      const monthlyDataPromises: MonthlyData[] = []
      for (let i = 5; i >= 0; i--) {
        const month = ((currentMonth - i - 1 + 12) % 12) + 1
        const year = currentMonth - i <= 0 ? currentYear - 1 : currentYear
        const monthName = new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'short' })

        // Get expenses for this month
        const { data: monthTransactions } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .eq('is_expense', true)
          .gte('transaction_date', `${year}-${String(month).padStart(2, '0')}-01`)
          .lt('transaction_date', `${year}-${String(month + 1).padStart(2, '0')}-01`)

        // Get income for this month
        const { data: monthIncomes } = await supabase
          .from('incomes')
          .select('amount')
          .eq('user_id', user.id)
          .eq('month', month)
          .eq('year', year)

        const monthExpenses = monthTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0
        const monthIncome = monthIncomes?.reduce((sum, i) => sum + i.amount, 0) || 0

        monthlyDataPromises.push({
          month: monthName,
          income: monthIncome,
          expenses: monthExpenses,
        })
      }
      setMonthlyData(monthlyDataPromises)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0)
  const totalExpenses = transactions
    .filter(t => t.is_expense)
    .reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpenses

  // Calculate expenses by category
  const expensesByCategory = useMemo(() => {
    const categoryMap = new Map<string, CategoryExpense>()

    transactions
      .filter(t => t.is_expense && t.category)
      .forEach(t => {
        const catId = t.category_id!
        if (!categoryMap.has(catId)) {
          categoryMap.set(catId, {
            categoryId: catId,
            categoryName: t.category!.name,
            categoryColor: t.category!.color,
            categoryIcon: t.category!.icon,
            total: 0,
            percentage: 0,
          })
        }
        categoryMap.get(catId)!.total += t.amount
      })

    const result: CategoryExpense[] = []
    categoryMap.forEach(cat => {
      cat.percentage = totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0
      result.push(cat)
    })

    result.sort((a, b) => b.total - a.total)
    return result
  }, [transactions, totalExpenses])

  // Find bottlenecks (>30% of income in one category)
  const bottlenecks = expensesByCategory.filter(cat => cat.percentage > 30)

  const recentTransactions = transactions.slice(0, 5)

  const navigateMonth = (dir: -1 | 1) => {
    let m = currentMonth + dir
    let y = currentYear
    if (m < 1) { m = 12; y -= 1 }
    if (m > 12) { m = 1; y += 1 }
    setCurrentMonth(m)
    setCurrentYear(y)
  }

  const isCurrentMonth = currentMonth === getCurrentMonth() && currentYear === getCurrentYear()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <Header
        title="Dashboard"
        subtitle={formatMonth(currentMonth, currentYear)}
        balance={balance}
      />

      {/* Navegação mensal */}
      <div className="flex items-center gap-2 mt-5">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>
        <span className="text-white font-semibold text-sm min-w-[140px] text-center select-none">
          {formatMonth(currentMonth, currentYear)}
        </span>
        <button
          onClick={() => navigateMonth(1)}
          disabled={isCurrentMonth}
          className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
        {!isCurrentMonth && (
          <button
            onClick={() => { setCurrentMonth(getCurrentMonth()); setCurrentYear(getCurrentYear()) }}
            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg transition-colors"
          >
            Mês atual
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="gradient" className="border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total de Receitas</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="gradient" className="border-red-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total de Despesas</p>
                <p className="text-2xl font-bold text-red-400 mt-1">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="gradient" className="border-cyan-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Saldo do Mes</p>
                <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                  {formatCurrency(balance)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="gradient" className="border-amber-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Investimentos</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">
                  {formatCurrency(totalInvestments)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <PiggyBank className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Bottleneck Alert */}
      {bottlenecks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <Card className="bg-amber-500/10 border-amber-500/30">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-amber-400 font-semibold mb-1">Alerta de Gargalo!</h3>
                <p className="text-slate-300 text-sm mb-3">
                  As seguintes categorias estao consumindo mais de 30% da sua renda:
                </p>
                <div className="flex flex-wrap gap-2">
                  {bottlenecks.map(cat => (
                    <Badge key={cat.categoryId} variant="warning">
                      {cat.categoryName} ({cat.percentage.toFixed(0)}%)
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Despesas por Categoria</h3>
              <Link href="/dashboard/transactions" className="text-violet-400 text-sm hover:underline">
                Ver todas
              </Link>
            </div>
            <ExpensePieChart data={expensesByCategory} />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Comparativo Mensal</h3>
            </div>
            <MonthlyBarChart data={monthlyData} />
          </Card>
        </motion.div>
      </div>

      {/* Recent Transactions & Top Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Transacoes Recentes</h3>
              <Link href="/dashboard/transactions" className="text-violet-400 text-sm hover:underline">
                Ver todas
              </Link>
            </div>
            {recentTransactions.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Nenhuma transacao este mes</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: (transaction.category?.color || '#666') + '20' }}
                      >
                        <span className="text-lg">{transaction.category?.icon || '?'}</span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{transaction.description}</p>
                        <p className="text-slate-400 text-xs">
                          {new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <p className={`font-semibold ${transaction.is_expense ? 'text-red-400' : 'text-emerald-400'}`}>
                      {transaction.is_expense ? '-' : '+'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Ranking de Gastos</h3>
            </div>
            {expensesByCategory.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Nenhum gasto registrado</p>
            ) : (
              <div className="space-y-3">
                {expensesByCategory.slice(0, 5).map((cat, index) => (
                  <div key={cat.categoryId} className="flex items-center gap-3">
                    <span className="text-slate-500 w-5">{index + 1}</span>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: cat.categoryColor + '20' }}
                    >
                      <span className="text-sm">{cat.categoryIcon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{cat.categoryName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${cat.percentage}%`,
                              backgroundColor: cat.categoryColor,
                            }}
                          />
                        </div>
                        <span className="text-slate-400 text-xs">{cat.percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm font-medium">{formatCurrency(cat.total)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
        <Link href="/dashboard/transactions?action=add">
          <Button variant="secondary" className="w-full h-20 flex-col gap-2">
            <ArrowUpRight className="w-5 h-5" />
            <span className="text-xs">Nova Transacao</span>
          </Button>
        </Link>
        <Link href="/dashboard/invoices">
          <Button variant="secondary" className="w-full h-20 flex-col gap-2">
            <CreditCard className="w-5 h-5" />
            <span className="text-xs">Upload Fatura</span>
          </Button>
        </Link>
        <Link href="/dashboard/incomes">
          <Button variant="secondary" className="w-full h-20 flex-col gap-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs">Registrar Renda</span>
          </Button>
        </Link>
        <Link href="/dashboard/goals">
          <Button variant="secondary" className="w-full h-20 flex-col gap-2">
            <Target className="w-5 h-5" />
            <span className="text-xs">Minhas Metas</span>
          </Button>
        </Link>
        <Link href="/dashboard/consultant">
          <Button variant="secondary" className="w-full h-20 flex-col gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-xs">Consultor IA</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}