'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import {
  Plus,
  Target,
  CheckCircle2,
  Clock,
  TrendingUp,
  Pencil,
  Trash2,
  PiggyBank,
  Calendar,
  ArrowUpRight,
  Flag,
} from 'lucide-react'
import { Goal, GoalCategory, GoalFormData, GoalContribution, GoalContributionFormData } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

const GOAL_CATEGORIES: { value: GoalCategory; label: string; icon: string; color: string }[] = [
  { value: 'emergency_fund', label: 'Reserva de Emergência', icon: '🛡️', color: '#10b981' },
  { value: 'travel',        label: 'Viagem',                 icon: '✈️', color: '#06b6d4' },
  { value: 'real_estate',   label: 'Imóvel',                 icon: '🏠', color: '#f59e0b' },
  { value: 'vehicle',       label: 'Veículo',                icon: '🚗', color: '#8b5cf6' },
  { value: 'education',     label: 'Educação',               icon: '🎓', color: '#3b82f6' },
  { value: 'retirement',    label: 'Aposentadoria',          icon: '🌅', color: '#ec4899' },
  { value: 'other',         label: 'Outro',                  icon: '⭐', color: '#6b7280' },
]

const getCategoryMeta = (cat: GoalCategory) =>
  GOAL_CATEGORIES.find(c => c.value === cat) ?? GOAL_CATEGORIES[GOAL_CATEGORIES.length - 1]

function monthsUntil(deadline: string): number {
  const now = new Date()
  const end = new Date(deadline)
  return Math.max(0, (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth()))
}

function progressPercent(current: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

const emptyForm: GoalFormData = {
  name: '',
  description: '',
  category: 'emergency_fund',
  target_amount: 0,
  current_amount: 0,
  deadline: '',
  color: '#10b981',
  icon: '🛡️',
}

export default function GoalsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [goals, setGoals] = useState<Goal[]>([])
  const [contributions, setContributions] = useState<GoalContribution[]>([])

  // Modais
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [isContribModalOpen, setIsContribModalOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [targetGoal, setTargetGoal] = useState<Goal | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<GoalFormData>(emptyForm)
  const [contribForm, setContribForm] = useState<GoalContributionFormData>({
    goal_id: '',
    amount: 0,
    contribution_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [{ data: goalsData }, { data: contribData }] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('goal_contributions').select('*').eq('user_id', user.id).order('contribution_date', { ascending: false }),
      ])
      setGoals(goalsData ?? [])
      setContributions(contribData ?? [])
    } catch (err) {
      console.error('Erro ao buscar metas:', err)
    } finally {
      setLoading(false)
    }
  }

  // Sincroniza cor/ícone quando categoria muda
  const handleCategoryChange = (cat: GoalCategory) => {
    const meta = getCategoryMeta(cat)
    setForm(f => ({ ...f, category: cat, color: meta.color, icon: meta.icon }))
  }

  const openCreateModal = () => {
    setEditingGoal(null)
    setForm(emptyForm)
    setIsGoalModalOpen(true)
  }

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal)
    setForm({
      name: goal.name,
      description: goal.description ?? '',
      category: goal.category,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      deadline: goal.deadline ?? '',
      color: goal.color,
      icon: goal.icon,
    })
    setIsGoalModalOpen(true)
  }

  const openContribModal = (goal: Goal) => {
    setTargetGoal(goal)
    setContribForm({
      goal_id: goal.id,
      amount: 0,
      contribution_date: new Date().toISOString().split('T')[0],
      notes: '',
    })
    setIsContribModalOpen(true)
  }

  const openDeleteConfirm = (goal: Goal) => {
    setTargetGoal(goal)
    setIsDeleteConfirmOpen(true)
  }

  const handleSaveGoal = async () => {
    if (!user || !form.name || form.target_amount <= 0) return
    setSaving(true)
    try {
      const payload = {
        user_id: user.id,
        name: form.name,
        description: form.description || null,
        category: form.category,
        target_amount: form.target_amount,
        current_amount: form.current_amount,
        deadline: form.deadline || null,
        color: form.color,
        icon: form.icon,
        is_completed: form.current_amount >= form.target_amount,
      }

      if (editingGoal) {
        const { error } = await supabase.from('goals').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingGoal.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('goals').insert(payload)
        if (error) throw error
      }

      setIsGoalModalOpen(false)
      fetchData()
    } catch (err) {
      console.error('Erro ao salvar meta:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveContribution = async () => {
    if (!user || contribForm.amount <= 0 || !targetGoal) return
    setSaving(true)
    try {
      const { error: contribError } = await supabase.from('goal_contributions').insert({
        goal_id: contribForm.goal_id,
        user_id: user.id,
        amount: contribForm.amount,
        contribution_date: contribForm.contribution_date,
        notes: contribForm.notes || null,
      })
      if (contribError) throw contribError

      const newCurrent = targetGoal.current_amount + contribForm.amount
      const { error: goalError } = await supabase
        .from('goals')
        .update({
          current_amount: newCurrent,
          is_completed: newCurrent >= targetGoal.target_amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetGoal.id)
      if (goalError) throw goalError

      setIsContribModalOpen(false)
      fetchData()
    } catch (err) {
      console.error('Erro ao registrar aporte:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGoal = async () => {
    if (!targetGoal) return
    setSaving(true)
    try {
      await supabase.from('goal_contributions').delete().eq('goal_id', targetGoal.id)
      const { error } = await supabase.from('goals').delete().eq('id', targetGoal.id)
      if (error) throw error
      setIsDeleteConfirmOpen(false)
      fetchData()
    } catch (err) {
      console.error('Erro ao excluir meta:', err)
    } finally {
      setSaving(false)
    }
  }

  const stats = useMemo(() => {
    const total = goals.length
    const completed = goals.filter(g => g.is_completed).length
    const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0)
    const totalCurrent = goals.reduce((s, g) => s + g.current_amount, 0)
    const onTrack = goals.filter(g => {
      if (!g.deadline || g.is_completed) return false
      const months = monthsUntil(g.deadline)
      if (months <= 0) return false
      const needed = (g.target_amount - g.current_amount) / months
      const recentContribs = contributions
        .filter(c => c.goal_id === g.id)
        .slice(0, 3)
        .reduce((s, c) => s + c.amount, 0) / Math.max(1, Math.min(3, contributions.filter(c => c.goal_id === g.id).length))
      return recentContribs >= needed
    }).length

    return { total, completed, totalTarget, totalCurrent, onTrack }
  }, [goals, contributions])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <Header title="Metas Financeiras" subtitle={`${stats.total} meta${stats.total !== 1 ? 's' : ''} ativa${stats.total !== 1 ? 's' : ''}`} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { label: 'Total de Metas', value: stats.total, icon: <Flag className="w-5 h-5 text-emerald-400" />, bg: 'bg-emerald-500/20', extra: null },
          { label: 'Concluídas', value: stats.completed, icon: <CheckCircle2 className="w-5 h-5 text-cyan-400" />, bg: 'bg-cyan-500/20', extra: null },
          { label: 'Valor Total Alvo', value: formatCurrency(stats.totalTarget), icon: <Target className="w-5 h-5 text-amber-400" />, bg: 'bg-amber-500/20', extra: null },
          { label: 'Já Acumulado', value: formatCurrency(stats.totalCurrent), icon: <PiggyBank className="w-5 h-5 text-violet-400" />, bg: 'bg-violet-500/20', extra: null },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card variant="gradient">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
                <div>
                  <p className="text-gray-400 text-xs">{s.label}</p>
                  <p className="text-white font-bold text-lg">{s.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Header action */}
      <div className="flex items-center justify-between mt-8 mb-4">
        <h2 className="text-white font-semibold text-lg">Suas Metas</h2>
        <Button onClick={openCreateModal} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Meta
        </Button>
      </div>

      {/* Goals grid */}
      {goals.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <Target className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-medium mb-1">Nenhuma meta criada</p>
              <p className="text-gray-500 text-sm">Defina seus objetivos financeiros e acompanhe o progresso mês a mês.</p>
            </div>
            <Button onClick={openCreateModal} size="sm" className="gap-2 mt-2">
              <Plus className="w-4 h-4" />
              Criar primeira meta
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence>
            {goals.map((goal, idx) => {
              const pct = progressPercent(goal.current_amount, goal.target_amount)
              const months = goal.deadline ? monthsUntil(goal.deadline) : null
              const remaining = goal.target_amount - goal.current_amount
              const monthlyNeeded = months && months > 0 ? remaining / months : null
              const catMeta = getCategoryMeta(goal.category)
              const goalContribs = contributions.filter(c => c.goal_id === goal.id)

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="flex flex-col gap-4 h-full relative overflow-hidden">
                    {/* Color accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: goal.color }} />

                    {/* Header */}
                    <div className="flex items-start justify-between pt-1">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ backgroundColor: goal.color + '20' }}
                        >
                          {goal.icon}
                        </div>
                        <div>
                          <p className="text-white font-semibold leading-tight">{goal.name}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{catMeta.label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {goal.is_completed && (
                          <Badge variant="success" className="text-xs">Concluída</Badge>
                        )}
                        <button onClick={() => openEditModal(goal)} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
                          <Pencil className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        <button onClick={() => openDeleteConfirm(goal)} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex items-end justify-between mb-2">
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Acumulado</p>
                          <p className="text-white font-bold text-lg">{formatCurrency(goal.current_amount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-0.5">Meta</p>
                          <p className="text-gray-300 font-semibold">{formatCurrency(goal.target_amount)}</p>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: goal.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.05 }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5 text-right">{pct}% concluído</p>
                    </div>

                    {/* Meta details */}
                    <div className="grid grid-cols-2 gap-3">
                      {goal.deadline && (
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <p className="text-xs text-gray-400">Prazo</p>
                          </div>
                          <p className="text-white text-sm font-medium">
                            {new Date(goal.deadline).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                          </p>
                          {months !== null && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {months > 0 ? `${months} mes${months !== 1 ? 'es' : ''}` : 'Vencida'}
                            </p>
                          )}
                        </div>
                      )}
                      {monthlyNeeded !== null && monthlyNeeded > 0 && !goal.is_completed && (
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                            <p className="text-xs text-gray-400">Aporte mensal</p>
                          </div>
                          <p className="text-emerald-400 text-sm font-bold">{formatCurrency(monthlyNeeded)}</p>
                          <p className="text-xs text-gray-500 mt-0.5">para bater no prazo</p>
                        </div>
                      )}
                      {goal.description && (
                        <div className="col-span-2 bg-gray-800/50 rounded-lg p-3">
                          <p className="text-gray-400 text-xs leading-relaxed">{goal.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Recent contributions */}
                    {goalContribs.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Últimos aportes</p>
                        <div className="space-y-1.5">
                          {goalContribs.slice(0, 3).map(c => (
                            <div key={c.id} className="flex items-center justify-between">
                              <p className="text-gray-400 text-xs">
                                {new Date(c.contribution_date).toLocaleDateString('pt-BR')}
                                {c.notes && <span className="ml-2 text-gray-600">• {c.notes}</span>}
                              </p>
                              <p className="text-emerald-400 text-xs font-medium">+{formatCurrency(c.amount)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action */}
                    {!goal.is_completed && (
                      <Button
                        onClick={() => openContribModal(goal)}
                        variant="secondary"
                        size="sm"
                        className="w-full gap-2 mt-auto"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        Registrar Aporte
                      </Button>
                    )}
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal — Criar/Editar Meta */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title={editingGoal ? 'Editar Meta' : 'Nova Meta Financeira'}
        className="max-w-lg"
      >
        <div className="space-y-4">
          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleCategoryChange(cat.value)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all ${
                    form.category === cat.value
                      ? 'border-emerald-500 bg-emerald-500/10 text-white'
                      : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="text-xs">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Nome da meta"
            placeholder="Ex: Reserva de emergência"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />

          <Input
            label="Descrição (opcional)"
            placeholder="Detalhes ou motivação da meta"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Valor alvo (R$)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={form.target_amount || ''}
              onChange={e => setForm(f => ({ ...f, target_amount: parseFloat(e.target.value) || 0 }))}
            />
            <Input
              label="Já tenho (R$)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={form.current_amount || ''}
              onChange={e => setForm(f => ({ ...f, current_amount: parseFloat(e.target.value) || 0 }))}
            />
          </div>

          <Input
            label="Prazo (opcional)"
            type="month"
            value={form.deadline ? form.deadline.substring(0, 7) : ''}
            onChange={e => setForm(f => ({ ...f, deadline: e.target.value ? `${e.target.value}-01` : '' }))}
          />

          {/* Preview */}
          {form.target_amount > 0 && form.deadline && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
              <p className="text-emerald-400 text-sm font-medium">
                Aporte mensal necessário:{' '}
                <span className="font-bold">
                  {formatCurrency(
                    Math.max(0, form.target_amount - form.current_amount) /
                    Math.max(1, monthsUntil(form.deadline))
                  )}
                </span>
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                Para atingir {formatCurrency(form.target_amount)} em{' '}
                {monthsUntil(form.deadline)} mes{monthsUntil(form.deadline) !== 1 ? 'es' : ''}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setIsGoalModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveGoal}
              disabled={saving || !form.name || form.target_amount <= 0}
            >
              {saving ? 'Salvando...' : editingGoal ? 'Atualizar' : 'Criar Meta'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal — Registrar Aporte */}
      <Modal
        isOpen={isContribModalOpen}
        onClose={() => setIsContribModalOpen(false)}
        title={`Aporte — ${targetGoal?.name ?? ''}`}
      >
        <div className="space-y-4">
          {targetGoal && (
            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400 text-sm">Progresso atual</span>
                <span className="text-white text-sm font-medium">
                  {progressPercent(targetGoal.current_amount, targetGoal.target_amount)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progressPercent(targetGoal.current_amount, targetGoal.target_amount)}%`,
                    backgroundColor: targetGoal.color,
                  }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-emerald-400 text-sm">{formatCurrency(targetGoal.current_amount)}</span>
                <span className="text-gray-400 text-sm">{formatCurrency(targetGoal.target_amount)}</span>
              </div>
            </div>
          )}

          <Input
            label="Valor do aporte (R$)"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0,00"
            value={contribForm.amount || ''}
            onChange={e => setContribForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
          />

          <Input
            label="Data"
            type="date"
            value={contribForm.contribution_date}
            onChange={e => setContribForm(f => ({ ...f, contribution_date: e.target.value }))}
          />

          <Input
            label="Observação (opcional)"
            placeholder="Ex: 13º salário, bônus..."
            value={contribForm.notes}
            onChange={e => setContribForm(f => ({ ...f, notes: e.target.value }))}
          />

          {contribForm.amount > 0 && targetGoal && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
              <p className="text-emerald-400 text-sm">
                Novo saldo após aporte:{' '}
                <span className="font-bold">{formatCurrency(targetGoal.current_amount + contribForm.amount)}</span>
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                {progressPercent(targetGoal.current_amount + contribForm.amount, targetGoal.target_amount)}% da meta atingida
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setIsContribModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSaveContribution} disabled={saving || contribForm.amount <= 0}>
              {saving ? 'Salvando...' : 'Registrar Aporte'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal — Confirmar exclusão */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Excluir Meta"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Tem certeza que deseja excluir a meta{' '}
            <span className="text-white font-semibold">"{targetGoal?.name}"</span>?
            Todos os aportes registrados também serão removidos.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setIsDeleteConfirmOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDeleteGoal} disabled={saving}>
              {saving ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
