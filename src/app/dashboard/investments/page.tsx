'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { formatCurrency, investmentTypes } from '@/lib/utils'
import {
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  Shield,
  Building,
  Bitcoin,
  Wallet,
  Target,
} from 'lucide-react'
import { Investment, InvestmentFormData } from '@/types'
import { motion } from 'framer-motion'

const ICONS: Record<string, React.ElementType> = {
  shield: Shield,
  'trending-up': TrendingUp,
  building: Building,
  bitcoin: Bitcoin,
  wallet: Wallet,
}

export default function InvestmentsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [investments, setInvestments] = useState<Investment[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null)

  const [formData, setFormData] = useState<InvestmentFormData>({
    name: '',
    type: 'fixed',
    value: 0,
    income_rate: 0,
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
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setInvestments(data)
      }
    } catch (error) {
      console.error('Error fetching investments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (editingInvestment) {
        const { error } = await supabase
          .from('investments')
          .update(formData)
          .eq('id', editingInvestment.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('investments')
          .insert({ ...formData, user_id: user.id })

        if (error) throw error
      }

      setIsModalOpen(false)
      setEditingInvestment(null)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving investment:', error)
      alert('Erro ao salvar investimento')
    }
  }

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment)
    setFormData({
      name: investment.name,
      type: investment.type,
      value: investment.value,
      income_rate: investment.income_rate,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este investimento?')) return

    try {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error deleting investment:', error)
      alert('Erro ao excluir investimento')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'fixed',
      value: 0,
      income_rate: 0,
    })
  }

  const openAddModal = () => {
    setEditingInvestment(null)
    resetForm()
    setIsModalOpen(true)
  }

  // Calculate totals
  const totalValue = investments.reduce((sum, i) => sum + i.value, 0)
  const averageRate = investments.length > 0
    ? investments.reduce((sum, i) => sum + i.income_rate, 0) / investments.length
    : 0

  // Group by type
  const investmentsByType = investments.reduce((acc, inv) => {
    if (!acc[inv.type]) {
      acc[inv.type] = { total: 0, count: 0 }
    }
    acc[inv.type].total += inv.value
    acc[inv.type].count += 1
    return acc
  }, {} as Record<string, { total: number; count: number }>)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <Header title="Investimentos" subtitle={`${investments.length} investimentos`} />

      <div className="flex justify-end mt-6">
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Investimento
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card variant="gradient" className="border-emerald-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Patrimonio Total</p>
              <p className="text-2xl font-bold text-emerald-400">
                {formatCurrency(totalValue)}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="gradient" className="border-violet-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Taxa Media</p>
              <p className="text-2xl font-bold text-violet-400">
                {averageRate.toFixed(2)}%
              </p>
            </div>
          </div>
        </Card>

        <Card variant="gradient" className="border-amber-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Tipos de Investimento</p>
              <p className="text-2xl font-bold text-amber-400">
                {Object.keys(investmentsByType).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Breakdown by Type */}
      {Object.keys(investmentsByType).length > 0 && (
        <Card className="mt-6">
          <h3 className="text-white font-semibold mb-4">Distribuicao por Tipo</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(investmentsByType).map(([type, data]) => {
              const typeInfo = investmentTypes.find(t => t.value === type)
              const IconComponent = ICONS[type] || Shield
              const percentage = totalValue > 0 ? (data.total / totalValue) * 100 : 0

              return (
                <div key={type} className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <IconComponent className="w-6 h-6 mx-auto mb-2 text-violet-400" />
                  <p className="text-slate-400 text-xs mb-1">{typeInfo?.label || type}</p>
                  <p className="text-white font-semibold">{formatCurrency(data.total)}</p>
                  <p className="text-slate-500 text-xs">{percentage.toFixed(1)}%</p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Investments List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-6 space-y-3"
      >
        {investments.length === 0 ? (
          <Card>
            <p className="text-slate-500 text-center py-8">
              Nenhum investimento registrado
            </p>
          </Card>
        ) : (
          investments.map((investment) => {
            const typeInfo = investmentTypes.find(t => t.value === investment.type)
            const IconComponent = ICONS[investment.type] || Shield

            return (
              <Card key={investment.id} variant="gradient">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{investment.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="info">{typeInfo?.label || investment.type}</Badge>
                        <span className="text-slate-400 text-sm">
                          Taxa: {investment.income_rate}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xl font-semibold text-emerald-400">
                      {formatCurrency(investment.value)}
                    </p>
                    <button
                      onClick={() => handleEdit(investment)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(investment.id)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </motion.div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingInvestment(null)
          resetForm()
        }}
        title={editingInvestment ? 'Editar Investimento' : 'Novo Investimento'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome do Investimento"
            placeholder="Ex: Tesouro Direto 2025"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Select
            label="Tipo"
            options={investmentTypes.map(t => ({ value: t.value, label: t.label }))}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as InvestmentFormData['type'] })}
          />

          <Input
            label="Valor Atual"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.value || ''}
            onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
            required
          />

          <Input
            label="Taxa de Retorno (%)"
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="Ex: 12.5"
            value={formData.income_rate || ''}
            onChange={(e) => setFormData({ ...formData, income_rate: parseFloat(e.target.value) || 0 })}
            required
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {editingInvestment ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}