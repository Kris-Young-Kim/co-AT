'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { GrantEvalMonthStat } from '@/actions/grant-eval-stats-actions'

interface Props {
  stats: GrantEvalMonthStat[]
  year: number
}

const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

export function GrantEvalMonthlyChart({ stats, year }: Props) {
  const data = stats.map((s, i) => ({
    month: MONTH_LABELS[i],
    전체: s.total,
    적합: s.approved,
  }))

  return (
    <div className="bg-white border rounded-lg p-6 mb-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">{year}년 월별 평가 건수</h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
          <Tooltip formatter={(value: number) => [`${value}건`]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="전체" fill="#bfdbfe" radius={[3, 3, 0, 0]} />
          <Bar dataKey="적합" fill="#2563eb" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
