'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { FinanceMonthlySpend } from '@co-at/types'

const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

function tickFormatter(n: number): string {
  if (n >= 100_000_000) return (n / 100_000_000).toFixed(0) + '억'
  if (n >= 10_000)      return Math.round(n / 10_000) + '만'
  return n.toLocaleString('ko-KR')
}

export function MonthlyBarChart({ data }: { data: FinanceMonthlySpend[] }) {
  const chartData = data.map(m => ({
    month: MONTH_LABELS[m.month - 1],
    집행액: m.amount,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={tickFormatter} width={52} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(v: number | string | undefined) => [Number(v ?? 0).toLocaleString('ko-KR') + '원', '집행액']}
        />
        <Bar dataKey="집행액" fill="#10b981" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
