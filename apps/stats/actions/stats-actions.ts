'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface ServiceActuals {
  consultation: number
  experience: number
  rental: number
  customMake: number
  assessment: number
  cleaning: number
  repair: number
  reuse: number
  education: number
}

export interface MonthlyStats {
  month: number
  consultation: number
  experience: number
  rental: number
  customMake: number
  assessment: number
  cleaning: number
  repair: number
  reuse: number
  education: number
  total: number
}

export interface YearlyStats {
  year: number
  consultation: number
  experience: number
  rental: number
  customMake: number
  assessment: number
  cleaning: number
  repair: number
  reuse: number
  education: number
  total: number
}

export interface StatsSummary {
  totalRecords: number
  totalClients: number
  completionRate: number
  businessSummary: ServiceActuals
}

type ServiceRow = {
  client_id: string | null
  record_status: string | null
  application_month: number | null
  received_at: string | null
  is_consult: boolean | null
  is_trial: boolean | null
  is_rental: boolean | null
  is_custom_make: boolean | null
  is_grant: boolean | null
  is_cleaning: boolean | null
  is_repair: boolean | null
  is_reuse: boolean | null
  is_education: boolean | null
}

function tally(rows: ServiceRow[]): ServiceActuals {
  const s: ServiceActuals = {
    consultation: 0, experience: 0, rental: 0, customMake: 0,
    assessment: 0, cleaning: 0, repair: 0, reuse: 0, education: 0,
  }
  for (const r of rows) {
    if (r.is_consult) s.consultation++
    if (r.is_trial) s.experience++
    if (r.is_rental) s.rental++
    if (r.is_custom_make) s.customMake++
    if (r.is_grant) s.assessment++
    if (r.is_cleaning) s.cleaning++
    if (r.is_repair) s.repair++
    if (r.is_reuse) s.reuse++
    if (r.is_education) s.education++
  }
  return s
}

export async function getStatsSummary(year: number): Promise<
  { success: true; summary: StatsSummary } | { success: false; error: string }
> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('eval_service_records')
      .select('client_id, record_status, is_consult, is_trial, is_rental, is_custom_make, is_grant, is_cleaning, is_repair, is_reuse, is_education')
      .eq('application_year', year)

    if (error) return { success: false, error: error.message }

    const rows = (data ?? []) as ServiceRow[]
    const totalRecords = rows.length
    const totalClients = new Set(rows.filter(r => r.client_id).map(r => r.client_id)).size
    const completed = rows.filter(r => r.record_status === '완료').length
    const completionRate = totalRecords > 0 ? (completed / totalRecords) * 100 : 0
    const businessSummary = tally(rows)

    return { success: true, summary: { totalRecords, totalClients, completionRate, businessSummary } }
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
      .from('eval_service_records')
      .select('application_month, received_at, is_consult, is_trial, is_rental, is_custom_make, is_grant, is_cleaning, is_repair, is_reuse, is_education')
      .eq('application_year', year)

    if (error) return { success: false, error: error.message }

    const byMonth: Record<number, MonthlyStats> = {}
    for (let m = 1; m <= 12; m++) {
      byMonth[m] = { month: m, consultation: 0, experience: 0, rental: 0, customMake: 0, assessment: 0, cleaning: 0, repair: 0, reuse: 0, education: 0, total: 0 }
    }

    for (const r of (data ?? []) as ServiceRow[]) {
      const m = r.application_month ?? (r.received_at ? new Date(r.received_at).getMonth() + 1 : null)
      if (!m || !byMonth[m]) continue
      if (r.is_consult) { byMonth[m].consultation++; byMonth[m].total++ }
      if (r.is_trial) { byMonth[m].experience++; byMonth[m].total++ }
      if (r.is_rental) { byMonth[m].rental++; byMonth[m].total++ }
      if (r.is_custom_make) { byMonth[m].customMake++; byMonth[m].total++ }
      if (r.is_grant) { byMonth[m].assessment++; byMonth[m].total++ }
      if (r.is_cleaning) { byMonth[m].cleaning++; byMonth[m].total++ }
      if (r.is_repair) { byMonth[m].repair++; byMonth[m].total++ }
      if (r.is_reuse) { byMonth[m].reuse++; byMonth[m].total++ }
      if (r.is_education) { byMonth[m].education++; byMonth[m].total++ }
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
      .from('eval_service_records')
      .select('application_year, is_consult, is_trial, is_rental, is_custom_make, is_grant, is_cleaning, is_repair, is_reuse, is_education')
      .gte('application_year', fromYear)
      .lte('application_year', toYear)

    if (error) return { success: false, error: error.message }

    const byYear: Record<number, YearlyStats> = {}
    for (let y = fromYear; y <= toYear; y++) {
      byYear[y] = { year: y, consultation: 0, experience: 0, rental: 0, customMake: 0, assessment: 0, cleaning: 0, repair: 0, reuse: 0, education: 0, total: 0 }
    }

    for (const r of (data ?? []) as (ServiceRow & { application_year: number | null })[]) {
      const y = (r as { application_year: number | null }).application_year
      if (!y || !byYear[y]) continue
      if (r.is_consult) { byYear[y].consultation++; byYear[y].total++ }
      if (r.is_trial) { byYear[y].experience++; byYear[y].total++ }
      if (r.is_rental) { byYear[y].rental++; byYear[y].total++ }
      if (r.is_custom_make) { byYear[y].customMake++; byYear[y].total++ }
      if (r.is_grant) { byYear[y].assessment++; byYear[y].total++ }
      if (r.is_cleaning) { byYear[y].cleaning++; byYear[y].total++ }
      if (r.is_repair) { byYear[y].repair++; byYear[y].total++ }
      if (r.is_reuse) { byYear[y].reuse++; byYear[y].total++ }
      if (r.is_education) { byYear[y].education++; byYear[y].total++ }
    }

    return { success: true, stats: Object.values(byYear) }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
