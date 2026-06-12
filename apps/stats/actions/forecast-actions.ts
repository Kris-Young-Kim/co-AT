'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface MonthlyPoint {
  label: string    // "2025-01"
  rental: number
  repair: number
  total: number
}

export interface ForecastPoint extends MonthlyPoint {
  forecast: true
}

export interface ForecastResult {
  history: MonthlyPoint[]
  forecast: ForecastPoint[]
}

function linearForecast(points: number[], steps: number): number[] {
  const n = points.length
  if (n < 2) return Array(steps).fill(points[0] ?? 0)
  const xMean = (n - 1) / 2
  const yMean = points.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (points[i] - yMean)
    den += (i - xMean) ** 2
  }
  const slope = den === 0 ? 0 : num / den
  const intercept = yMean - slope * xMean
  return Array.from({ length: steps }, (_, i) =>
    Math.max(0, Math.round(intercept + slope * (n + i)))
  )
}

export async function getForecastData(): Promise<{
  success: boolean
  data?: ForecastResult
  error?: string
}> {
  try {
    const supabase = createAdminClient()

    // Last 12 months
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    const fromStr = from.toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('eval_service_records')
      .select('received_at, is_rental, is_repair')
      .gte('received_at', fromStr)
      .not('received_at', 'is', null)

    if (error) return { success: false, error: error.message }

    // Build month buckets
    const buckets: Record<string, { rental: number; repair: number }> = {}
    for (let i = 0; i < 12; i++) {
      const d = new Date(from.getFullYear(), from.getMonth() + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      buckets[key] = { rental: 0, repair: 0 }
    }

    for (const r of (data ?? []) as any[]) {
      const key = (r.received_at as string).slice(0, 7)
      if (!buckets[key]) continue
      if (r.is_rental) buckets[key].rental++
      if (r.is_repair) buckets[key].repair++
    }

    const history: MonthlyPoint[] = Object.entries(buckets).map(([label, v]) => ({
      label,
      rental: v.rental,
      repair: v.repair,
      total: v.rental + v.repair,
    }))

    const rentalSeries = history.map(h => h.rental)
    const repairSeries = history.map(h => h.repair)
    const rentalForecast = linearForecast(rentalSeries, 3)
    const repairForecast = linearForecast(repairSeries, 3)

    const forecast: ForecastPoint[] = Array.from({ length: 3 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + 1 + i, 1)
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return {
        label,
        rental: rentalForecast[i],
        repair: repairForecast[i],
        total: rentalForecast[i] + repairForecast[i],
        forecast: true,
      }
    })

    return { success: true, data: { history, forecast } }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
