"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"

// ────────────────────────────────────────────
// Interfaces
// ────────────────────────────────────────────

export interface MonthlyReportSummary {
  year: number
  month: number
  totalRecords: number
  // 서비스 유형
  consult: number
  trial: number
  rental: number
  customMake: number
  grant: number
  education: number
  infoProvision: number
  cleaning: number
  repair: number
  reuse: number
  monitoring: number
  otherBusiness: number
  // 재원 구분
  publicFunding: number
  privateFunding: number
  selfPay: number
  // 경제 상태
  beneficiary: number   // 수급자
  nearPoverty: number   // 차상위
  general: number       // 일반
  // 장애 정도
  severe: number        // 중증
  mild: number          // 경증
}

export interface MonthlyGridItem {
  month: number
  totalRecords: number
  completedRecords: number
}

// ────────────────────────────────────────────
// getYearlyMonthlyGrid
// Returns a 12-item array with per-month record counts for the given year.
// ────────────────────────────────────────────

export async function getYearlyMonthlyGrid(
  year: number
): Promise<{ success: true; grid: MonthlyGridItem[] } | { success: false; error: string }> {
  if (!Number.isInteger(year) || year < 2000 || year > 2100)
    return { success: false, error: '유효하지 않은 연도입니다' }

  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('eval_service_records')
    .select('application_month, record_status')
    .eq('application_year', year)
    .not('application_month', 'is', null)

  if (error) return { success: false, error: error.message }

  // Zero-initialize all 12 months
  const grid: MonthlyGridItem[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    totalRecords: 0,
    completedRecords: 0,
  }))

  type Row = { application_month: number | null; record_status: string | null }
  const rows = (data ?? []) as Row[]

  for (const row of rows) {
    const m = row.application_month
    if (m == null || m < 1 || m > 12) continue
    const idx = m - 1
    grid[idx].totalRecords++
    if (row.record_status === '완료') {
      grid[idx].completedRecords++
    }
  }

  return { success: true, grid }
}

// ────────────────────────────────────────────
// getMonthlyReportSummary
// Aggregates service record fields for a given year+month.
// ────────────────────────────────────────────

export async function getMonthlyReportSummary(
  year: number,
  month: number
): Promise<{ success: true; summary: MonthlyReportSummary } | { success: false; error: string }> {
  if (!Number.isInteger(year) || year < 2000 || year > 2100)
    return { success: false, error: '유효하지 않은 연도입니다' }
  if (!Number.isInteger(month) || month < 1 || month > 12)
    return { success: false, error: '유효하지 않은 월입니다' }

  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('eval_service_records')
    .select(`
      is_consult, is_trial, is_rental, is_custom_make, is_grant,
      is_education, is_info_provision, is_cleaning, is_repair,
      is_reuse, is_monitoring, is_other_business,
      is_public_funding, is_private_funding, is_self_pay,
      economic_status, disability_severity
    `)
    .eq('application_year', year)
    .eq('application_month', month)
    .limit(5000)

  if (error) return { success: false, error: error.message }

  type ServiceRecord = {
    is_consult: boolean | null
    is_trial: boolean | null
    is_rental: boolean | null
    is_custom_make: boolean | null
    is_grant: boolean | null
    is_education: boolean | null
    is_info_provision: boolean | null
    is_cleaning: boolean | null
    is_repair: boolean | null
    is_reuse: boolean | null
    is_monitoring: boolean | null
    is_other_business: boolean | null
    is_public_funding: boolean | null
    is_private_funding: boolean | null
    is_self_pay: boolean | null
    economic_status: string | null
    disability_severity: string | null
    [key: string]: unknown
  }

  const records = (data ?? []) as ServiceRecord[]

  const count = (flag: keyof ServiceRecord): number =>
    records.filter(r => r[flag] === true).length

  const summary: MonthlyReportSummary = {
    year,
    month,
    totalRecords: records.length,
    // 서비스 유형
    consult:       count('is_consult'),
    trial:         count('is_trial'),
    rental:        count('is_rental'),
    customMake:    count('is_custom_make'),
    grant:         count('is_grant'),
    education:     count('is_education'),
    infoProvision: count('is_info_provision'),
    cleaning:      count('is_cleaning'),
    repair:        count('is_repair'),
    reuse:         count('is_reuse'),
    monitoring:    count('is_monitoring'),
    otherBusiness: count('is_other_business'),
    // 재원 구분
    publicFunding:  count('is_public_funding'),
    privateFunding: count('is_private_funding'),
    selfPay:        count('is_self_pay'),
    // 경제 상태
    beneficiary: records.filter(r => r.economic_status === '수급자').length,
    nearPoverty: records.filter(r => r.economic_status === '차상위').length,
    general:     records.filter(r => r.economic_status === '일반').length,
    // 장애 정도
    severe: records.filter(r => r.disability_severity === '중증').length,
    mild:   records.filter(r => r.disability_severity === '경증').length,
  }

  return { success: true, summary }
}
