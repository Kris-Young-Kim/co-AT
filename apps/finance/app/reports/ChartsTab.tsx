'use client'

import { useEffect, useState } from 'react'
import {
  RadialBarChart, RadialBar, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, LabelList, ResponsiveContainer,
} from 'recharts'
import { getDashboardData } from '@/actions/finance-actions'
import type { FinanceDashboardData } from '@co-at/types'
import {
  formatKRW, getExecutionColor,
  buildFundingSourceData, buildQuarterlyData, buildSubsidyTypeData,
} from './chart-utils'

interface Props {
  initialYear: number
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-lg p-5">
      <p className="font-semibold mb-3">{title}</p>
      {children}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-100 rounded-lg h-64" />
        <div className="bg-gray-100 rounded-lg h-64" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-100 rounded-lg h-64" />
        <div className="bg-gray-100 rounded-lg h-64" />
      </div>
      <div className="bg-gray-100 rounded-lg h-64" />
    </div>
  )
}

export function ChartsTab({ initialYear }: Props) {
  const now = new Date()
  const [year, setYear] = useState(initialYear)
  const [data, setData] = useState<FinanceDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getDashboardData(year)
      .then(setData)
      .catch(() => setError('데이터를 불러오지 못했습니다'))
      .finally(() => setLoading(false))
  }, [year])

  return (
    <div className="space-y-6">
      <div className="flex gap-2 items-center">
        <select
          value={year}
          onChange={e => setYear(parseInt(e.target.value))}
          className="border rounded-md px-3 py-1.5 text-sm"
        >
          {years.map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
      </div>

      {loading && <Skeleton />}
      {!loading && error && <p className="text-red-500 text-sm">{error}</p>}
      {!loading && !error && data && <Charts data={data} />}
    </div>
  )
}

function Charts({ data }: { data: FinanceDashboardData }) {
  const executionColor = getExecutionColor(data.executionRate)
  const fundingData    = buildFundingSourceData(data.totalBudget, data.totalSpent)
  const quarterlyData  = buildQuarterlyData(data.monthlySpend, data.totalBudget)
  const subsidyData    = buildSubsidyTypeData(data.categoryStats)
  const businessData   = data.categoryStats.map(s => ({ name: s.category.name, rate: s.rate }))

  return (
    <div className="space-y-4">
      {/* Row 1 */}
      <div className="grid grid-cols-2 gap-4">
        {/* Chart 1: 전체 집행률 */}
        <ChartCard title="전체 집행률">
          <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                cx="50%" cy="50%"
                innerRadius="60%" outerRadius="80%"
                barSize={20}
                data={[{ name: '집행률', value: data.executionRate, fill: executionColor }]}
                startAngle={90} endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold" style={{ color: executionColor }}>
                {data.executionRate}%
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 text-center">
            <div>
              <p className="text-gray-500 text-xs">총예산</p>
              <p className="text-sm font-medium">{formatKRW(data.totalBudget)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">집행액</p>
              <p className="text-sm font-medium">{formatKRW(data.totalSpent)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">잔액</p>
              <p className="text-sm font-medium">{formatKRW(data.remaining)}</p>
            </div>
          </div>
        </ChartCard>

        {/* Chart 2: 국비·도비 구분 */}
        <ChartCard title="국비·도비 구분">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={fundingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={n => Math.round(n / 10_000) + '만'} width={55} />
              <Tooltip formatter={(v: string | number | undefined) => formatKRW(Number(v ?? 0))} />
              <Legend />
              <Bar dataKey="예산" fill="#93c5fd" />
              <Bar dataKey="집행액" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-4">
        {/* Chart 3: 사업별 집행률 */}
        <ChartCard title="사업별 집행률">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={businessData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 120]} tickFormatter={n => n + '%'} />
              <Tooltip formatter={(v: string | number | undefined) => Number(v ?? 0) + '%'} />
              <ReferenceLine
                y={100}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{ value: '100%', position: 'right', fontSize: 11 }}
              />
              <Bar dataKey="rate" fill="#10b981" name="집행률">
                <LabelList dataKey="rate" position="top" formatter={(v: string | number | boolean | null | undefined) => Number(v ?? 0) + '%'} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 4: 사업별 × 보조유형 */}
        <ChartCard title="사업별 · 보조유형별">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={subsidyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={n => Math.round(n / 10_000) + '만'} width={55} />
              <Tooltip formatter={(v: string | number | undefined) => formatKRW(Number(v ?? 0))} />
              <Legend />
              <Bar dataKey="예산" fill="#a5b4fc" />
              <Bar dataKey="집행액" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: full width */}
      <ChartCard title="분기별 지출">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={quarterlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={n => Math.round(n / 10_000) + '만'} width={55} />
            <Tooltip formatter={(v: string | number | undefined) => formatKRW(Number(v ?? 0))} />
            <ReferenceLine
              y={data.totalBudget / 4}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              label={{ value: '균등 기준', position: 'right', fontSize: 11 }}
            />
            <Bar dataKey="집행액" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
