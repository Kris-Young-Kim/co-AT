'use client'

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyPoint, ForecastPoint } from '@/actions/forecast-actions'

interface ForecastChartProps {
  history: MonthlyPoint[]
  forecast: ForecastPoint[]
  title: string
  dataKey: 'rental' | 'repair' | 'total'
  color: string
}

export function ForecastChart({ history, forecast, title, dataKey, color }: ForecastChartProps) {
  const combined = [
    ...history.map(h => ({ ...h, isForecast: false })),
    ...forecast.map(f => ({ ...f, isForecast: true })),
  ]

  const splitLabel = forecast[0]?.label

  return (
    <div className="border rounded-lg bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={combined} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip
            formatter={(value: number | string | undefined, name: string | undefined) => [
              `${value ?? '—'}건`,
              name === 'actual' ? '실적' : '예측',
            ]}
            labelFormatter={(label: string) => `${label}`}
          />
          <Legend
            formatter={(value) => (value === 'actual' ? '실적' : '예측 (선형 추세)')}
            wrapperStyle={{ fontSize: 11 }}
          />
          {splitLabel && (
            <ReferenceLine
              x={splitLabel}
              stroke="#94a3b8"
              strokeDasharray="4 2"
              label={{ value: '예측 →', position: 'top', fontSize: 10, fill: '#94a3b8' }}
            />
          )}
          <Bar
            dataKey={(d: any) => (d.isForecast ? undefined : d[dataKey])}
            name="actual"
            fill={color}
            fillOpacity={0.7}
            radius={[3, 3, 0, 0]}
          />
          <Line
            dataKey={(d: any) => (d.isForecast ? d[dataKey] : undefined)}
            name="forecast"
            stroke={color}
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={{ r: 4, fill: color }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
