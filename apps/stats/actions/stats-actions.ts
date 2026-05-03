'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface MonthlyStats {
  month: number
  consultation: number
  experience: number
  custom: number
  aftercare: number
  education: number
  total: number
}

export interface YearlyStats {
  year: number
  consultation: number
  experience: number
  custom: number
  aftercare: number
  education: number
  total: number
}

interface StatsSummary {
  totalApplications: number
  totalClients: number
  completionRate: number
  businessSummary: {
    consultation: number
    experience: number
    custom: number
    aftercare: number
    education: number
  }
}

function categorize(category: string | null): keyof StatsSummary['businessSummary'] | null {
  switch (category) {
    case 'consultation': return 'consultation'
    case 'experience': return 'experience'
    case 'custom_make':
    case 'rental':
    case 'assessment':
    case 'custom': return 'custom'
    case 'cleaning':
    case 'repair':
    case 'reuse':
    case 'aftercare': return 'aftercare'
    case 'education':
    case 'promotion': return 'education'
    default: return null
  }
}

export async function getStatsSummary(startDate: string, endDate: string): Promise<
  { success: true; summary: StatsSummary } | { success: false; error: string }
> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('applications')
      .select('category, sub_category, client_id, status')
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59')

    if (error) return { success: false, error: error.message }

    const apps = data ?? []
    const totalApplications = apps.length
    const totalClients = new Set(apps.map(a => a.client_id)).size
    const completed = apps.filter(a => a.status === 'completed').length
    const completionRate = totalApplications > 0 ? (completed / totalApplications) * 100 : 0

    const businessSummary = { consultation: 0, experience: 0, custom: 0, aftercare: 0, education: 0 }
    for (const app of apps) {
      const key = categorize(app.sub_category) ?? categorize(app.category)
      if (key) businessSummary[key]++
    }

    return { success: true, summary: { totalApplications, totalClients, completionRate, businessSummary } }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function getMonthlyStats(year: number): Promise<
  { success: true; stats: MonthlyStats[] } | { success: false; error: string }
> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('applications')
      .select('category, sub_category, created_at')
      .gte('created_at', `${year}-01-01`)
      .lte('created_at', `${year}-12-31T23:59:59`)

    if (error) return { success: false, error: error.message }

    const byMonth: Record<number, MonthlyStats> = {}
    for (let m = 1; m <= 12; m++) {
      byMonth[m] = { month: m, consultation: 0, experience: 0, custom: 0, aftercare: 0, education: 0, total: 0 }
    }

    for (const app of data ?? []) {
      if (!app.created_at) continue
      const m = new Date(app.created_at).getMonth() + 1
      const key = categorize(app.sub_category) ?? categorize(app.category)
      if (key && byMonth[m]) {
        byMonth[m][key]++
        byMonth[m].total++
      }
    }

    return { success: true, stats: Object.values(byMonth) }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function getYearlyStats(fromYear: number, toYear: number): Promise<
  { success: true; stats: YearlyStats[] } | { success: false; error: string }
> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('applications')
      .select('category, sub_category, created_at, service_year')
      .gte('created_at', `${fromYear}-01-01`)
      .lte('created_at', `${toYear}-12-31T23:59:59`)

    if (error) return { success: false, error: error.message }

    const byYear: Record<number, YearlyStats> = {}
    for (let y = fromYear; y <= toYear; y++) {
      byYear[y] = { year: y, consultation: 0, experience: 0, custom: 0, aftercare: 0, education: 0, total: 0 }
    }

    for (const app of data ?? []) {
      const y = app.service_year ?? (app.created_at ? new Date(app.created_at).getFullYear() : null)
      if (!y || !byYear[y]) continue
      const key = categorize(app.sub_category) ?? categorize(app.category)
      if (key) {
        byYear[y][key]++
        byYear[y].total++
      }
    }

    return { success: true, stats: Object.values(byYear) }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
