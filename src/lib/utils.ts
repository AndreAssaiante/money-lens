import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ')
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatMonth(month: number, year: number): string {
  const date = new Date(year, month - 1)
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function getMonthName(month: number): string {
  const date = new Date(2000, month - 1)
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
  }).format(date)
}

export function getCurrentMonth(): number {
  return new Date().getMonth() + 1
}

export function getCurrentYear(): number {
  return new Date().getFullYear()
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

export function isOverBudget(expensePercentage: number, threshold: number = 30): boolean {
  return expensePercentage > threshold
}

export const defaultCategories = [
  { name: 'Alimentacao', color: '#FF6B6B', icon: 'utensils' },
  { name: 'Transporte', color: '#4ECDC4', icon: 'car' },
  { name: 'Moradia', color: '#45B7D1', icon: 'home' },
  { name: 'Saude', color: '#96CEB4', icon: 'heart' },
  { name: 'Lazer', color: '#DDA0DD', icon: 'gamepad-2' },
  { name: 'Educacao', color: '#98D8C8', icon: 'graduation-cap' },
  { name: 'Shopping', color: '#F7DC6F', icon: 'shopping-bag' },
  { name: 'Servicos', color: '#BB8FCE', icon: 'wrench' },
  { name: 'Outros', color: '#85C1E9', icon: 'more-horizontal' },
]

export const investmentTypes = [
  { value: 'fixed', label: 'Renda Fixa', icon: 'shield' },
  { value: 'variable', label: 'Renda Variavel', icon: 'trending-up' },
  { value: 'real_estate', label: 'Imoveis', icon: 'building' },
  { value: 'crypto', label: 'Criptoativos', icon: 'bitcoin' },
  { value: 'other', label: 'Outros', icon: 'wallet' },
]