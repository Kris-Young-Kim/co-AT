"use server"

import path from 'path'
import ExcelJS from 'exceljs'
import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"

function getTemplatePath(filename: string): string {
  return path.join(process.cwd(), 'public', 'templates', filename)
}

// ────────────────────────────────────────────
// 콜센터 상담 일지 엑셀 출력
// ────────────────────────────────────────────

export async function generateCallLogReport(params: {
  startDate: string
  endDate: string
}): Promise<{ success: boolean; buffer?: number[]; filename?: string; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('v_call_log_report')
    .select('*')
    .gte('log_date', params.startDate)
    .lte('log_date', params.endDate)
    .limit(10000)

  if (error) return { success: false, error: error.message }
  if (!data?.length) return { success: false, error: '해당 기간에 데이터가 없습니다' }

  const rows = data as Record<string, unknown>[]

  const templatePath = getTemplatePath('call_log_template.xlsx')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(templatePath)

  // Group rows by year — inject into year-named sheets (e.g. "2026", "2025")
  const yearGroups: Record<string, Record<string, unknown>[]> = {}
  for (const row of rows) {
    const year = (row.log_date as string | null)?.slice(0, 4) ?? 'unknown'
    if (!yearGroups[year]) yearGroups[year] = []
    yearGroups[year].push(row)
  }

  for (const [year, yearRows] of Object.entries(yearGroups)) {
    const sheet = workbook.getWorksheet(year)
    if (!sheet) continue

    let rowNum = 9
    for (const record of yearRows) {
      const r = sheet.getRow(rowNum)
      r.getCell(2).value = rowNum - 8
      r.getCell(3).value = record.log_date as string
      r.getCell(4).value = record.requester_name as string
      r.getCell(5).value = record.requester_region as string
      r.getCell(6).value = record.requester_contact as string
      r.getCell(7).value = record.requester_type as string
      r.getCell(8).value = record.target_name as string
      r.getCell(9).value = record.target_gender as string
      r.getCell(10).value = record.target_disability_type as string
      r.getCell(11).value = record.target_disability_severity as string
      r.getCell(12).value = record.target_economic_status as string
      r.getCell(13).value = record.q_public_benefit ? '✓' : ''
      r.getCell(14).value = record.q_private_benefit ? '✓' : ''
      r.getCell(15).value = record.q_device ? '✓' : ''
      r.getCell(16).value = record.q_case_management ? '✓' : ''
      r.getCell(17).value = record.q_other ? '✓' : ''
      r.getCell(18).value = record.question_content as string
      r.getCell(19).value = record.answer as string
      r.getCell(20).value = record.staff_name as string
      r.commit()
      rowNum++
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const filename = `콜센터_상담일지_${params.startDate}_${params.endDate}.xlsx`
  return { success: true, buffer: Array.from(new Uint8Array(buffer)), filename }
}

// ────────────────────────────────────────────
// 서비스 실적 엑셀 출력
// ────────────────────────────────────────────

export async function generateServiceRecordReport(params: {
  startDate: string
  endDate: string
}): Promise<{ success: boolean; buffer?: number[]; filename?: string; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('v_service_record_report')
    .select('*')
    .gte('received_at', params.startDate)
    .lte('received_at', params.endDate)
    .limit(10000)

  if (error) return { success: false, error: error.message }
  if (!data?.length) return { success: false, error: '해당 기간에 데이터가 없습니다' }

  const rows = data as Record<string, unknown>[]

  const templatePath = getTemplatePath('service_record_template.xlsx')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(templatePath)

  const sheet = workbook.getWorksheet('보조기기 서비스 상세')
  if (!sheet) return { success: false, error: '템플릿에서 시트를 찾을 수 없습니다' }

  let rowNum = 10
  for (const record of rows) {
    const r = sheet.getRow(rowNum)
    r.getCell(1).value = record.received_at as string
    r.getCell(2).value = rowNum - 9
    r.getCell(8).value = record.name as string
    r.getCell(9).value = record.birth_date as string
    r.getCell(12).value = record.region as string
    r.getCell(13).value = record.disability_type as string
    r.getCell(14).value = record.service_category as string
    r.getCell(15).value = record.product_name as string
    r.getCell(16).value = record.item_category as string
    r.getCell(17).value = record.service_content as string
    r.getCell(18).value = record.service_area as string
    r.getCell(19).value = record.is_consult ? '✓' : ''
    r.getCell(20).value = record.is_assessment ? '✓' : ''
    r.getCell(21).value = record.is_trial ? '✓' : ''
    r.getCell(22).value = record.is_rental ? '✓' : ''
    r.getCell(23).value = record.is_custom_make ? '✓' : ''
    r.getCell(24).value = record.is_grant ? '✓' : ''
    r.getCell(25).value = record.is_education ? '✓' : ''
    r.getCell(26).value = record.is_other_business ? '✓' : ''
    r.getCell(27).value = record.is_info_provision ? '✓' : ''
    r.getCell(28).value = record.is_public_funding ? '✓' : ''
    r.getCell(29).value = record.is_private_funding ? '✓' : ''
    r.getCell(30).value = record.is_self_pay ? '✓' : ''
    r.getCell(31).value = record.is_funding_secured ? '✓' : ''
    r.getCell(32).value = record.is_repair ? '✓' : ''
    r.getCell(33).value = record.is_cleaning ? '✓' : ''
    r.getCell(34).value = record.is_reuse ? '✓' : ''
    r.getCell(35).value = record.is_monitoring ? '✓' : ''
    r.getCell(36).value = record.referral_type as string
    r.getCell(37).value = record.is_phone ? '✓' : ''
    r.getCell(38).value = record.is_visit_in ? '✓' : ''
    r.getCell(39).value = record.is_visit_out ? '✓' : ''
    r.getCell(40).value = record.is_closed ? '종결' : ''
    r.getCell(41).value = record.staff_name as string
    // ── columns added in migration 050 ─────────────────────────
    r.getCell(3).value = record.application_year as number
    r.getCell(4).value = record.application_month as number
    r.getCell(5).value = record.application_no as number
    r.getCell(6).value = record.is_re_application ? '재신청' : ''
    r.getCell(7).value = record.record_status as string
    r.getCell(10).value = record.gender as string
    r.getCell(11).value = record.economic_status as string
    r.getCell(42).value = record.service_major_category as string
    r.getCell(43).value = record.service_sub_category as string
    r.getCell(44).value = record.disability_severity as string
    r.getCell(45).value = record.consultation_date as string
    r.getCell(46).value = record.performance_date as string
    r.getCell(47).value = record.closed_at as string
    r.getCell(48).value = record.monitoring_date as string
    r.getCell(49).value = record.trial_device_count as number
    r.getCell(50).value = record.info_provision_area as string
    r.getCell(51).value = record.funding_source_detail as string
    r.commit()
    rowNum++
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const filename = `서비스_실적_${params.startDate}_${params.endDate}.xlsx`
  return { success: true, buffer: Array.from(new Uint8Array(buffer)), filename }
}

// ────────────────────────────────────────────
// 사업 실적보고 양식 엑셀 출력 (7개 시트 집계)
// ────────────────────────────────────────────

export async function generateBusinessReport(params: {
  year: number
}): Promise<{ success: boolean; buffer?: number[]; filename?: string; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const startDate = `${params.year}-01-01`
  const endDate = `${params.year}-12-31`

  const [srResult, callResult] = await Promise.all([
    supabase.from('eval_service_records').select('*').gte('received_at', startDate).lte('received_at', endDate),
    supabase.from('call_logs').select('*').gte('log_date', startDate).lte('log_date', endDate),
  ])

  if (srResult.error) return { success: false, error: srResult.error.message }
  if (callResult.error) return { success: false, error: callResult.error.message }

  type ServiceRecord = {
    is_consult: boolean; is_assessment: boolean; is_trial: boolean
    is_rental: boolean; is_custom_make: boolean; is_grant: boolean
    is_education: boolean; is_info_provision: boolean; is_repair: boolean
    is_cleaning: boolean; is_reuse: boolean; is_monitoring: boolean
    name: string | null; product_name: string | null
    service_content: string | null; received_at: string | null
    application_month: number | null; record_status: string | null
    service_major_category: string | null; economic_status: string | null
    disability_severity: string | null
    [key: string]: unknown
  }
  const records = (srResult.data ?? []) as ServiceRecord[]
  const calls = callResult.data ?? []

  // Monthly breakdown (1–12)
  const byMonth: Record<number, number> = {}
  for (let m = 1; m <= 12; m++) byMonth[m] = 0
  for (const r of records) {
    if (r.application_month) byMonth[r.application_month] = (byMonth[r.application_month] ?? 0) + 1
  }

  const stats = {
    callTotal:     calls.length,
    consult:       records.filter(r => r.is_consult).length,
    assessment:    records.filter(r => r.is_assessment).length,
    trial:         records.filter(r => r.is_trial).length,
    rental:        records.filter(r => r.is_rental).length,
    customMake:    records.filter(r => r.is_custom_make).length,
    grant:         records.filter(r => r.is_grant).length,
    education:     records.filter(r => r.is_education).length,
    infoProvision: records.filter(r => r.is_info_provision).length,
    repair:        records.filter(r => r.is_repair).length,
    cleaning:      records.filter(r => r.is_cleaning).length,
    reuse:         records.filter(r => r.is_reuse).length,
    monitoring:    records.filter(r => r.is_monitoring).length,
    // major category breakdown
    catPublic:     records.filter(r => r.service_major_category === '공적급여').length,
    catPrivate:    records.filter(r => r.service_major_category === '민간지원').length,
    catOther:      records.filter(r => r.service_major_category === '기타').length,
    catService:    records.filter(r => r.service_major_category === '서비스지원').length,
    // economic status breakdown
    ecoRecipient:  records.filter(r => r.economic_status === '수급자').length,
    ecoNearPoor:   records.filter(r => r.economic_status === '차상위').length,
    ecoGeneral:    records.filter(r => r.economic_status === '일반').length,
    // disability severity
    sevSevere:     records.filter(r => r.disability_severity === '중증').length,
    sevMild:       records.filter(r => r.disability_severity === '경증').length,
    byMonth,
  }

  const templatePath = getTemplatePath('business_report_template.xlsx')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(templatePath)

  // Sheet 1: 전체 사업 실적 — update actual column E with stats values
  const sheet1 = workbook.getWorksheet(1)
  if (!sheet1) return { success: false, error: '사업 실적 템플릿에서 시트 1을 찾을 수 없습니다' }
  sheet1.getCell('E5').value = stats.callTotal
  sheet1.getCell('E8').value = stats.rental
  sheet1.getCell('E9').value = stats.customMake
  sheet1.getCell('E10').value = stats.grant
  sheet1.getCell('E11').value = stats.cleaning
  sheet1.getCell('E12').value = stats.repair
  sheet1.getCell('E13').value = stats.reuse
  // major category counts
  sheet1.getCell('E16').value = stats.catPublic
  sheet1.getCell('E17').value = stats.catPrivate
  sheet1.getCell('E18').value = stats.catOther
  sheet1.getCell('E19').value = stats.catService
  // economic status counts
  sheet1.getCell('E22').value = stats.ecoRecipient
  sheet1.getCell('E23').value = stats.ecoNearPoor
  sheet1.getCell('E24').value = stats.ecoGeneral
  // disability severity counts
  sheet1.getCell('E27').value = stats.sevSevere
  sheet1.getCell('E28').value = stats.sevMild
  // monthly breakdown (rows 31–42 assumed, one per month)
  for (let m = 1; m <= 12; m++) {
    sheet1.getCell(`E${30 + m}`).value = stats.byMonth[m] ?? 0
  }

  // Sheet 6: 대여 현황
  const rentalRecords = records.filter(r => r.is_rental)
  const sheet6 = workbook.getWorksheet(6)
  if (sheet6 && rentalRecords.length > 0) {
    let rowNum = 3
    for (const rec of rentalRecords) {
      const r = sheet6.getRow(rowNum)
      r.getCell(2).value = rec.name
      r.getCell(3).value = rec.product_name
      r.getCell(6).value = rec.received_at
      r.commit()
      rowNum++
    }
  }

  // Sheet 7: 제작 서비스 현황
  const makeRecords = records.filter(r => r.is_custom_make)
  const sheet7 = workbook.getWorksheet(7)
  if (sheet7 && makeRecords.length > 0) {
    let rowNum = 3
    for (const rec of makeRecords) {
      const r = sheet7.getRow(rowNum)
      r.getCell(2).value = rec.name
      r.getCell(3).value = rec.product_name
      r.getCell(4).value = rec.service_content
      r.getCell(7).value = rec.received_at
      r.commit()
      rowNum++
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const filename = `사업_실적보고_${params.year}년.xlsx`
  return { success: true, buffer: Array.from(new Uint8Array(buffer)), filename }
}
