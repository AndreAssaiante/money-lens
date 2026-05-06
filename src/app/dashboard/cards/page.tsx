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
import {
  Plus,
  Trash2,
  Edit,
  CreditCard,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { CardSettings, CardSettingsFormData } from '@/types'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function CardsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<CardSettings[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CardSettings | null>(null)

  const [formData, setFormData] = useState<CardSettingsFormData>({
    card_name: '',
    closing_day: 1,
    due_day: 10,
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
        .from('card_settings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setCards(data)
      }
    } catch (error) {
      console.error('Error fetching cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (editingCard) {
        const { error } = await supabase
          .from('card_settings')
          .update(formData)
          .eq('id', editingCard.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('card_settings')
          .insert({ ...formData, user_id: user.id })

        if (error) throw error
      }

      setIsModalOpen(false)
      setEditingCard(null)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving card:', error)
      alert('Erro ao salvar cartao')
    }
  }

  const handleEdit = (card: CardSettings) => {
    setEditingCard(card)
    setFormData({
      card_name: card.card_name,
      closing_day: card.closing_day,
      due_day: card.due_day,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cartao?')) return

    try {
      const { error } = await supabase
        .from('card_settings')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error deleting card:', error)
      alert('Erro ao excluir cartao')
    }
  }

  const resetForm = () => {
    setFormData({
      card_name: '',
      closing_day: 1,
      due_day: 10,
    })
  }

  const openAddModal = () => {
    setEditingCard(null)
    resetForm()
    setIsModalOpen(true)
  }

  // Check for upcoming due dates
  const getDaysUntilDue = (dueDay: number) => {
    const today = new Date()
    const currentDay = today.getDate()
    const daysUntil = dueDay - currentDay
    return daysUntil < 0 ? daysUntil + 30 : daysUntil
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <Header title="Cartoes" subtitle={`${cards.length} cartoes`} />

      <div className="flex justify-end mt-6">
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cartao
        </Button>
      </div>

      {/* Cards List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6"
      >
        {cards.length === 0 ? (
          <Card className="col-span-full">
            <p className="text-slate-500 text-center py-8">
              Nenhum cartao cadastrado
            </p>
          </Card>
        ) : (
          cards.map((card) => {
            const daysUntil = getDaysUntilDue(card.due_day)
            const isUrgent = daysUntil <= 5 && daysUntil >= 0

            return (
              <Card key={card.id} variant="gradient">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{card.card_name}</h3>
                      <p className="text-slate-400 text-sm">Final {card.card_name.slice(-4) || '****'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(card)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(card.id)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400 text-xs">Fechamento</span>
                    </div>
                    <p className="text-white font-semibold">Dia {card.closing_day}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400 text-xs">Vencimento</span>
                    </div>
                    <p className="text-white font-semibold">Dia {card.due_day}</p>
                  </div>
                </div>

                {isUrgent && (
                  <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-400 text-sm">
                      Fatura vence em {daysUntil} dia(s)
                    </span>
                  </div>
                )}

                <Link
                  href={`/invoices?card=${card.id}`}
                  className="mt-4 block w-full py-2 bg-violet-600 hover:bg-violet-500 text-white text-center rounded-lg transition-colors"
                >
                  Ver Faturas
                </Link>
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
          setEditingCard(null)
          resetForm()
        }}
        title={editingCard ? 'Editar Cartao' : 'Novo Cartao'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome do Cartao"
            placeholder="Ex: Nubank, Inter, Itau"
            value={formData.card_name}
            onChange={(e) => setFormData({ ...formData, card_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Dia do Fechamento"
              type="number"
              min="1"
              max="31"
              value={formData.closing_day}
              onChange={(e) => setFormData({ ...formData, closing_day: parseInt(e.target.value) || 1 })}
              required
            />
            <Input
              label="Dia do Vencimento"
              type="number"
              min="1"
              max="31"
              value={formData.due_day}
              onChange={(e) => setFormData({ ...formData, due_day: parseInt(e.target.value) || 1 })}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {editingCard ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}