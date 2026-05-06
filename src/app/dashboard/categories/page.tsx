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
  Plus,
  Trash2,
  Edit,
  Check,
} from 'lucide-react'
import { Category, CategoryFormData } from '@/types'
import { motion } from 'framer-motion'

const ICONS = ['utensils', 'car', 'home', 'heart', 'gamepad-2', 'graduation-cap', 'shopping-bag', 'wrench', 'more-horizontal', 'coffee', 'plane', 'gift', 'music', 'book', 'camera', 'smartphone', 'dollar-sign', 'briefcase']

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD',
  '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
  '#FF69B4', '#32CD32', '#FF4500', '#9370DB', '#20B2AA',
]

export default function CategoriesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    color: COLORS[0],
    icon: 'more-horizontal',
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
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (data) {
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingCategory.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({ ...formData, user_id: user.id, is_default: false })

        if (error) throw error
      }

      setIsModalOpen(false)
      setEditingCategory(null)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Erro ao salvar categoria')
    }
  }

  const handleEdit = (category: Category) => {
    if (category.is_default) {
      alert('Categorias padrao nao podem ser editadas')
      return
    }
    setEditingCategory(category)
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Erro ao excluir categoria')
    }
  }

  const handleCreateDefaults = async () => {
    if (!user) return

    try {
      const categoriesToInsert = defaultCategories.map(cat => ({
        user_id: user.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        is_default: true,
      }))

      const { error } = await supabase
        .from('categories')
        .insert(categoriesToInsert)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error creating default categories:', error)
      alert('Erro ao criar categorias padrao')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      color: COLORS[0],
      icon: 'more-horizontal',
    })
  }

  const openAddModal = () => {
    setEditingCategory(null)
    resetForm()
    setIsModalOpen(true)
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
      <Header title="Categorias" subtitle={`${categories.length} categorias`} />

      <div className="flex justify-end mt-6">
        {categories.length === 0 && (
          <Button onClick={handleCreateDefaults} variant="secondary" className="mr-4">
            Criar Padroes
          </Button>
        )}
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6"
      >
        {categories.length === 0 ? (
          <Card className="col-span-full">
            <p className="text-slate-500 text-center py-8">
              Nenhuma categoria criada. Clique em "Criar Padroes" para adicionar categorias pre-definidas.
            </p>
          </Card>
        ) : (
          categories.map((category) => (
            <Card key={category.id} variant="gradient">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: category.color + '20' }}
                >
                  {category.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium">{category.name}</h3>
                    {category.is_default && (
                      <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-400">
                        Padrao
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-slate-400 text-sm">#{category.color}</span>
                  </div>
                </div>
                {!category.is_default && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                )}
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
          setEditingCategory(null)
          resetForm()
        }}
        title={editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome"
            placeholder="Ex: Alimentacao"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Cor</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    formData.color === color
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                      : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Icone</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                    formData.icon === icon
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {editingCategory ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}