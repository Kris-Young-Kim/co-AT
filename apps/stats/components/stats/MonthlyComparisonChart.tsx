'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { MonthlyStats } from '@/actions/stats-actions'

interface Props {
  currentYear: number
  currentStats: MonthlyStats[]
  prevStats: MonthlyStats[]
}

const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

export function MonthlyComparisonChart({ currentYear, currentStats, prevStats }: Props) {
  const data = MONTH_LABELS.map((label, i) => {
    const month = i + 1
    const curr = currentStats.find(s => s.month === month)
    const prev = prevStats.find(s => s.month === month)
    return {
      month: label,
      [currentYear]: curr?.total ?? 0,
      [currentYear - 1]: prev?.total ?? 0,
    }
  })

  return (
    <div className="bg-white border rounded-lg p-6 mb-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">
        전년 동기 대비 ({currentYear - 1}년 vs {currentYear}년)
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={36} />
          <Tooltip
            formatter={(value: number | undefined, name: string | number | undefined) => [`${value ?? 0}건`, `${name ?? ''}년`]}
          />
          <Legend
            formatter={(value: string) => `${value}년`}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey={String(currentYear - 1)}
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey={String(currentYear)}
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
