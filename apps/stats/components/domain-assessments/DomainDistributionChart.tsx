'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { DomainCountStat } from '@/actions/domain-assessment-stats-actions'

const DOMAIN_COLORS: Record<string, string> = {
  WC: '#3b82f6',
  ADL: '#22c55e',
  S: '#eab308',
  SP: '#a855f7',
  EC: '#f97316',
  CA: '#06b6d4',
  L: '#ec4899',
  AAC: '#6366f1',
  AM: '#ef4444',
}

const DOMAIN_LABELS: Record<string, string> = {
  WC: '휠체어',
  ADL: '일상생활',
  S: '감각',
  SP: '자세',
  EC: '환경개조',
  CA: '컴퓨터',
  L: '레저',
  AAC: 'AAC',
  AM: '자동차',
}

interface Props {
  stats: DomainCountStat[]
}

export function DomainDistributionChart({ stats }: Props) {
  const data = stats.map(s => ({
    name: DOMAIN_LABELS[s.domain_type] ?? s.domain_type,
    domain: s.domain_type,
    건수: s.count,
  }))

  return (
    <div className="bg-white border rounded-lg p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">영역별 평가 건수</h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
          <Tooltip formatter={(value) => [`${value ?? 0}건`]} />
          <Bar dataKey="건수" radius={[3, 3, 0, 0]}>
            {data.map(entry => (
              <Cell key={entry.domain} fill={DOMAIN_COLORS[entry.domain] ?? '#94a3b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
