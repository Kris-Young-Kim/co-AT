"use server"

import ExcelJS from 'exceljs'
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

// ────────────────────────────────────────────
// generateMonthlyReportExcel
// Produces a 2-sheet workbook for a given year+month:
//   Sheet 1 "실적 요약"  — aggregated counts by category
//   Sheet 2 "개별 기록"  — one row per service record
// ────────────────────────────────────────────

export async function generateMonthlyReportExcel(
  year: number,
  month: number
): Promise<{ success: boolean; buffer?: number[]; filename?: string; error?: string }> {
  if (!Number.isInteger(year) || year < 2000 || year > 2100)
    return { success: false, error: '유효하지 않은 연도입니다' }
  if (!Number.isInteger(month) || month < 1 || month > 12)
    return { success: false, error: '유효하지 않은 월입니다' }

  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('eval_service_records')
    .select('*')
    .eq('application_year', year)
    .eq('application_month', month)
    .order('received_at', { ascending: true })
    .limit(5000)

  if (error) return { success: false, error: error.message }

  type DetailRecord = {
    // Sheet 1 aggregation fields
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
    // Sheet 2 display fields
    name: string | null
    received_at: string | null
    disability_type: string | null
    region: string | null
    service_category: string | null
    product_name: string | null
    record_status: string | null
    staff_name: string | null
    [key: string]: unknown
  }

  const records = (data ?? []) as DetailRecord[]

  const flag = (key: keyof DetailRecord): number =>
    records.filter(r => r[key] === true).length

  // ── Sheet 1: 실적 요약 ─────────────────────────────────────
  const workbook = new ExcelJS.Workbook()
  const sheet1 = workbook.addWorksheet('실적 요약')
  sheet1.columns = [
    { header: '구분',  key: 'category', width: 20 },
    { header: '항목',  key: 'item',     width: 24 },
    { header: '건수',  key: 'count',    width: 12 },
  ]
  sheet1.getRow(1).font = { bold: true }

  const sep = { category: '', item: '', count: '' }

  // Section: 전체 건수
  sheet1.addRow({ category: `${year}년 ${month}월 실적`, item: '전체 건수', count: records.length })
  sheet1.addRow(sep)

  // Section: 서비스 유형
  const serviceTypes: Array<{ item: string; count: number }> = [
    { item: '상담',         count: flag('is_consult') },
    { item: '체험지원',     count: flag('is_trial') },
    { item: '대여',         count: flag('is_rental') },
    { item: '맞춤제작',     count: flag('is_custom_make') },
    { item: '교부사업 평가', count: flag('is_grant') },
    { item: '교육',         count: flag('is_education') },
    { item: '정보제공',     count: flag('is_info_provision') },
    { item: '소독·세척',    count: flag('is_cleaning') },
    { item: '수리',         count: flag('is_repair') },
    { item: '재사용지원',   count: flag('is_reuse') },
    { item: '모니터링',     count: flag('is_monitoring') },
    { item: '기타사업',     count: flag('is_other_business') },
  ]
  sheet1.addRow({ category: '서비스 유형', item: serviceTypes[0].item, count: serviceTypes[0].count })
  for (let i = 1; i < serviceTypes.length; i++) {
    sheet1.addRow({ category: '', item: serviceTypes[i].item, count: serviceTypes[i].count })
  }
  sheet1.addRow(sep)

  // Section: 재원 구분
  const fundingTypes: Array<{ item: string; count: number }> = [
    { item: '공적급여', count: flag('is_public_funding') },
    { item: '민간지원', count: flag('is_private_funding') },
    { item: '자부담',   count: flag('is_self_pay') },
  ]
  sheet1.addRow({ category: '재원 구분', item: fundingTypes[0].item, count: fundingTypes[0].count })
  for (let i = 1; i < fundingTypes.length; i++) {
    sheet1.addRow({ category: '', item: fundingTypes[i].item, count: fundingTypes[i].count })
  }
  sheet1.addRow(sep)

  // Section: 경제 상태
  const economicTypes: Array<{ item: string; count: number }> = [
    { item: '수급자', count: records.filter(r => r.economic_status === '수급자').length },
    { item: '차상위', count: records.filter(r => r.economic_status === '차상위').length },
    { item: '일반',   count: records.filter(r => r.economic_status === '일반').length },
  ]
  sheet1.addRow({ category: '경제 상태', item: economicTypes[0].item, count: economicTypes[0].count })
  for (let i = 1; i < economicTypes.length; i++) {
    sheet1.addRow({ category: '', item: economicTypes[i].item, count: economicTypes[i].count })
  }
  sheet1.addRow(sep)

  // Section: 장애 정도
  const severityTypes: Array<{ item: string; count: number }> = [
    { item: '중증', count: records.filter(r => r.disability_severity === '중증').length },
    { item: '경증', count: records.filter(r => r.disability_severity === '경증').length },
  ]
  sheet1.addRow({ category: '장애 정도', item: severityTypes[0].item, count: severityTypes[0].count })
  for (let i = 1; i < severityTypes.length; i++) {
    sheet1.addRow({ category: '', item: severityTypes[i].item, count: severityTypes[i].count })
  }

  // ── Sheet 2: 개별 기록 ─────────────────────────────────────
  const sheet2 = workbook.addWorksheet('개별 기록')
  sheet2.columns = [
    { header: '연번',         key: 'no',               width: 6  },
    { header: '성명',         key: 'name',             width: 10 },
    { header: '접수일',       key: 'received_at',      width: 12 },
    { header: '장애유형',     key: 'disability_type',  width: 14 },
    { header: '장애정도',     key: 'disability_severity', width: 10 },
    { header: '경제상태',     key: 'economic_status',  width: 10 },
    { header: '지역',         key: 'region',           width: 10 },
    { header: '서비스 카테고리', key: 'service_category', width: 18 },
    { header: '품목명',       key: 'product_name',     width: 20 },
    { header: '상담',         key: 'is_consult',       width: 6  },
    { header: '체험',         key: 'is_trial',         width: 6  },
    { header: '대여',         key: 'is_rental',        width: 6  },
    { header: '맞춤제작',     key: 'is_custom_make',   width: 8  },
    { header: '교부',         key: 'is_grant',         width: 6  },
    { header: '교육',         key: 'is_education',     width: 6  },
    { header: '상태',         key: 'record_status',    width: 8  },
    { header: '담당자',       key: 'staff_name',       width: 10 },
  ]
  sheet2.getRow(1).font = { bold: true }

  records.forEach((r, i) => {
    sheet2.addRow({
      no:                i + 1,
      name:              r.name ?? '',
      received_at:       r.received_at ?? '',
      disability_type:   r.disability_type ?? '',
      disability_severity: r.disability_severity ?? '',
      economic_status:   r.economic_status ?? '',
      region:            r.region ?? '',
      service_category:  r.service_category ?? '',
      product_name:      r.product_name ?? '',
      is_consult:        r.is_consult    ? '✓' : '',
      is_trial:          r.is_trial      ? '✓' : '',
      is_rental:         r.is_rental     ? '✓' : '',
      is_custom_make:    r.is_custom_make ? '✓' : '',
      is_grant:          r.is_grant      ? '✓' : '',
      is_education:      r.is_education  ? '✓' : '',
      record_status:     r.record_status ?? '',
      staff_name:        r.staff_name ?? '',
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return {
    success: true,
    buffer: Array.from(new Uint8Array(buffer as ArrayBuffer)),
    filename: `${year}년_${month}월_실적보고서.xlsx`,
  }
}
