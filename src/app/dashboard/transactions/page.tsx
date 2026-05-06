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
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react'
import { Transaction, Category, TransactionFormData } from '@/types'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'

export default function TransactionsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterType, setFilterType] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const [formData, setFormData] = useState<TransactionFormData>({
    description: '',
    amount: 0,
    category_id: null,
    transaction_date: new Date().toISOString().split('T')[0],
    is_expense: true,
  })

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setIsModalOpen(true)
    }
  }, [searchParams])

  const fetchData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)

      if (categoriesData) {
        setCategories(categoriesData)
      }

      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })

      if (transactionsData) {
        setTransactions(transactionsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (editingTransaction) {
        const { error } = await supabase
          .from('transactions')
          .update(formData)
          .eq('id', editingTransaction.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert({ ...formData, user_id: user.id })

        if (error) throw error
      }

      setIsModalOpen(false)
      setEditingTransaction(null)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving transaction:', error)
      alert('Erro ao salvar transacao')
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      description: transaction.description,
      amount: transaction.amount,
      category_id: transaction.category_id,
      transaction_date: transaction.transaction_date,
      is_expense: transaction.is_expense,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transacao?')) return

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('Erro ao excluir transacao')
    }
  }

  const resetForm = () => {
    setFormData({
      description: '',
      amount: 0,
      category_id: null,
      transaction_date: new Date().toISOString().split('T')[0],
      is_expense: true,
    })
  }

  const openAddModal = () => {
    setEditingTransaction(null)
    resetForm()
    setIsModalOpen(true)
  }

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(t => {
      if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      if (filterCategory && t.category_id !== filterCategory) {
        return false
      }
      if (filterType && String(t.is_expense) !== filterType) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      const dateA = new Date(a.transaction_date).getTime()
      const dateB = new Date(b.transaction_date).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

  const categoryOptions = [
    { value: '', label: 'Todas as categorias' },
    ...categories.map(c => ({ value: c.id, label: c.name })),
  ]

  const typeOptions = [
    { value: '', label: 'Todos os tipos' },
    { value: 'true', label: 'Despesa' },
    { value: 'false', label: 'Receita' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <Header title="Transacoes" subtitle={`${filteredTransactions.length} registros`} />

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 mt-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            placeholder="Buscar transacao..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11"
          />
        </div>
        <Select
          options={categoryOptions}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full md:w-48"
        />
        <Select
          options={typeOptions}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full md:w-40"
        />
        <Button onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
          <ChevronDown className={`w-4 h-4 mr-2 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
          Data
        </Button>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Nova
        </Button>
      </div>

      {/* Transactions List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-6 space-y-3"
      >
        {filteredTransactions.length === 0 ? (
          <Card>
            <p className="text-slate-500 text-center py-8">
              Nenhuma transacao encontrada
            </p>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id} variant="gradient">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: (transaction.category?.color || '#666') + '20' }}
                  >
                    <span className="text-xl">{transaction.category?.icon || '?'}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{transaction.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={transaction.is_expense ? 'danger' : 'success'}>
                        {transaction.is_expense ? 'Despesa' : 'Receita'}
                      </Badge>
                      {transaction.category && (
                        <span className="text-slate-400 text-sm">
                          {transaction.category.name}
                        </span>
                      )}
                      <span className="text-slate-500 text-sm">
                        {formatDate(transaction.transaction_date)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className={`text-lg font-semibold ${transaction.is_expense ? 'text-red-400' : 'text-emerald-400'}`}>
                    {transaction.is_expense ? '-' : '+'}{formatCurrency(transaction.amount)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
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
          setEditingTransaction(null)
          resetForm()
        }}
        title={editingTransaction ? 'Editar Transacao' : 'Nova Transacao'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Descricao"
            placeholder="Ex: Compras no supermercado"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

          <Select
            label="Categoria"
            options={[
              { value: '', label: 'Selecione uma categoria' },
              ...categories.map(c => ({ value: c.id, label: c.name })),
            ]}
            value={formData.category_id || ''}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value || null })}
          />

          <Input
            label="Data"
            type="date"
            value={formData.transaction_date}
            onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
            required
          />

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={formData.is_expense}
                onChange={() => setFormData({ ...formData, is_expense: true })}
                className="w-4 h-4 accent-violet-500"
              />
              <span className="text-slate-300">Despesa</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!formData.is_expense}
                onChange={() => setFormData({ ...formData, is_expense: false })}
                className="w-4 h-4 accent-emerald-500"
              />
              <span className="text-slate-300">Receita</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {editingTransaction ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}