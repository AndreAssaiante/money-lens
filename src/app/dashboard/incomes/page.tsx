'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatMonth, getMonthName } from '@/lib/utils'
import {
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  DollarSign,
  Calendar,
} from 'lucide-react'
import { Income, IncomeFormData } from '@/types'
import { motion } from 'framer-motion'

export default function IncomesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [incomes, setIncomes] = useState<Income[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)

  const [formData, setFormData] = useState<IncomeFormData>({
    source: '',
    amount: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      if (data) {
        setIncomes(data)
      }
    } catch (error) {
      console.error('Error fetching incomes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (editingIncome) {
        const { error } = await supabase
          .from('incomes')
          .update(formData)
          .eq('id', editingIncome.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('incomes')
          .insert({ ...formData, user_id: user.id })

        if (error) throw error
      }

      setIsModalOpen(false)
      setEditingIncome(null)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving income:', error)
      alert('Erro ao salvar renda')
    }
  }

  const handleEdit = (income: Income) => {
    setEditingIncome(income)
    setFormData({
      source: income.source,
      amount: income.amount,
      month: income.month,
      year: income.year,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta renda?')) return

    try {
      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error deleting income:', error)
      alert('Erro ao excluir renda')
    }
  }

  const resetForm = () => {
    setFormData({
      source: '',
      amount: 0,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    })
  }

  const openAddModal = () => {
    setEditingIncome(null)
    resetForm()
    setIsModalOpen(true)
  }

  // Group incomes by month
  const groupedIncomes = incomes.reduce((acc, income) => {
    const key = `${income.year}-${income.month}`
    if (!acc[key]) {
      acc[key] = {
        month: income.month,
        year: income.year,
        total: 0,
        items: [],
      }
    }
    acc[key].total += income.amount
    acc[key].items.push(income)
    return acc
  }, {} as Record<string, { month: number; year: number; total: number; items: Income[] }>)

  const monthlyIncomes = Object.values(groupedIncomes).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <Header title="Rendas" subtitle={`${incomes.length} registros`} />

      <div className="flex justify-end mt-6">
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Renda
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card variant="gradient" className="border-emerald-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total de Rendas</p>
              <p className="text-2xl font-bold text-emerald-400">
                {formatCurrency(incomes.reduce((sum, i) => sum + i.amount, 0))}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="gradient" className="border-violet-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Media Mensal</p>
              <p className="text-2xl font-bold text-violet-400">
                {formatCurrency(monthlyIncomes.length > 0
                  ? monthlyIncomes.reduce((sum, m) => sum + m.total, 0) / monthlyIncomes.length
                  : 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="gradient" className="border-amber-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Meses Registrados</p>
              <p className="text-2xl font-bold text-amber-400">
                {monthlyIncomes.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Incomes by Month */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-6 space-y-4"
      >
        {monthlyIncomes.length === 0 ? (
          <Card>
            <p className="text-slate-500 text-center py-8">
              Nenhuma renda registrada
            </p>
          </Card>
        ) : (
          monthlyIncomes.map((group) => (
            <Card key={`${group.year}-${group.month}`} variant="gradient">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold capitalize">
                      {getMonthName(group.month)} de {group.year}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {group.items.length} fonte(s)
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold text-emerald-400">
                  {formatCurrency(group.total)}
                </p>
              </div>

              <div className="space-y-2">
                {group.items.map((income) => (
                  <div
                    key={income.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span className="text-white">{income.source}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-emerald-400 font-medium">
                        {formatCurrency(income.amount)}
                      </p>
                      <button
                        onClick={() => handleEdit(income)}
                        className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(income.id)}
                        className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </motion.div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingIncome(null)
          resetForm()
        }}
        title={editingIncome ? 'Editar Renda' : 'Nova Renda'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Fonte"
            placeholder="Ex: Salario, Freelance, Investimentos"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            required
          />

          <Input
            label="Valor"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mes"
              type="number"
              min="1"
              max="12"
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) || 1 })}
              required
            />
            <Input
              label="Ano"
              type="number"
              min="2000"
              max="2100"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 2024 })}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {editingIncome ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}