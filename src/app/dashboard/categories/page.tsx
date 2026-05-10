'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { supabase } from '@/lib/supabase'
import { defaultCategories } from '@/lib/utils'
import {
  Plus, Trash2, Pencil, Check,
  Utensils, Car, Home, Heart, Gamepad2, GraduationCap,
  ShoppingBag, Wrench, MoreHorizontal, Coffee, Plane, Gift,
  Music, BookOpen, Camera, Smartphone, DollarSign, Briefcase,
  Zap, Bus, Baby, Pill, Dumbbell, Dog, Shirt, Tv,
  Wifi, CreditCard, PiggyBank, Landmark,
} from 'lucide-react'
import { Category, CategoryFormData } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

// Mapa de ícones: chave salva no banco → componente Lucide
const ICON_MAP: Record<string, React.ReactNode> = {
  'utensils':        <Utensils className="w-5 h-5" />,
  'car':             <Car className="w-5 h-5" />,
  'home':            <Home className="w-5 h-5" />,
  'heart':           <Heart className="w-5 h-5" />,
  'gamepad-2':       <Gamepad2 className="w-5 h-5" />,
  'graduation-cap':  <GraduationCap className="w-5 h-5" />,
  'shopping-bag':    <ShoppingBag className="w-5 h-5" />,
  'wrench':          <Wrench className="w-5 h-5" />,
  'more-horizontal': <MoreHorizontal className="w-5 h-5" />,
  'coffee':          <Coffee className="w-5 h-5" />,
  'plane':           <Plane className="w-5 h-5" />,
  'gift':            <Gift className="w-5 h-5" />,
  'music':           <Music className="w-5 h-5" />,
  'book':            <BookOpen className="w-5 h-5" />,
  'camera':          <Camera className="w-5 h-5" />,
  'smartphone':      <Smartphone className="w-5 h-5" />,
  'dollar-sign':     <DollarSign className="w-5 h-5" />,
  'briefcase':       <Briefcase className="w-5 h-5" />,
  'zap':             <Zap className="w-5 h-5" />,
  'bus':             <Bus className="w-5 h-5" />,
  'baby':            <Baby className="w-5 h-5" />,
  'pill':            <Pill className="w-5 h-5" />,
  'dumbbell':        <Dumbbell className="w-5 h-5" />,
  'dog':             <Dog className="w-5 h-5" />,
  'shirt':           <Shirt className="w-5 h-5" />,
  'tv':              <Tv className="w-5 h-5" />,
  'wifi':            <Wifi className="w-5 h-5" />,
  'credit-card':     <CreditCard className="w-5 h-5" />,
  'piggy-bank':      <PiggyBank className="w-5 h-5" />,
  'landmark':        <Landmark className="w-5 h-5" />,
}

const ICON_KEYS = Object.keys(ICON_MAP)

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e',
  '#84cc16', '#14b8a6', '#6366f1', '#a855f7', '#64748b',
]

function CategoryIcon({ icon, color, size = 'md' }: { icon: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'w-8 h-8', md: 'w-11 h-11', lg: 'w-14 h-14' }
  return (
    <div
      className={`${sizeMap[size]} rounded-xl flex items-center justify-center flex-shrink-0`}
      style={{ backgroundColor: color + '20', color }}
    >
      {ICON_MAP[icon] ?? <MoreHorizontal className="w-5 h-5" />}
    </div>
  )
}

const emptyForm: CategoryFormData = { name: '', color: COLORS[0], icon: 'utensils' }

export default function CategoriesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>(emptyForm)

  useEffect(() => { if (user) fetchData() }, [user])

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('categories').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
      setCategories(data ?? [])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!user || !formData.name.trim()) return
    setSaving(true)
    try {
      if (editingCategory) {
        await supabase.from('categories').update(formData).eq('id', editingCategory.id).eq('user_id', user.id)
      } else {
        await supabase.from('categories').insert({ ...formData, user_id: user.id, is_default: false })
      }
      closeModal()
      fetchData()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta categoria?')) return
    await supabase.from('categories').delete().eq('id', id).eq('user_id', user?.id)
    fetchData()
  }

  const handleCreateDefaults = async () => {
    if (!user) return
    await supabase.from('categories').insert(
      defaultCategories.map(c => ({ user_id: user.id, ...c, is_default: true }))
    )
    fetchData()
  }

  const openAdd = () => { setEditingCategory(null); setFormData(emptyForm); setIsModalOpen(true) }
  const openEdit = (cat: Category) => {
    if (cat.is_default) return
    setEditingCategory(cat)
    setFormData({ name: cat.name, color: cat.color, icon: cat.icon })
    setIsModalOpen(true)
  }
  const closeModal = () => { setIsModalOpen(false); setEditingCategory(null); setFormData(emptyForm) }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <Header title="Categorias" subtitle={`${categories.length} categoria${categories.length !== 1 ? 's' : ''}`} />

      {/* Ações */}
      <div className="flex items-center justify-between mt-6 mb-5">
        <p className="text-gray-500 text-sm">
          {categories.length === 0
            ? 'Crie categorias para organizar seus gastos'
            : `${categories.filter(c => c.is_default).length} padrão · ${categories.filter(c => !c.is_default).length} personalizadas`}
        </p>
        <div className="flex items-center gap-3">
          {categories.length === 0 && (
            <Button onClick={handleCreateDefaults} variant="secondary" size="sm">
              Criar padrões
            </Button>
          )}
          <Button onClick={openAdd} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Categoria
          </Button>
        </div>
      </div>

      {/* Grid */}
      {categories.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-gray-600" />
            </div>
            <div>
              <p className="text-white font-medium mb-1">Nenhuma categoria</p>
              <p className="text-gray-500 text-sm">Comece com as categorias padrão ou crie as suas.</p>
            </div>
            <Button onClick={handleCreateDefaults} size="sm" variant="secondary">
              Criar categorias padrão
            </Button>
          </div>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
        >
          <AnimatePresence>
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="flex items-center gap-3 p-4 relative overflow-hidden group">
                  {/* Accent line */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: cat.color }} />

                  <CategoryIcon icon={cat.icon} color={cat.color} size="md" />

                  <div className="flex-1 min-w-0 ml-1">
                    <p className="text-white font-medium text-sm truncate">{cat.name}</p>
                    {cat.is_default && (
                      <span className="text-xs text-gray-500">Padrão</span>
                    )}
                  </div>

                  {!cat.is_default && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
      >
        <div className="space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-4 p-4 bg-gray-800/60 rounded-xl">
            <CategoryIcon icon={formData.icon} color={formData.color} size="lg" />
            <div>
              <p className="text-white font-semibold text-base">
                {formData.name || 'Nome da categoria'}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">Pré-visualização</p>
            </div>
          </div>

          {/* Nome */}
          <Input
            label="Nome"
            placeholder="Ex: Alimentação, Transporte..."
            value={formData.name}
            onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
          />

          {/* Cor */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Cor</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(f => ({ ...f, color }))}
                  className="w-8 h-8 rounded-lg transition-all hover:scale-110 relative flex-shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {formData.color === color && (
                    <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Ícone */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Ícone</label>
            <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto pr-1">
              {ICON_KEYS.map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData(f => ({ ...f, icon: key }))}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 ${
                    formData.icon === key
                      ? 'ring-2 ring-offset-1 ring-offset-gray-900'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                  style={
                    formData.icon === key
                      ? { backgroundColor: formData.color + '20', color: formData.color, outline: `2px solid ${formData.color}` }
                      : { color: '#9ca3af' }
                  }
                  title={key}
                >
                  {ICON_MAP[key]}
                </button>
              ))}
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" className="flex-1" onClick={closeModal} disabled={saving}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={saving || !formData.name.trim()}
            >
              {saving ? 'Salvando...' : editingCategory ? 'Salvar alterações' : 'Criar categoria'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
