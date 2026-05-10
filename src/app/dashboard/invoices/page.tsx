'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatMonth } from '@/lib/utils'
import {
  Upload,
  FileText,
  Trash2,
  Download,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Pencil,
  X,
} from 'lucide-react'
import { Invoice, CardSettings } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import type { OCRResult, ExtractedTransaction } from '@/app/api/ocr-invoice/route'

interface EditableTransaction extends ExtractedTransaction {
  _id: string
  selected: boolean
  description_edited: string
  amount_edited: number
}

export default function InvoicesPage() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [cards, setCards] = useState<CardSettings[]>([])
  const [selectedCard, setSelectedCard] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // OCR state
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [editableTransactions, setEditableTransactions] = useState<EditableTransaction[]>([])
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [ocrError, setOcrError] = useState('')
  const [uploadedInvoiceId, setUploadedInvoiceId] = useState<string | null>(null)

  useEffect(() => {
    if (user) fetchData()
  }, [user, selectedCard])

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: cardsData } = await supabase
        .from('card_settings').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      if (cardsData) setCards(cardsData)

      let query = supabase
        .from('invoices').select('*').eq('user_id', user.id).order('uploaded_at', { ascending: false })
      if (selectedCard) query = query.eq('card_settings_id', selectedCard)

      const { data: invoicesData } = await query
      if (invoicesData) setInvoices(invoicesData)
    } catch (err) {
      console.error('Erro ao buscar faturas:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]

    setUploading(true)
    setOcrError('')
    setOcrResult(null)

    try {
      // 1. Upload do arquivo para Supabase Storage
      const fileName = `${user.id}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage.from('invoices').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('invoices').getPublicUrl(fileName)

      // 2. OCR via Claude
      const formData = new FormData()
      formData.append('file', file)

      const ocrRes = await fetch('/api/ocr-invoice', { method: 'POST', body: formData })

      let result: OCRResult | null = null
      if (ocrRes.ok) {
        result = await ocrRes.json()
        setOcrResult(result)
      } else {
        const errData = await ocrRes.json()
        setOcrError(errData.error ?? 'Erro no OCR. As transações precisarão ser inseridas manualmente.')
      }

      // 3. Salva registro da fatura
      const now = new Date()
      const invoiceMonth = result?.invoiceMonth ? parseInt(result.invoiceMonth) : now.getMonth() + 1
      const invoiceYear = result?.invoiceYear ? parseInt(result.invoiceYear) : now.getFullYear()
      const total = result?.total ?? 0

      const { data: savedInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          card_settings_id: selectedCard || cards[0]?.id || null,
          invoice_month: invoiceMonth,
          invoice_year: invoiceYear,
          total_amount: total,
          file_url: urlData.publicUrl,
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError
      setUploadedInvoiceId(savedInvoice?.id ?? null)

      // 4. Prepara transações para revisão
      if (result?.transactions?.length) {
        setEditableTransactions(
          result.transactions.map((t, i) => ({
            ...t,
            _id: `tx-${i}`,
            selected: true,
            description_edited: t.description,
            amount_edited: t.amount,
          }))
        )
        setIsReviewModalOpen(true)
      }

      fetchData()
    } catch (err) {
      console.error('Erro no upload:', err)
      setOcrError('Erro ao fazer upload da fatura. Tente novamente.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSaveTransactions = async () => {
    if (!user) return
    setSaving(true)
    try {
      const selected = editableTransactions.filter(t => t.selected)
      if (selected.length === 0) {
        setIsReviewModalOpen(false)
        return
      }

      const now = new Date()
      const rows = selected.map(t => {
        let txDate = now.toISOString().split('T')[0]
        if (t.date) {
          const parts = t.date.split('/')
          if (parts.length === 3) {
            txDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
          }
        }
        return {
          user_id: user.id,
          description: t.description_edited,
          amount: t.amount_edited,
          is_expense: true,
          transaction_date: txDate,
          category_id: null,
          card_last_digits: ocrResult?.cardLastDigits ?? null,
          is_installment: !!t.installments,
          installment_total: t.installments ? parseInt(t.installments.split('/')[1] ?? '1') : null,
        }
      })

      const { error } = await supabase.from('transactions').insert(rows)
      if (error) throw error

      setIsReviewModalOpen(false)
      setOcrResult(null)
      setEditableTransactions([])
    } catch (err) {
      console.error('Erro ao salvar transações:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fatura?')) return
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id).eq('user_id', user?.id)
      if (error) throw error
      fetchData()
    } catch (err) {
      console.error('Erro ao excluir fatura:', err)
    }
  }

  const toggleTransaction = (id: string) => {
    setEditableTransactions(ts => ts.map(t => t._id === id ? { ...t, selected: !t.selected } : t))
  }

  const updateTransaction = (id: string, field: 'description_edited' | 'amount_edited', value: string | number) => {
    setEditableTransactions(ts => ts.map(t => t._id === id ? { ...t, [field]: value } : t))
  }

  const cardOptions = [
    { value: '', label: 'Todos os cartões' },
    ...cards.map(c => ({ value: c.id, label: c.card_name })),
  ]

  const filteredInvoices = invoices.filter(inv => {
    if (!searchTerm) return true
    const s = searchTerm.toLowerCase()
    return (
      inv.invoice_month.toString().includes(s) ||
      inv.invoice_year.toString().includes(s) ||
      formatCurrency(inv.total_amount).toLowerCase().includes(s)
    )
  })

  const selectedCount = editableTransactions.filter(t => t.selected).length
  const selectedTotal = editableTransactions.filter(t => t.selected).reduce((s, t) => s + t.amount_edited, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <Header title="Faturas" subtitle={`${invoices.length} fatura${invoices.length !== 1 ? 's' : ''}`} />

      {/* Upload Section */}
      <Card className="mt-6 border-dashed border-2 border-emerald-500/30 bg-emerald-500/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              {uploading ? (
                <div className="animate-spin w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full" />
              ) : (
                <Sparkles className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold">Upload de Fatura com IA</h3>
              <p className="text-gray-400 text-sm">
                {uploading
                  ? 'Analisando fatura com Claude...'
                  : 'Envie uma imagem ou PDF — o Claude extrai todas as transações automaticamente'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select
              options={cardOptions}
              value={selectedCard}
              onChange={e => setSelectedCard(e.target.value)}
              className="w-48"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="invoice-upload"
              disabled={uploading}
            />
            <label
              htmlFor="invoice-upload"
              className={`px-4 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-2 text-sm font-medium ${
                uploading
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Processando...' : 'Enviar Fatura'}
            </label>
          </div>
        </div>

        {ocrError && (
          <div className="mt-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-amber-300 text-sm">{ocrError}</p>
          </div>
        )}
      </Card>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mt-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar faturas..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <Select
          options={cardOptions}
          value={selectedCard}
          onChange={e => setSelectedCard(e.target.value)}
          className="w-full md:w-48"
        />
      </div>

      {/* Lista de faturas */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-4">
        {filteredInvoices.length === 0 ? (
          <Card>
            <p className="text-gray-500 text-center py-8">Nenhuma fatura encontrada</p>
          </Card>
        ) : (
          filteredInvoices.map(invoice => (
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
                        {cards.find(c => c.id === invoice.card_settings_id)?.card_name || 'Cartão'}
                      </Badge>
                      <span className="text-gray-400 text-sm">
                        {new Date(invoice.uploaded_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xl font-semibold text-red-400">{formatCurrency(invoice.total_amount)}</p>
                  <a href={invoice.file_url} target="_blank" rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                    <Download className="w-4 h-4 text-gray-400" />
                  </a>
                  <button onClick={() => handleDelete(invoice.id)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </motion.div>

      {/* Modal de revisão das transações extraídas */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => { setIsReviewModalOpen(false); setEditableTransactions([]) }}
        title="Transações Extraídas pela IA"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          {ocrResult?.cardLastDigits && (
            <div className="flex items-center gap-2">
              <Badge variant="info">Cartão final {ocrResult.cardLastDigits}</Badge>
              {ocrResult.invoiceMonth && ocrResult.invoiceYear && (
                <Badge variant="default">
                  Fatura: {formatMonth(parseInt(ocrResult.invoiceMonth), parseInt(ocrResult.invoiceYear))}
                </Badge>
              )}
            </div>
          )}

          <p className="text-gray-400 text-sm">
            Revise as transações extraídas. Desmarque as que não deseja importar e corrija valores se necessário.
          </p>

          {/* Selecionar/desmarcar todos */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setEditableTransactions(ts => ts.map(t => ({ ...t, selected: true })))}
              className="text-emerald-400 text-xs hover:underline"
            >
              Selecionar todos
            </button>
            <button
              onClick={() => setEditableTransactions(ts => ts.map(t => ({ ...t, selected: false })))}
              className="text-gray-500 text-xs hover:underline"
            >
              Desmarcar todos
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            <AnimatePresence>
              {editableTransactions.map(t => (
                <motion.div
                  key={t._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    t.selected
                      ? 'bg-gray-800/60 border-gray-700'
                      : 'bg-gray-900/40 border-gray-800 opacity-50'
                  }`}
                >
                  <button onClick={() => toggleTransaction(t._id)} className="flex-shrink-0">
                    {t.selected
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      : <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <input
                      value={t.description_edited}
                      onChange={e => updateTransaction(t._id, 'description_edited', e.target.value)}
                      disabled={!t.selected}
                      className="w-full bg-transparent text-white text-sm focus:outline-none border-b border-transparent focus:border-gray-600 transition-colors truncate"
                    />
                    {t.date && <p className="text-gray-600 text-xs mt-0.5">{t.date}{t.installments ? ` • Parcela ${t.installments}` : ''}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-gray-500 text-sm">R$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={t.amount_edited}
                      onChange={e => updateTransaction(t._id, 'amount_edited', parseFloat(e.target.value) || 0)}
                      disabled={!t.selected}
                      className="w-24 bg-transparent text-red-400 text-sm font-medium text-right focus:outline-none border-b border-transparent focus:border-gray-600 transition-colors"
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Resumo */}
          <div className="border-t border-gray-700 pt-4 flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              {selectedCount} transaç{selectedCount !== 1 ? 'ões' : 'ão'} selecionada{selectedCount !== 1 ? 's' : ''}
            </p>
            <p className="text-red-400 font-bold text-lg">{formatCurrency(selectedTotal)}</p>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1"
              onClick={() => { setIsReviewModalOpen(false); setEditableTransactions([]) }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSaveTransactions}
              disabled={saving || selectedCount === 0}
            >
              {saving ? 'Salvando...' : `Importar ${selectedCount} transaç${selectedCount !== 1 ? 'ões' : 'ão'}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
