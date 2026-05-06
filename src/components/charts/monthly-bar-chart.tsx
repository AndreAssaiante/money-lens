'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { MonthlyData } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface MonthlyBarChartProps {
  data: MonthlyData[]
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Nenhum dado disponivel
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="month"
          stroke="#94a3b8"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
        />
        <YAxis
          stroke="#94a3b8"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          tickFormatter={(value) => `R$ ${value / 1000}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#e2e8f0',
          }}
          formatter={(value) => formatCurrency(Number(value) || 0)}
        />
        <Legend
          wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }}
        />
        <Bar
          dataKey="income"
          name="Receitas"
          fill="#10B981"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="expenses"
          name="Despesas"
          fill="#EF4444"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}