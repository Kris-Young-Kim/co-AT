"use server"

import { revalidatePath } from 'next/cache'
import { createAdminClient } from "@/lib/supabase/admin"
import { withStaffPermission } from "@/lib/utils/with-permission"
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
  rowsAdded?: number
  rowsSkipped?: number
  error?: string
}> {
  return withStaffPermission(async () => {

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
  })
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
  contact:   41, // 연락처 — AP열
  address:   42, // 주소   — AQ열 (시트 마지막 컬럼)
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
  rowsAdded?: number
  rowsSkipped?: number
  error?: string
}> {
  return withStaffPermission(async () => {

    const sheetIds = (process.env.GOOGLE_SERVICE_RECORD_SHEET_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)
    if (sheetIds.length === 0) return { success: false, rowsAdded: 0, rowsSkipped: 0, error: 'GOOGLE_SERVICE_RECORD_SHEET_IDS 환경변수가 없습니다' }

    try {
      const supabase = createAdminClient()
      let totalAdded = 0
      let totalSkipped = 0

      for (const sheetId of sheetIds) {
        const rows = await getSheetValues(sheetId, '보조기기 서비스 상세!A:AQ')
        const dataRows = rows.slice(9)

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
            contact: toStr(row[SR_COL.contact]),
            address: toStr(row[SR_COL.address]),
            source: 'sheets',
            application_month: receivedAt ? parseInt(receivedAt.split('-')[1]) : null,
            record_status: toBool(row[SR_COL.isClosed]) ? '완료' : '미정',
          })
          if (!insertError) {
            totalAdded++
          }
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
  })
}

// ────────────────────────────────────────────
// 대상자 정보 동기화
// ────────────────────────────────────────────

const CLIENT_BASIC_COL = {
  seq:             0,
  registrationNo:  1,
  name:            2,
  birthDate:       3,
  gender:          4,
  regionSi:        5,
  addressDetail:   6,
  contact:         7,
  guardianContact: 8,
  economicStatus:  12,
  housingType:     13,
  hasElevator:     16,
  obstacles:       17,
} as const

const CLIENT_DISABILITY_COL = {
  registrationNo:    1,
  disabilityType:    3,
  disabilityGrade:   4,
  disabilityCause:   5,
  disabilityOnset:   6,
} as const

const DISABILITY_TYPE_NORM: Record<string, string> = {
  '지체': '지체', '뇌병변': '뇌병변', '시각': '시각', '청각': '청각',
  '언어': '언어', '지적': '지적', '자폐': '자폐성', '자폐성': '자폐성',
  '정신': '정신', '신장': '신장', '심장': '심장', '호흡기': '호흡기',
  '간': '간', '안면': '안면',
  '장루': '장루·요루', '요루': '장루·요루',
  '장루·요루': '장루·요루', '장루/요루': '장루·요루',
  '뇌전증': '뇌전증', '간질': '뇌전증',
}

function normalizeDisabilityType(v: unknown): string | null {
  if (!v) return null
  const s = String(v).trim()
  return DISABILITY_TYPE_NORM[s] ?? (s || null)
}

function normalizeGender(v: unknown): string | null {
  if (!v) return null
  const s = String(v).trim()
  if (s === '남') return '남'
  if (s === '여') return '여'
  return null
}

function toBoolKorean(v: unknown): boolean | null {
  if (!v) return null
  const s = String(v).trim()
  if (s === '있음' || s === 'Y' || s === '예') return true
  if (s === '없음' || s === 'N' || s === '아니오') return false
  return null
}

function parseClientBirthDate(v: unknown): string | null {
  if (!v) return null
  const s = String(v).trim().replace(/\./g, '-')
  const m6 = s.match(/^(\d{2})(\d{2})(\d{2})$/)
  if (m6) {
    const yy = parseInt(m6[1])
    const cent = yy <= (new Date().getFullYear() % 100) ? '20' : '19'
    return `${cent}${m6[1]}-${m6[2]}-${m6[3]}`
  }
  const m8 = s.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (m8) return `${m8[1]}-${m8[2]}-${m8[3]}`
  const mISO = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return mISO ? mISO[1] : null
}

export async function syncClients(): Promise<{
  success: boolean
  rowsAdded?: number
  rowsSkipped?: number
  error?: string
}> {
  return withStaffPermission(async () => {

    const sheetId = process.env.GOOGLE_CLIENT_SHEET_ID
    if (!sheetId) return { success: false, rowsAdded: 0, rowsSkipped: 0, error: 'GOOGLE_CLIENT_SHEET_ID 환경변수가 없습니다' }

    try {
      const supabase = createAdminClient()

      const [basicRows, disabilityRows] = await Promise.all([
        getSheetValues(sheetId, '대상자기초정보!A:R'),
        getSheetValues(sheetId, '대상자장애정보!A:G'),
      ])

      // Build disability lookup keyed by registration_number
      const disabilityMap = new Map<string, {
        disability_type: string | null
        disability_grade: string | null
        disability_cause: string | null
        disability_onset_date: string | null
      }>()
      for (const row of disabilityRows.slice(1)) {
        const regNo = toStr(row[CLIENT_DISABILITY_COL.registrationNo])
        if (!regNo) continue
        disabilityMap.set(regNo, {
          disability_type:     normalizeDisabilityType(row[CLIENT_DISABILITY_COL.disabilityType]),
          disability_grade:    toStr(row[CLIENT_DISABILITY_COL.disabilityGrade]),
          disability_cause:    toStr(row[CLIENT_DISABILITY_COL.disabilityCause]),
          disability_onset_date: toStr(row[CLIENT_DISABILITY_COL.disabilityOnset]),
        })
      }

      let totalAdded = 0
      let totalSkipped = 0

      for (const row of basicRows.slice(1)) {
        const name = toStr(row[CLIENT_BASIC_COL.name])
        if (!name) continue

        const registrationNo = toStr(row[CLIENT_BASIC_COL.registrationNo])

        // Deduplicate by registration_number (or name+birth_date fallback)
        const birthDate = parseClientBirthDate(row[CLIENT_BASIC_COL.birthDate])
        let existing = null
        if (registrationNo) {
          const { data } = await supabase
            .from('clients')
            .select('id')
            .eq('registration_number', registrationNo)
            .maybeSingle()
          existing = data
        } else {
          const { data } = await supabase
            .from('clients')
            .select('id')
            .eq('name', name)
            .eq('birth_date', birthDate ?? '')
            .maybeSingle()
          existing = data
        }

        if (existing) { totalSkipped++; continue }

        const region  = toStr(row[CLIENT_BASIC_COL.regionSi])
        const detail  = toStr(row[CLIENT_BASIC_COL.addressDetail])
        const address = [region, detail].filter(Boolean).join(' ') || null
        const dis     = registrationNo ? disabilityMap.get(registrationNo) : undefined

        const { error: insertError } = await supabase.from('clients').insert({
          registration_number:  registrationNo,
          name,
          birth_date:           birthDate,
          gender:               normalizeGender(row[CLIENT_BASIC_COL.gender]),
          address,
          contact:              toStr(row[CLIENT_BASIC_COL.contact]),
          guardian_contact:     toStr(row[CLIENT_BASIC_COL.guardianContact]),
          economic_status:      toStr(row[CLIENT_BASIC_COL.economicStatus]),
          housing_type:         toStr(row[CLIENT_BASIC_COL.housingType]),
          has_elevator:         toBoolKorean(row[CLIENT_BASIC_COL.hasElevator]),
          obstacles:            toStr(row[CLIENT_BASIC_COL.obstacles]),
          disability_type:      dis?.disability_type ?? null,
          disability_grade:     dis?.disability_grade ?? null,
          disability_cause:     dis?.disability_cause ?? null,
          disability_onset_date: dis?.disability_onset_date ?? null,
        })

        if (!insertError) totalAdded++
      }

      await supabase.from('eval_sync_logs').insert({
        sheet_type:   'client',
        status:       'success',
        rows_added:   totalAdded,
        rows_skipped: totalSkipped,
      })
      revalidatePath('/migration')

      return { success: true, rowsAdded: totalAdded, rowsSkipped: totalSkipped }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const supabase = createAdminClient()
      await supabase.from('eval_sync_logs').insert({
        sheet_type: 'client', status: 'error',
        rows_added: 0, rows_skipped: 0, error_msg: msg,
      })
      return { success: false, rowsAdded: 0, rowsSkipped: 0, error: msg }
    }
  })
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
  return withStaffPermission(async () => {

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('eval_sync_logs')
      .select('*')
      .order('synced_at', { ascending: false })
      .limit(limit)

    if (error) return { success: false, error: error.message }
    return { success: true, logs: data as SyncLog[] }
  })
}

export async function getSyncStats(): Promise<{
  success: boolean
  callLogCount?: number
  serviceRecordCount?: number
  clientCount?: number
  lastCallLogSync?: string | null
  lastServiceRecordSync?: string | null
  lastClientSync?: string | null
  error?: string
}> {
  return withStaffPermission(async () => {

    const supabase = createAdminClient()

    const [callResult, srResult, clientResult, logsResult] = await Promise.all([
      supabase.from('call_logs').select('*', { count: 'exact', head: true }),
      supabase.from('eval_service_records').select('*', { count: 'exact', head: true }),
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('eval_sync_logs')
        .select('sheet_type, synced_at, status')
        .eq('status', 'success')
        .order('synced_at', { ascending: false })
        .limit(15),
    ])

    if (callResult.error || srResult.error || clientResult.error) {
      return { success: false, error: callResult.error?.message ?? srResult.error?.message ?? clientResult.error?.message }
    }

    type SyncLogRow = { sheet_type: string; synced_at: string | null }
    const logs = logsResult.data as SyncLogRow[] ?? []
    const lastCallLog = logs.find(l => l.sheet_type === 'call_log')?.synced_at ?? null
    const lastSR      = logs.find(l => l.sheet_type === 'service_record')?.synced_at ?? null
    const lastClient  = logs.find(l => l.sheet_type === 'client')?.synced_at ?? null

    return {
      success: true,
      callLogCount:        callResult.count ?? 0,
      serviceRecordCount:  srResult.count ?? 0,
      clientCount:         clientResult.count ?? 0,
      lastCallLogSync:     lastCallLog,
      lastServiceRecordSync: lastSR,
      lastClientSync:      lastClient,
    }
  })
}
