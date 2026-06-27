"use server"

import path from 'path'
import ExcelJS from 'exceljs'
import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"

function getTemplatePath(filename: string): string {
  return path.join(process.cwd(), 'public', 'templates', filename)
}

// Maps operational record_status → central-report status
// 접수/진행중 → 미결, 보류 → 잠정종결, 완료 → 종결
function toReportStatus(status: string | null): string {
  if (status === '접수' || status === '진행중') return '미결'
  if (status === '보류') return '잠정종결'
  if (status === '완료') return '종결'
  return status ?? ''
}

async function loadTemplateWorkbook(filePath: string): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  return workbook
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
  const workbook = await loadTemplateWorkbook(templatePath)

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
  const workbook = await loadTemplateWorkbook(templatePath)

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
    r.getCell(7).value = toReportStatus(record.record_status as string | null)
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

  const [srResult, callResult, exhibitionResult, educationResult, promoActivitiesResult, promoMonthlyResult] = await Promise.all([
    supabase.from('eval_service_records').select('*').gte('received_at', startDate).lte('received_at', endDate).order('received_at'),
    supabase.from('call_logs').select('*').gte('log_date', startDate).lte('log_date', endDate),
    (supabase as any)
      .from('schedules')
      .select('scheduled_date, participant_count, reception_method, visitor_org_name, visitor_org_type, notes')
      .eq('schedule_type', 'exhibition')
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .order('scheduled_date'),
    (supabase as any)
      .from('schedules')
      .select('scheduled_date, education_title, education_hours, education_type, participant_count, education_audience_type, education_audience_label, notes')
      .eq('schedule_type', 'education')
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .order('scheduled_date'),
    (supabase as any)
      .from('stats_promotion_activities')
      .select('*')
      .eq('year', params.year)
      .order('sort_order')
      .order('activity_date'),
    (supabase as any)
      .from('stats_promotion_monthly')
      .select('*')
      .eq('year', params.year)
      .order('month'),
  ])

  if (srResult.error) return { success: false, error: srResult.error.message }
  if (callResult.error) return { success: false, error: callResult.error.message }

  type PromoActivity = {
    content: string; total_count: number | null; activity_date: string | null
    promo_material_type: string | null; promo_material_count: number | null
    media_type: string | null; media_count: number | null
    event_type: string | null; event_count: number | null; event_attendees: number | null
    other_type: string | null; other_count: number | null; other_times: number | null
    notes: string | null
  }
  type PromoMonthly = {
    month: number
    homepage_posts: number | null; facebook_posts: number | null
    kakao_posts: number | null; instagram_posts: number | null; blog_posts: number | null
    hp_notice: number | null; hp_gallery: number | null; hp_gov_support: number | null
    hp_online_inquiry: number | null; hp_visitor_total: number | null
    hp_daily_avg: number | null; hp_monthly_avg: number | null; hp_visitor_ratio: number | null
    ig_story: number | null; ig_post: number | null; ig_online_inquiry: number | null
    ig_follower_ratio: number | null; ig_non_follower_ratio: number | null
    ig_total_views: number | null; ig_top_post: string | null
  }
  const promoActivities = (promoActivitiesResult.data ?? []) as PromoActivity[]
  const promoMonthlyList = (promoMonthlyResult.data ?? []) as PromoMonthly[]
  const promoMonthlyMap: Record<number, PromoMonthly> = {}
  for (const m of promoMonthlyList) promoMonthlyMap[m.month] = m

  type ServiceRecord = {
    is_consult: boolean; is_assessment: boolean; is_trial: boolean
    is_rental: boolean; is_custom_make: boolean; is_grant: boolean
    is_education: boolean; is_info_provision: boolean; is_repair: boolean
    is_cleaning: boolean; is_reuse: boolean; is_monitoring: boolean
    name: string | null; product_name: string | null
    service_content: string | null; received_at: string | null
    performance_date: string | null; service_area: string | null
    manufacturing_method: string | null
    application_month: number | null; record_status: string | null
    service_major_category: string | null; economic_status: string | null
    disability_severity: string | null
    [key: string]: unknown
  }

  function dateMonth(d: string | null): number | null {
    if (!d) return null
    const m = parseInt(d.split('-')[1] ?? '')
    return isNaN(m) ? null : m
  }
  function dateDay(d: string | null): number | null {
    if (!d) return null
    const day = parseInt(d.split('-')[2] ?? '')
    return isNaN(day) ? null : day
  }
  const records = (srResult.data ?? []) as unknown as ServiceRecord[]
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
    // central-report status counts
    statusPending:           records.filter(r => r.record_status === '접수' || r.record_status === '진행중').length,
    statusProvisionalClosed: records.filter(r => r.record_status === '보류').length,
    statusClosed:            records.filter(r => r.record_status === '완료').length,
    byMonth,
  }

  const templatePath = getTemplatePath('business_report_template.xlsx')
  const workbook = await loadTemplateWorkbook(templatePath)

  // Sheet 1: 전체 사업 실적 — update actual column E with stats values
  // Cell positions match business_report_template.xlsx layout.
  // Verify against template if rows are added/removed by the central org.
  const sheet1 = workbook.getWorksheet(1)
  if (!sheet1) return { success: false, error: '사업 실적 템플릿에서 시트 1을 찾을 수 없습니다' }
  sheet1.getCell('E5').value = stats.callTotal
  sheet1.getCell('E6').value = stats.consult        // 상담·정보제공
  sheet1.getCell('E7').value = stats.trial          // 체험
  sheet1.getCell('E8').value = stats.rental
  sheet1.getCell('E9').value = stats.customMake
  sheet1.getCell('E10').value = stats.grant
  sheet1.getCell('E11').value = stats.cleaning
  sheet1.getCell('E12').value = stats.repair
  sheet1.getCell('E13').value = stats.reuse
  sheet1.getCell('E14').value = stats.education     // 교육
  sheet1.getCell('E15').value = stats.infoProvision // 정보제공(별도)
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
  // monthly breakdown (rows 31–42, one per month)
  for (let m = 1; m <= 12; m++) {
    sheet1.getCell(`E${30 + m}`).value = stats.byMonth[m] ?? 0
  }

  // Sheet 2: 체험프로그램(구, 견학) — exhibition schedules
  type ExhibitionRecord = {
    scheduled_date: string
    participant_count: number | null
    reception_method: string | null
    visitor_org_name: string | null
    visitor_org_type: string | null
    notes: string | null
  }
  const exhibitionRecords = (exhibitionResult.data ?? []) as ExhibitionRecord[]
  const sheet2 = workbook.getWorksheet('2.체험프로그램(구, 견학)')
  if (sheet2) {
    for (let r = 5; r <= 14; r++) {
      const row = sheet2.getRow(r)
      for (let c = 1; c <= 12; c++) row.getCell(c).value = null
      row.commit()
    }
    const ORG_COL: Record<string, number> = {
      government: 6, education: 7, welfare: 8, medical: 9, individual: 10, other: 11,
    }
    let rowNum = 5
    for (const rec of exhibitionRecords) {
      const r = sheet2.getRow(rowNum)
      r.getCell(1).value = rowNum - 4
      r.getCell(2).value = rec.scheduled_date
      r.getCell(3).value = 1
      r.getCell(4).value = rec.participant_count
      r.getCell(5).value = rec.reception_method
      if (rec.visitor_org_type && rec.visitor_org_name) {
        const col = ORG_COL[rec.visitor_org_type]
        if (col) r.getCell(col).value = rec.visitor_org_name
      }
      r.getCell(12).value = rec.notes
      r.commit()
      rowNum++
    }
  }

  // Sheet 3: 교육 — education schedules
  type EducationRecord = {
    scheduled_date: string
    education_title: string | null
    education_hours: number | null
    education_type: string | null
    participant_count: number | null
    education_audience_type: string | null
    education_audience_label: string | null
    notes: string | null
  }
  const educationRecords = (educationResult.data ?? []) as EducationRecord[]
  const sheet3 = workbook.getWorksheet('3.교육')
  if (sheet3) {
    for (let r = 5; r <= 14; r++) {
      const row = sheet3.getRow(r)
      for (let c = 1; c <= 13; c++) row.getCell(c).value = null
      row.commit()
    }
    const AUDIENCE_COL: Record<string, number> = {
      at_welfare: 8, edu_student: 9, guardian: 10, government: 11, other: 12,
    }
    let rowNum = 5
    for (const rec of educationRecords) {
      const r = sheet3.getRow(rowNum)
      r.getCell(1).value = rowNum - 4
      r.getCell(2).value = rec.education_title
      r.getCell(3).value = 1
      r.getCell(4).value = rec.education_hours
      r.getCell(5).value = rec.participant_count
      r.getCell(6).value = rec.scheduled_date
      r.getCell(7).value = rec.education_type
      if (rec.education_audience_type && rec.education_audience_label) {
        const col = AUDIENCE_COL[rec.education_audience_type]
        if (col) r.getCell(col).value = rec.education_audience_label
      }
      r.getCell(13).value = rec.notes
      r.commit()
      rowNum++
    }
  }

  // Sheet 6: 대여 현황 관리
  // Columns: 1=연번, 2=신청인, 3=신청품목, 4=신청(월), 5=신청(일), 6=지급(월), 7=지급(일), 8=취소사유
  const rentalRecords = records.filter(r => r.is_rental)
  const rentalSheet = workbook.getWorksheet('6.대여 현황 관리(대기자 등)')
  if (rentalSheet) {
    for (let ri = 4; ri <= 103; ri++) {
      const row = rentalSheet.getRow(ri)
      for (let c = 1; c <= 8; c++) row.getCell(c).value = null
      row.commit()
    }
    let rowNum = 4
    for (const rec of rentalRecords) {
      const r = rentalSheet.getRow(rowNum)
      r.getCell(1).value = rowNum - 3
      r.getCell(2).value = rec.name
      r.getCell(3).value = rec.product_name
      r.getCell(4).value = dateMonth(rec.received_at)
      r.getCell(5).value = dateDay(rec.received_at)
      r.getCell(6).value = dateMonth(rec.performance_date)
      r.getCell(7).value = dateDay(rec.performance_date)
      r.commit()
      rowNum++
    }
  }

  // Sheet 7: 맞춤 제작 서비스 현황 관리
  // Columns: 1=연번, 2=신청인, 3=신청품목, 4=상세내용, 5=제작방법, 6=신청(월), 7=신청(일), 8=지급(월), 9=지급(일), 10=불가사유, 11=영역, 12=비고
  const makeRecords = records.filter(r => r.is_custom_make)
  const makeSheet = workbook.getWorksheet('7.제작 서비스 현황 관리')
  if (makeSheet) {
    for (let ri = 4; ri <= 103; ri++) {
      const row = makeSheet.getRow(ri)
      for (let c = 1; c <= 12; c++) row.getCell(c).value = null
      row.commit()
    }
    let rowNum = 4
    for (const rec of makeRecords) {
      const r = makeSheet.getRow(rowNum)
      r.getCell(1).value = rowNum - 3
      r.getCell(2).value = rec.name
      r.getCell(3).value = rec.product_name
      r.getCell(4).value = rec.service_content
      r.getCell(5).value = rec.manufacturing_method
      r.getCell(6).value = dateMonth(rec.received_at)
      r.getCell(7).value = dateDay(rec.received_at)
      r.getCell(8).value = dateMonth(rec.performance_date)
      r.getCell(9).value = dateDay(rec.performance_date)
      r.getCell(11).value = rec.service_area
      r.commit()
      rowNum++
    }
  }

  // Sheet 5: 예산집행 실적 — TODO: populate from finance app (Phase 7)
  // Will query finance budget execution tables once finance app is built.

  // Sheet 4: 홍보 — individual promotion activity records (rows 5–26)
  const sheet4 = workbook.getWorksheet('4.홍보')
  if (sheet4 && promoActivities.length > 0) {
    for (let r = 5; r <= 26; r++) {
      const row = sheet4.getRow(r)
      for (let c = 1; c <= 14; c++) row.getCell(c).value = null
      row.commit()
    }
    let rowNum = 5
    for (const act of promoActivities) {
      if (rowNum > 26) break
      const r = sheet4.getRow(rowNum)
      r.getCell(1).value = rowNum - 4
      r.getCell(2).value = act.content
      r.getCell(3).value = act.total_count
      if (act.promo_material_type) { r.getCell(4).value = act.promo_material_type; r.getCell(5).value = act.promo_material_count }
      if (act.media_type) { r.getCell(6).value = act.media_type; r.getCell(7).value = act.media_count }
      if (act.event_type) { r.getCell(8).value = act.event_type; r.getCell(9).value = act.event_count; r.getCell(10).value = act.event_attendees }
      if (act.other_type) { r.getCell(11).value = act.other_type; r.getCell(12).value = act.other_count; r.getCell(13).value = act.other_times }
      r.getCell(14).value = act.notes
      r.commit()
      rowNum++
    }
  }

  // Sheet 5: 4-1.매체 운영 기록지
  const sheet41 = workbook.getWorksheet('4-1.매체 운영 기록지')
  if (sheet41) {
    for (let m = 1; m <= 12; m++) {
      const data = promoMonthlyMap[m]
      if (!data) continue
      // Section 1: SNS post counts (rows 3–14, col 2–6)
      const snsRow = sheet41.getRow(m + 2)
      snsRow.getCell(2).value = data.homepage_posts
      snsRow.getCell(3).value = data.facebook_posts
      snsRow.getCell(4).value = data.kakao_posts
      snsRow.getCell(5).value = data.instagram_posts
      snsRow.getCell(6).value = data.blog_posts
      snsRow.commit()
      // Section 2: Homepage analytics (rows 18–29, col 1–9)
      const hpRow = sheet41.getRow(m + 17)
      hpRow.getCell(2).value = data.hp_notice
      hpRow.getCell(3).value = data.hp_gallery
      hpRow.getCell(4).value = data.hp_gov_support
      hpRow.getCell(5).value = data.hp_online_inquiry
      hpRow.getCell(6).value = data.hp_visitor_total
      hpRow.getCell(7).value = data.hp_daily_avg
      hpRow.getCell(8).value = data.hp_monthly_avg
      hpRow.getCell(9).value = data.hp_visitor_ratio
      hpRow.commit()
      // Section 3: Instagram analytics (rows 33–44, col 1–8)
      const igRow = sheet41.getRow(m + 32)
      igRow.getCell(2).value = data.ig_story
      igRow.getCell(3).value = data.ig_post
      igRow.getCell(4).value = data.ig_online_inquiry
      igRow.getCell(5).value = data.ig_follower_ratio
      igRow.getCell(6).value = data.ig_non_follower_ratio
      igRow.getCell(7).value = data.ig_total_views
      igRow.getCell(8).value = data.ig_top_post
      igRow.commit()
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const filename = `사업_실적보고_${params.year}년.xlsx`
  return { success: true, buffer: Array.from(new Uint8Array(buffer)), filename }
}
