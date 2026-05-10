'use client'

import {
  Utensils, Car, Home, Heart, Gamepad2, GraduationCap,
  ShoppingBag, Wrench, MoreHorizontal, Coffee, Plane, Gift,
  Music, BookOpen, Camera, Smartphone, DollarSign, Briefcase,
  Zap, Bus, Baby, Pill, Dumbbell, Dog, Shirt, Tv,
  Wifi, CreditCard, PiggyBank, Landmark,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ElementType> = {
  'utensils':        Utensils,
  'car':             Car,
  'home':            Home,
  'heart':           Heart,
  'gamepad-2':       Gamepad2,
  'graduation-cap':  GraduationCap,
  'shopping-bag':    ShoppingBag,
  'wrench':          Wrench,
  'more-horizontal': MoreHorizontal,
  'coffee':          Coffee,
  'plane':           Plane,
  'gift':            Gift,
  'music':           Music,
  'book':            BookOpen,
  'camera':          Camera,
  'smartphone':      Smartphone,
  'dollar-sign':     DollarSign,
  'briefcase':       Briefcase,
  'zap':             Zap,
  'bus':             Bus,
  'baby':            Baby,
  'pill':            Pill,
  'dumbbell':        Dumbbell,
  'dog':             Dog,
  'shirt':           Shirt,
  'tv':              Tv,
  'wifi':            Wifi,
  'credit-card':     CreditCard,
  'piggy-bank':      PiggyBank,
  'landmark':        Landmark,
}

interface CategoryIconProps {
  icon: string
  color: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  xs: { wrap: 'w-7 h-7 rounded-lg',  icon: 'w-3.5 h-3.5' },
  sm: { wrap: 'w-9 h-9 rounded-lg',  icon: 'w-4 h-4' },
  md: { wrap: 'w-11 h-11 rounded-xl', icon: 'w-5 h-5' },
  lg: { wrap: 'w-14 h-14 rounded-xl', icon: 'w-6 h-6' },
}

export function CategoryIcon({ icon, color, size = 'md', className = '' }: CategoryIconProps) {
  const IconComponent = ICON_MAP[icon] ?? MoreHorizontal
  const { wrap, icon: iconSize } = sizeMap[size]

  return (
    <div
      className={`${wrap} flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ backgroundColor: color + '20', color }}
    >
      <IconComponent className={iconSize} />
    </div>
  )
}
