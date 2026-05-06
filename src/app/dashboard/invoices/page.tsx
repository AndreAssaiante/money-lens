'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatMonth } from '@/lib/utils'
import {
  Upload,
  FileText,
  Trash2,
  Download,
  CreditCard,
  Calendar,
  Search,
} from 'lucide-react'
import { Invoice, CardSettings, Transaction } from '@/types'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function InvoicesPage() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [cards, setCards] = useState<CardSettings[]>([])
  const [selectedCard, setSelectedCard] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [extractedTransactions, setExtractedTransactions] = useState<Partial<Transaction>[]>([])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, selectedCard])

  const fetchData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data: cardsData } = await supabase
        .from('card_settings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (cardsData) {
        setCards(cardsData)
      }

      let query = supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false })

      if (selectedCard) {
        query = query.eq('card_settings_id', selectedCard)
      }

      const { data: invoicesData } = await query

      if (invoicesData) {
        setInvoices(invoicesData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    setUploading(true)

    try {
      // Upload file to storage
      const fileName = `${user.id}/${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName)

      // For now, simulate extracted transactions (in a real app, this would use OCR/AI)
      const simulatedTransactions: Partial<Transaction>[] = [
        { description: 'Amazon AWS', amount: 89.90, is_expense: true },
        { description: 'Netflix', amount: 55.90, is_expense: true },
        { description: 'Spotify', amount: 21.90, is_expense: true },
        { description: 'Uber', amount: 34.50, is_expense: true },
        { description: 'Ifood', amount: 67.30, is_expense: true },
      ]

      setExtractedTransactions(simulatedTransactions)

      // Save invoice record
      const now = new Date()
      const invoiceData = {
        user_id: user.id,
        card_settings_id: selectedCard || cards[0]?.id,
        invoice_month: now.getMonth() + 1,
        invoice_year: now.getFullYear(),
        total_amount: simulatedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        file_url: urlData.publicUrl,
      }

      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData)

      if (invoiceError) throw invoiceError

      // Open preview modal
      setSelectedInvoice(invoiceData as unknown as Invoice)
      setIsPreviewModalOpen(true)

      fetchData()
    } catch (error) {
      console.error('Error uploading invoice:', error)
      alert('Erro ao fazer upload da fatura')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fatura?')) return

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert('Erro ao excluir fatura')
    }
  }

  const cardOptions = [
    { value: '', label: 'Todos os cartoes' },
    ...cards.map(c => ({ value: c.id, label: c.card_name })),
  ]

  const filteredInvoices = invoices.filter(inv => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        inv.invoice_month.toString().includes(searchLower) ||
        inv.invoice_year.toString().includes(searchLower) ||
        formatCurrency(inv.total_amount).toLowerCase().includes(searchLower)
      )
    }
    return true
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
      <Header title="Faturas" subtitle={`${invoices.length} faturas`} />

      {/* Upload Section */}
      <Card className="mt-6 border-dashed border-2 border-violet-500/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Upload className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Upload de Fatura</h3>
              <p className="text-slate-400 text-sm">
                Arraste ou clique para enviar uma imagem ou PDF da sua fatura
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Select
              options={cardOptions}
              value={selectedCard}
              onChange={(e) => setSelectedCard(e.target.value)}
              className="w-48"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="invoice-upload"
            />
            <label
              htmlFor="invoice-upload"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg cursor-pointer transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Enviando...' : 'Escolher Arquivo'}
            </label>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mt-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar faturas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <Select
          options={cardOptions}
          value={selectedCard}
          onChange={(e) => setSelectedCard(e.target.value)}
          className="w-full md:w-48"
        />
      </div>

      {/* Invoices List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-6 space-y-4"
      >
        {filteredInvoices.length === 0 ? (
          <Card>
            <p className="text-slate-500 text-center py-8">
              Nenhuma fatura encontrada
            </p>
          </Card>
        ) : (
          filteredInvoices.map((invoice) => (
            <Card key={invoice.id} variant="gradient">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      {formatMonth(invoice.invoice_month, invoice.invoice_year)}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="info">
                        {cards.find(c => c.id === invoice.card_settings_id)?.card_name || 'Cartao'}
                      </Badge>
                      <span className="text-slate-400 text-sm">
                        {new Date(invoice.uploaded_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xl font-semibold text-red-400">
                    {formatCurrency(invoice.total_amount)}
                  </p>
                  <a
                    href={invoice.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                  </a>
                  <button
                    onClick={() => handleDelete(invoice.id)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </motion.div>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false)
          setSelectedInvoice(null)
          setExtractedTransactions([])
        }}
        title="Transacoes Extraidas"
      >
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">
            As seguintes transacoes foram extraidas da fatura. Revise e confirme para salvar.
          </p>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {extractedTransactions.map((transaction, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-white">{transaction.description}</span>
                </div>
                <span className="text-red-400 font-medium">
                  {formatCurrency(transaction.amount || 0)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-700 pt-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total:</span>
              <span className="text-xl font-semibold text-red-400">
                {formatCurrency(extractedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0))}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => {
                setIsPreviewModalOpen(false)
                setSelectedInvoice(null)
                setExtractedTransactions([])
              }}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                // In a real app, save these transactions to the database
                alert('Transacoes salvas com sucesso!')
                setIsPreviewModalOpen(false)
                setSelectedInvoice(null)
                setExtractedTransactions([])
              }}
            >
              Salvar Transacoes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}