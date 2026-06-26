"use server"

import ExcelJS from 'exceljs'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'

export interface MonthlyConfirmedRow {
  month: number
  consult: number
  assessment: number
  trial: number
  rental: number
  custom_make: number
  grant: number
  education: number
  info_provision: number
  other_business: number
  total_cases: number
  total_clients: number
}

type RawServiceRow = {
  client_id: string | null
  application_month: number | null
  received_at: string | null
  is_consult: boolean | null
  is_assessment: boolean | null
  is_trial: boolean | null
  is_rental: boolean | null
  is_custom_make: boolean | null
  is_grant: boolean | null
  is_education: boolean | null
  is_info_provision: boolean | null
  is_other_business: boolean | null
}

function buildEmptyRow(month: number): MonthlyConfirmedRow & { clientIds: Set<string> } {
  return {
    month, consult: 0, assessment: 0, trial: 0, rental: 0,
    custom_make: 0, grant: 0, education: 0, info_provision: 0,
    other_business: 0, total_cases: 0, total_clients: 0, clientIds: new Set(),
  }
}

export async function getMonthlyConfirmedSummary(year: number): Promise<
  { success: true; rows: MonthlyConfirmedRow[] } | { success: false; error: string }
> {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { success: false, error: '유효하지 않은 연도입니다' }
  }
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('eval_service_records')
      .select(
        'client_id, application_month, received_at, ' +
        'is_consult, is_assessment, is_trial, is_rental, is_custom_make, ' +
        'is_grant, is_education, is_info_provision, is_other_business'
      )
      .eq('record_status', '완료')
      .eq('application_year', year)

    if (error) return { success: false, error: error.message }

    const byMonth: Record<number, MonthlyConfirmedRow & { clientIds: Set<string> }> = {}
    for (let m = 1; m <= 12; m++) byMonth[m] = buildEmptyRow(m)

    for (const r of (data ?? []) as RawServiceRow[]) {
      const m = r.application_month ?? (r.received_at ? new Date(r.received_at).getMonth() + 1 : null)
      if (!m || !byMonth[m]) continue

      byMonth[m].total_cases++
      if (r.client_id) byMonth[m].clientIds.add(r.client_id)
      if (r.is_consult) byMonth[m].consult++
      if (r.is_assessment) byMonth[m].assessment++
      if (r.is_trial) byMonth[m].trial++
      if (r.is_rental) byMonth[m].rental++
      if (r.is_custom_make) byMonth[m].custom_make++
      if (r.is_grant) byMonth[m].grant++
      if (r.is_education) byMonth[m].education++
      if (r.is_info_provision) byMonth[m].info_provision++
      if (r.is_other_business) byMonth[m].other_business++
    }

    const rows: MonthlyConfirmedRow[] = Object.values(byMonth).map(({ clientIds, ...row }) => ({
      ...row,
      total_clients: clientIds.size,
    }))

    return { success: true, rows }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export async function generateMonthlyConfirmedExcel(year: number): Promise<
  { success: boolean; buffer?: number[]; filename?: string; error?: string }
> {
  const result = await getMonthlyConfirmedSummary(year)
  if (!result.success) return { success: false, error: result.error }

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('월별 확정 실적')

  const HEADERS = ['월', '상담', '평가', '체험', '대여', '맞춤제작', '교부평가', '교육', '정보제공', '기타사업', '합계건수', '연인원']
  const headerRow = sheet.addRow(HEADERS)
  headerRow.font = { bold: true }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
  HEADERS.forEach((_, i) => {
    sheet.getColumn(i + 1).width = i === 0 ? 6 : 10
  })

  const totals: Omit<MonthlyConfirmedRow, 'month'> = {
    consult: 0, assessment: 0, trial: 0, rental: 0, custom_make: 0,
    grant: 0, education: 0, info_provision: 0, other_business: 0,
    total_cases: 0, total_clients: 0,
  }

  for (const row of result.rows) {
    sheet.addRow([
      MONTH_LABELS[row.month - 1],
      row.consult, row.assessment, row.trial, row.rental, row.custom_make,
      row.grant, row.education, row.info_provision, row.other_business,
      row.total_cases, row.total_clients,
    ])
    totals.consult += row.consult
    totals.assessment += row.assessment
    totals.trial += row.trial
    totals.rental += row.rental
    totals.custom_make += row.custom_make
    totals.grant += row.grant
    totals.education += row.education
    totals.info_provision += row.info_provision
    totals.other_business += row.other_business
    totals.total_cases += row.total_cases
    totals.total_clients += row.total_clients
  }

  const totalRow = sheet.addRow([
    '합계',
    totals.consult, totals.assessment, totals.trial, totals.rental, totals.custom_make,
    totals.grant, totals.education, totals.info_provision, totals.other_business,
    totals.total_cases, totals.total_clients,
  ])
  totalRow.font = { bold: true }
  totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }

  sheet.insertRow(1, [`${year}년 월별 확정 실적 (중앙보조기기센터)`])
  sheet.getRow(1).font = { bold: true, size: 13 }
  sheet.mergeCells(1, 1, 1, HEADERS.length)

  try {
    const buffer = await workbook.xlsx.writeBuffer()
    return {
      success: true,
      buffer: Array.from(new Uint8Array(buffer as ArrayBuffer)),
      filename: `월별확정실적_${year}년.xlsx`,
    }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
