'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ChannelStatRow } from '@/actions/call-log-actions'

interface Props {
  rows: ChannelStatRow[]
}

export function IntakeChannelChart({ rows }: Props) {
  const data = rows.map((r) => ({
    name: `${r.month}월`,
    유선: r.phone,
    온라인: r.web,
    챗봇: r.chatbot,
  }))

  return (
    <div className="border rounded-lg bg-white p-4">
      <p className="text-sm font-medium text-gray-700 mb-3">월별 채널 비교</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barSize={14} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            formatter={(value: number | undefined, name: string | undefined) => [`${value ?? 0}건`, name ?? '']}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="유선" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          <Bar dataKey="온라인" fill="#22c55e" radius={[2, 2, 0, 0]} />
          <Bar dataKey="챗봇" fill="#a855f7" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
