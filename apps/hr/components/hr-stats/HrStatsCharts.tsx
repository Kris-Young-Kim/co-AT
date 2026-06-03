'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import type {
  HrStatsSummary,
  HrHeadcountByDept,
  HrEmploymentTypeCount,
  HrMonthlyTrend,
  HrTenureBucket,
} from '@co-at/types'

const PIE_COLORS = ['#7c3aed', '#4f46e5', '#2563eb', '#0891b2', '#059669']

type Props = {
  summary:         HrStatsSummary
  headcountByDept: HrHeadcountByDept[]
  employmentTypes: HrEmploymentTypeCount[]
  monthlyTrend:    HrMonthlyTrend[]
  tenureBuckets:   HrTenureBucket[]
}

export function HrStatsCharts({ summary, headcountByDept, employmentTypes, monthlyTrend, tenureBuckets }: Props) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '재직 인원', value: summary.totalActive, unit: '명', color: 'text-violet-700' },
          { label: '신규 입사 (올해)', value: summary.newHiresThisYear, unit: '명', color: 'text-blue-700' },
          { label: '퇴사 (올해)', value: summary.leavesThisYear, unit: '명', color: 'text-orange-700' },
          { label: '평균 근속연수', value: summary.avgTenureYears, unit: '년', color: 'text-green-700' },
        ].map(card => (
          <div key={card.label} className="bg-white border rounded-xl px-5 py-4">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>
              {card.value}<span className="text-sm font-normal ml-1">{card.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Headcount by Dept */}
        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">부서별 인원 현황</h3>
          {headcountByDept.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">데이터 없음</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={headcountByDept} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis dataKey="department" type="category" width={80} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v}명`, '인원']} />
                <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Employment Type Pie */}
        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">고용형태별 분포</h3>
          {employmentTypes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">데이터 없음</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={employmentTypes as unknown as Record<string, unknown>[]}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name} ${value}명`}
                  labelLine={true}
                >
                  {employmentTypes.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(v) => [`${v}명`]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly Hire/Leave Trend */}
        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">월별 입·퇴사 추이 (최근 12개월)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyTrend} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={m => m.slice(5)} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={m => `${m}`}
                formatter={(v, name) => [
                  `${v}명`,
                  name === 'hires' ? '입사' : '퇴사',
                ]}
              />
              <Legend formatter={name => name === 'hires' ? '입사' : '퇴사'} />
              <Line type="monotone" dataKey="hires"  stroke="#7c3aed" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="leaves" stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tenure Distribution */}
        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">근속연수 분포</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tenureBuckets} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`${v}명`, '인원']} />
              <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
