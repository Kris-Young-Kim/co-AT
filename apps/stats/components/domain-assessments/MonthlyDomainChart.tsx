'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import type { MonthlyDomainStat } from '@/actions/domain-assessment-stats-actions'

interface Props {
  stats: MonthlyDomainStat[]
}

export function MonthlyDomainChart({ stats }: Props) {
  const data = stats.map(s => ({
    month: s.month.slice(5),  // MM
    full: s.month,
    건수: s.count,
  }))

  return (
    <div className="bg-white border rounded-lg p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">월별 평가 건수 추이 (최근 12개월)</h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
          <Tooltip
            labelFormatter={(label, payload) => payload?.[0]?.payload?.full ?? label}
            formatter={(value) => [`${value ?? 0}건`]}
          />
          <Line type="monotone" dataKey="건수" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
