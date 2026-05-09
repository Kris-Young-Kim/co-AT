"use server"

import { revalidatePath } from 'next/cache'
import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { getSheetValues, getSheetNames } from "@/apps/eval/lib/google-sheets"

// ────────────────────────────────────────────
// 콜센터 상담 일지 동기화
// ────────────────────────────────────────────

const CALL_COL = {
  date: 2,
  requesterName: 3,
  requesterRegion: 4,
  requesterContact: 5,
  requesterType: 6,
  targetName: 7,
  targetGender: 8,
  disabilityType: 9,
  disabilitySeverity: 10,
  economicStatus: 11,
  qPublic: 12,
  qPrivate: 13,
  qDevice: 14,
  qCase: 15,
  qOther: 16,
  questionContent: 17,
  answer: 18,
  staffName: 19,
} as const

function toStr(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null
  return String(v).trim() || null
}

function toBool(v: unknown): boolean {
  if (!v) return false
  const s = String(v).trim()
  return s !== '' && s !== 'FALSE' && s !== 'false' && s !== '0'
}

function parseDate(v: unknown): string | null {
  if (!v) return null
  const s = String(v).trim()
  const match = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : null
}

export async function syncCallLogs(): Promise<{
  success: boolean
  rowsAdded: number
  rowsSkipped: number
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, rowsAdded: 0, rowsSkipped: 0, error: '권한이 없습니다' }

  const sheetId = process.env.GOOGLE_CALL_LOG_SHEET_ID
  if (!sheetId) return { success: false, rowsAdded: 0, rowsSkipped: 0, error: 'GOOGLE_CALL_LOG_SHEET_ID 환경변수가 없습니다' }

  try {
    const supabase = createAdminClient()
    const sheetNames = await getSheetNames(sheetId)
    const yearSheets = sheetNames.filter((n: string) => /^\d{4}$/.test(n))

    let totalAdded = 0
    let totalSkipped = 0

    for (const sheet of yearSheets) {
      const rows = await getSheetValues(sheetId, `${sheet}!A:X`)
      const dataRows = rows.slice(8)

      for (const row of dataRows) {
        if (!row[1]) continue

        const logDate = parseDate(row[CALL_COL.date])
        if (!logDate) continue

        const staffName = toStr(row[CALL_COL.staffName])
        const questionContent = toStr(row[CALL_COL.questionContent])

        const { data: existing } = await supabase
          .from('call_logs')
          .select('id')
          .eq('log_date', logDate)
          .eq('staff_name', staffName ?? '')
          .eq('question_content', questionContent ?? '')
          .maybeSingle()

        if (existing) {
          totalSkipped++
          continue
        }

        const { error: insertError } = await supabase.from('call_logs').insert({
          log_date: logDate,
          requester_name: toStr(row[CALL_COL.requesterName]),
          requester_region: toStr(row[CALL_COL.requesterRegion]),
          requester_contact: toStr(row[CALL_COL.requesterContact]),
          requester_type: toStr(row[CALL_COL.requesterType]),
          target_name: toStr(row[CALL_COL.targetName]),
          target_gender: toStr(row[CALL_COL.targetGender]),
          target_disability_type: toStr(row[CALL_COL.disabilityType]),
          target_disability_severity: toStr(row[CALL_COL.disabilitySeverity]),
          target_economic_status: toStr(row[CALL_COL.economicStatus]),
          q_public_benefit: toBool(row[CALL_COL.qPublic]),
          q_private_benefit: toBool(row[CALL_COL.qPrivate]),
          q_device: toBool(row[CALL_COL.qDevice]),
          q_case_management: toBool(row[CALL_COL.qCase]),
          q_other: toBool(row[CALL_COL.qOther]),
          question_content: questionContent,
          answer: toStr(row[CALL_COL.answer]),
          staff_name: staffName,
        })
        if (!insertError) {
          totalAdded++
        }
      }
    }

    await supabase.from('eval_sync_logs').insert({
      sheet_type: 'call_log',
      status: 'success',
      rows_added: totalAdded,
      rows_skipped: totalSkipped,
    })
    revalidatePath('/migration')

    return { success: true, rowsAdded: totalAdded, rowsSkipped: totalSkipped }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const supabase = createAdminClient()
    await supabase.from('eval_sync_logs').insert({
      sheet_type: 'call_log',
      status: 'error',
      rows_added: 0,
      rows_skipped: 0,
      error_msg: msg,
    })
    return { success: false, rowsAdded: 0, rowsSkipped: 0, error: msg }
  }
}

// ────────────────────────────────────────────
// 서비스 실적 동기화
// ────────────────────────────────────────────

const SR_COL = {
  date: 0,
  seq: 1,
  appYear: 5,
  appNo: 6,
  isReApplication: 4,
  name: 7,
  birthDate: 8,
  gender: 10,
  region: 11,
  disabilityType: 12,
  serviceCategory: 13,
  productName: 14,
  itemCategory: 15,
  serviceContent: 16,
  serviceArea: 17,
  isConsult: 18,
  isAssessment: 19,
  isTrial: 20,
  isRental: 21,
  isCustomMake: 22,
  isGrant: 23,
  isEducation: 24,
  isOtherBusiness: 25,
  isInfoProvision: 26,
  isPublicFunding: 27,
  isPrivateFunding: 28,
  isSelfPay: 29,
  isFundingSecured: 30,
  isRepair: 31,
  isCleaning: 32,
  isReuse: 33,
  isMonitoring: 34,
  referralType: 35,
  isPhone: 36,
  isVisitIn: 37,
  isVisitOut: 38,
  isClosed: 39,
  staffName: 40,
  // ── 추가 컬럼 (migration 050) ──────────────────────────────
  // NOTE: 아래 인덱스는 실제 Google Sheet '보조기기 서비스 상세' 열 구조에 맞게
  //       조정 필요. 현재는 시트에 없는 경우 null을 반환하도록 안전하게 처리.
  consultationDate:    41, // 상담일
  serviceMajorCat:     42, // 서비스대분류 (공적급여/민간지원/기타/서비스지원)
  serviceSubCat:       43, // 서비스중분류
  economicStatus:      44, // 경제상황 (수급자/차상위/일반)
  disabilitySeverity:  45, // 장애정도 (중증/경증)
  performanceDate:     46, // 실적기준일
  closedAt:            47, // 종결일
  monitoringDate:      48, // 모니터링 날짜
  trialDeviceCount:    49, // 체험지원 적용대수
  infoProvisionArea:   50, // 정보제공 영역
  fundingSourceDetail: 51, // 재원연계 상세
} as const

function parseServiceDate(v: unknown): string | null {
  if (!v) return null
  const s = String(v).trim().replace('.0', '')
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
  }
  const match = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : null
}

function parseBirthDate(v: unknown): string | null {
  if (!v) return null
  const s = String(v).trim()
  const match = s.match(/^(\d{2})(\d{2})(\d{2})/)
  if (match) {
    const yy = parseInt(match[1])
    const currentYY = new Date().getFullYear() % 100
    const century = yy <= currentYY ? '20' : '19'
    return `${century}${match[1]}-${match[2]}-${match[3]}`
  }
  return null
}

export async function syncServiceRecords(): Promise<{
  success: boolean
  rowsAdded: number
  rowsSkipped: number
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, rowsAdded: 0, rowsSkipped: 0, error: '권한이 없습니다' }

  const sheetId = process.env.GOOGLE_SERVICE_RECORD_SHEET_ID
  if (!sheetId) return { success: false, rowsAdded: 0, rowsSkipped: 0, error: 'GOOGLE_SERVICE_RECORD_SHEET_ID 환경변수가 없습니다' }

  try {
    const supabase = createAdminClient()
    const rows = await getSheetValues(sheetId, '보조기기 서비스 상세!A:AQ')
    const dataRows = rows.slice(9)

    let totalAdded = 0
    let totalSkipped = 0

    for (const row of dataRows) {
      if (!row[SR_COL.seq]) continue

      const receivedAt = parseServiceDate(row[SR_COL.date])
      const name = toStr(row[SR_COL.name])
      const birthDate = parseBirthDate(row[SR_COL.birthDate])

      if (!name) continue

      const { data: existing } = await supabase
        .from('eval_service_records')
        .select('id')
        .eq('received_at', receivedAt ?? '')
        .eq('name', name)
        .eq('birth_date', birthDate ?? '')
        .maybeSingle()

      if (existing) {
        totalSkipped++
        continue
      }

      const { error: insertError } = await supabase.from('eval_service_records').insert({
        received_at: receivedAt,
        application_year: row[SR_COL.appYear] ? parseInt(String(row[SR_COL.appYear])) : null,
        application_no: row[SR_COL.appNo] ? parseInt(String(row[SR_COL.appNo])) : null,
        is_re_application: toBool(row[SR_COL.isReApplication]),
        name,
        birth_date: birthDate,
        gender: toStr(row[SR_COL.gender]),
        region: toStr(row[SR_COL.region]),
        disability_type: toStr(row[SR_COL.disabilityType]),
        service_category: toStr(row[SR_COL.serviceCategory]),
        product_name: toStr(row[SR_COL.productName]),
        item_category: toStr(row[SR_COL.itemCategory]),
        service_content: toStr(row[SR_COL.serviceContent]),
        service_area: toStr(row[SR_COL.serviceArea]),
        is_consult: toBool(row[SR_COL.isConsult]),
        is_assessment: toBool(row[SR_COL.isAssessment]),
        is_trial: toBool(row[SR_COL.isTrial]),
        is_rental: toBool(row[SR_COL.isRental]),
        is_custom_make: toBool(row[SR_COL.isCustomMake]),
        is_grant: toBool(row[SR_COL.isGrant]),
        is_education: toBool(row[SR_COL.isEducation]),
        is_other_business: toBool(row[SR_COL.isOtherBusiness]),
        is_info_provision: toBool(row[SR_COL.isInfoProvision]),
        is_public_funding: toBool(row[SR_COL.isPublicFunding]),
        is_private_funding: toBool(row[SR_COL.isPrivateFunding]),
        is_self_pay: toBool(row[SR_COL.isSelfPay]),
        is_funding_secured: toBool(row[SR_COL.isFundingSecured]),
        is_repair: toBool(row[SR_COL.isRepair]),
        is_cleaning: toBool(row[SR_COL.isCleaning]),
        is_reuse: toBool(row[SR_COL.isReuse]),
        is_monitoring: toBool(row[SR_COL.isMonitoring]),
        referral_type: toStr(row[SR_COL.referralType]),
        is_phone: toBool(row[SR_COL.isPhone]),
        is_visit_in: toBool(row[SR_COL.isVisitIn]),
        is_visit_out: toBool(row[SR_COL.isVisitOut]),
        is_closed: toBool(row[SR_COL.isClosed]),
        staff_name: toStr(row[SR_COL.staffName]),
        source: 'sheets',
        // ── columns added in migration 050 ─────────────────────────
        application_month: receivedAt ? parseInt(receivedAt.split('-')[1]) : null,
        record_status: toBool(row[SR_COL.isClosed]) ? '완료' : '미정',
        consultation_date: parseServiceDate(row[SR_COL.consultationDate]),
        service_major_category: toStr(row[SR_COL.serviceMajorCat]),
        service_sub_category: toStr(row[SR_COL.serviceSubCat]),
        economic_status: toStr(row[SR_COL.economicStatus]),
        disability_severity: toStr(row[SR_COL.disabilitySeverity]),
        performance_date: parseServiceDate(row[SR_COL.performanceDate]),
        closed_at: parseServiceDate(row[SR_COL.closedAt]),
        monitoring_date: parseServiceDate(row[SR_COL.monitoringDate]),
        trial_device_count: row[SR_COL.trialDeviceCount] ? parseInt(String(row[SR_COL.trialDeviceCount])) : null,
        info_provision_area: toStr(row[SR_COL.infoProvisionArea]),
        funding_source_detail: toStr(row[SR_COL.fundingSourceDetail]),
      })
      if (!insertError) {
        totalAdded++
      }
    }

    await supabase.from('eval_sync_logs').insert({
      sheet_type: 'service_record',
      status: 'success',
      rows_added: totalAdded,
      rows_skipped: totalSkipped,
    })
    revalidatePath('/migration')

    return { success: true, rowsAdded: totalAdded, rowsSkipped: totalSkipped }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const supabase = createAdminClient()
    await supabase.from('eval_sync_logs').insert({
      sheet_type: 'service_record',
      status: 'error',
      rows_added: 0,
      rows_skipped: 0,
      error_msg: msg,
    })
    return { success: false, rowsAdded: 0, rowsSkipped: 0, error: msg }
  }
}

// ────────────────────────────────────────────
// 동기화 이력 조회
// ────────────────────────────────────────────

export interface SyncLog {
  id: string
  sheet_type: string
  status: string
  rows_added: number
  rows_skipped: number
  error_msg: string | null
  synced_at: string
}

export async function getSyncLogs(limit = 20): Promise<{
  success: boolean
  logs?: SyncLog[]
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('eval_sync_logs')
    .select('*')
    .order('synced_at', { ascending: false })
    .limit(limit)

  if (error) return { success: false, error: error.message }
  return { success: true, logs: data as SyncLog[] }
}

export async function getSyncStats(): Promise<{
  success: boolean
  callLogCount?: number
  serviceRecordCount?: number
  lastCallLogSync?: string | null
  lastServiceRecordSync?: string | null
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()

  const [callResult, srResult, logsResult] = await Promise.all([
    supabase.from('call_logs').select('*', { count: 'exact', head: true }),
    supabase.from('eval_service_records').select('*', { count: 'exact', head: true }),
    supabase.from('eval_sync_logs')
      .select('sheet_type, synced_at, status')
      .eq('status', 'success')
      .order('synced_at', { ascending: false })
      .limit(10),
  ])

  if (callResult.error || srResult.error) {
    return { success: false, error: callResult.error?.message ?? srResult.error?.message }
  }

  const lastCallLog = logsResult.data?.find((l: { sheet_type: string; synced_at: string | null }) => l.sheet_type === 'call_log')?.synced_at ?? null
  const lastSR = logsResult.data?.find((l: { sheet_type: string; synced_at: string | null }) => l.sheet_type === 'service_record')?.synced_at ?? null

  return {
    success: true,
    callLogCount: callResult.count ?? 0,
    serviceRecordCount: srResult.count ?? 0,
    lastCallLogSync: lastCallLog,
    lastServiceRecordSync: lastSR,
  }
}
