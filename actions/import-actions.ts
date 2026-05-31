"use server"

import * as XLSX from 'xlsx'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"

export interface ImportResult {
  success: boolean
  rowsAdded: number
  rowsSkipped: number
  rowsFailed: number
  error?: string
}

// ── file parsing ────────────────────────────────────────────────────────────────

type Row = (string | number | boolean | Date | null | undefined)[]

function parseWorkbook(buffer: ArrayBuffer): XLSX.WorkBook {
  return XLSX.read(buffer, { type: 'buffer', cellDates: true })
}

function getRows(wb: XLSX.WorkBook, sheetName: string): Row[] {
  const ws = wb.Sheets[sheetName]
  if (!ws) return []
  return XLSX.utils.sheet_to_json<Row>(ws, { header: 1, defval: null })
}

function findSheet(wb: XLSX.WorkBook, ...keywords: string[]): string | undefined {
  return wb.SheetNames.find(n => keywords.some(k => n.includes(k)))
}

// ── value helpers ───────────────────────────────────────────────────────────────

function toStr(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null
  return String(v).trim() || null
}

function toBool(v: unknown): boolean {
  if (!v) return false
  const s = String(v).trim()
  return s !== '' && s !== 'FALSE' && s !== 'false' && s !== '0'
}

function toBoolKorean(v: unknown): boolean | null {
  if (!v) return null
  const s = String(v).trim()
  if (s === '있음' || s === 'Y' || s === '예') return true
  if (s === '없음' || s === 'N' || s === '아니오') return false
  return null
}

function parseDate(v: unknown): string | null {
  if (!v) return null
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v.toISOString().split('T')[0]
  if (typeof v === 'number') {
    const s = String(Math.floor(v))
    if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
    return null
  }
  const s = String(v).trim()
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
  const m = s.match(/^(\d{4}[-./]\d{2}[-./]\d{2})/)
  return m ? m[1].replace(/[./]/g, '-') : null
}

function parseServiceDate(v: unknown): string | null {
  if (!v) return null
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v.toISOString().split('T')[0]
  const s = String(v).trim().replace('.0', '')
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : null
}

function parseClientBirthDate(v: unknown): string | null {
  if (!v) return null
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v.toISOString().split('T')[0]
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

function parseBirthDate(v: unknown): string | null {
  if (!v) return null
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v.toISOString().split('T')[0]
  const s = String(v).trim()
  const m = s.match(/^(\d{2})(\d{2})(\d{2})/)
  if (m) {
    const yy = parseInt(m[1])
    const cent = yy <= (new Date().getFullYear() % 100) ? '20' : '19'
    return `${cent}${m[1]}-${m[2]}-${m[3]}`
  }
  return null
}

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

// ── column indices (mirror migration-actions.ts) ────────────────────────────────

const CLIENT_BASIC_COL = {
  seq: 0, registrationNo: 1, name: 2, birthDate: 3, gender: 4,
  regionSi: 5, addressDetail: 6, contact: 7, guardianContact: 8,
  economicStatus: 12, housingType: 13, hasElevator: 16, obstacles: 17,
} as const

const CLIENT_DISABILITY_COL = {
  registrationNo: 1, disabilityType: 3, disabilityGrade: 4,
  disabilityCause: 5, disabilityOnset: 6,
} as const

const CALL_COL = {
  date: 2, requesterName: 3, requesterRegion: 4, requesterContact: 5,
  requesterType: 6, targetName: 7, targetGender: 8, disabilityType: 9,
  disabilitySeverity: 10, economicStatus: 11, qPublic: 12, qPrivate: 13,
  qDevice: 14, qCase: 15, qOther: 16, questionContent: 17, answer: 18, staffName: 19,
} as const

const SR_COL = {
  date: 0, seq: 1, appYear: 5, appNo: 6, isReApplication: 4,
  name: 7, birthDate: 8, gender: 10, region: 11, disabilityType: 12,
  serviceCategory: 13, productName: 14, itemCategory: 15,
  serviceContent: 16, serviceArea: 17,
  isConsult: 18, isAssessment: 19, isTrial: 20, isRental: 21,
  isCustomMake: 22, isGrant: 23, isEducation: 24, isOtherBusiness: 25,
  isInfoProvision: 26, isPublicFunding: 27, isPrivateFunding: 28,
  isSelfPay: 29, isFundingSecured: 30, isRepair: 31, isCleaning: 32,
  isReuse: 33, isMonitoring: 34, referralType: 35,
  isPhone: 36, isVisitIn: 37, isVisitOut: 38,
  isClosed: 39, staffName: 40, contact: 41, address: 42,
} as const

// ── Server Actions ──────────────────────────────────────────────────────────────

export async function importClientsFile(formData: FormData): Promise<ImportResult> {
  if (!await hasAdminOrStaffPermission())
    return { success: false, rowsAdded: 0, rowsSkipped: 0, rowsFailed: 0, error: '권한이 없습니다' }

  try {
    const file = formData.get('file') as File | null
    if (!file) throw new Error('파일이 없습니다')

    const wb = parseWorkbook(await file.arrayBuffer())
    const basicSheetName = findSheet(wb, '기초정보', '대상자기초', '기본정보') ?? wb.SheetNames[0]
    const disSheetName   = findSheet(wb, '장애정보', '대상자장애')

    const basicRows = getRows(wb, basicSheetName).slice(1)
    const disRows   = disSheetName ? getRows(wb, disSheetName).slice(1) : []

    const disMap = new Map<string, {
      disability_type: string | null; disability_grade: string | null
      disability_cause: string | null; disability_onset_date: string | null
    }>()
    for (const row of disRows) {
      const regNo = toStr(row[CLIENT_DISABILITY_COL.registrationNo])
      if (!regNo) continue
      disMap.set(regNo, {
        disability_type:      normalizeDisabilityType(row[CLIENT_DISABILITY_COL.disabilityType]),
        disability_grade:     toStr(row[CLIENT_DISABILITY_COL.disabilityGrade]),
        disability_cause:     toStr(row[CLIENT_DISABILITY_COL.disabilityCause]),
        disability_onset_date: toStr(row[CLIENT_DISABILITY_COL.disabilityOnset]),
      })
    }

    const supabase = createAdminClient()
    let added = 0, skipped = 0, failed = 0

    for (const row of basicRows) {
      const name = toStr(row[CLIENT_BASIC_COL.name])
      if (!name) continue

      const registrationNo = toStr(row[CLIENT_BASIC_COL.registrationNo])
      const birthDate      = parseClientBirthDate(row[CLIENT_BASIC_COL.birthDate])

      let existing = null
      if (registrationNo) {
        const { data } = await supabase.from('clients').select('id').eq('registration_number', registrationNo).maybeSingle()
        existing = data
      } else {
        const { data } = await supabase.from('clients').select('id').eq('name', name).eq('birth_date', birthDate ?? '').maybeSingle()
        existing = data
      }
      if (existing) { skipped++; continue }

      const address = [toStr(row[CLIENT_BASIC_COL.regionSi]), toStr(row[CLIENT_BASIC_COL.addressDetail])].filter(Boolean).join(' ') || null
      const dis     = registrationNo ? disMap.get(registrationNo) : undefined

      const { error } = await supabase.from('clients').insert({
        registration_number:   registrationNo,
        name, birth_date: birthDate,
        gender:                normalizeGender(row[CLIENT_BASIC_COL.gender]),
        address,
        contact:               toStr(row[CLIENT_BASIC_COL.contact]),
        guardian_contact:      toStr(row[CLIENT_BASIC_COL.guardianContact]),
        economic_status:       toStr(row[CLIENT_BASIC_COL.economicStatus]),
        housing_type:          toStr(row[CLIENT_BASIC_COL.housingType]),
        has_elevator:          toBoolKorean(row[CLIENT_BASIC_COL.hasElevator]),
        obstacles:             toStr(row[CLIENT_BASIC_COL.obstacles]),
        disability_type:       dis?.disability_type ?? null,
        disability_grade:      dis?.disability_grade ?? null,
        disability_cause:      dis?.disability_cause ?? null,
        disability_onset_date: dis?.disability_onset_date ?? null,
      })
      if (!error) added++; else failed++
    }

    await supabase.from('eval_sync_logs').insert({
      sheet_type: 'client', status: 'success', rows_added: added, rows_skipped: skipped,
    })
    revalidatePath('/migration')
    return { success: true, rowsAdded: added, rowsSkipped: skipped, rowsFailed: failed }
  } catch (err) {
    return { success: false, rowsAdded: 0, rowsSkipped: 0, rowsFailed: 0, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function importCallLogsFile(formData: FormData): Promise<ImportResult> {
  if (!await hasAdminOrStaffPermission())
    return { success: false, rowsAdded: 0, rowsSkipped: 0, rowsFailed: 0, error: '권한이 없습니다' }

  try {
    const file = formData.get('file') as File | null
    if (!file) throw new Error('파일이 없습니다')

    const wb = parseWorkbook(await file.arrayBuffer())
    const yearSheets = wb.SheetNames.filter(n => /^\d{4}$/.test(n))
    const sheets = yearSheets.length > 0 ? yearSheets : wb.SheetNames

    const supabase = createAdminClient()
    let added = 0, skipped = 0, failed = 0

    for (const sheetName of sheets) {
      for (const row of getRows(wb, sheetName).slice(8)) {
        if (!row[1]) continue
        const logDate = parseDate(row[CALL_COL.date])
        if (!logDate) continue

        const staffName      = toStr(row[CALL_COL.staffName])
        const questionContent = toStr(row[CALL_COL.questionContent])

        const { data: existing } = await supabase.from('call_logs').select('id')
          .eq('log_date', logDate).eq('staff_name', staffName ?? '').eq('question_content', questionContent ?? '').maybeSingle()
        if (existing) { skipped++; continue }

        const { error } = await supabase.from('call_logs').insert({
          log_date:                   logDate,
          requester_name:             toStr(row[CALL_COL.requesterName]),
          requester_region:           toStr(row[CALL_COL.requesterRegion]),
          requester_contact:          toStr(row[CALL_COL.requesterContact]),
          requester_type:             toStr(row[CALL_COL.requesterType]),
          target_name:                toStr(row[CALL_COL.targetName]),
          target_gender:              toStr(row[CALL_COL.targetGender]),
          target_disability_type:     toStr(row[CALL_COL.disabilityType]),
          target_disability_severity: toStr(row[CALL_COL.disabilitySeverity]),
          target_economic_status:     toStr(row[CALL_COL.economicStatus]),
          q_public_benefit:           toBool(row[CALL_COL.qPublic]),
          q_private_benefit:          toBool(row[CALL_COL.qPrivate]),
          q_device:                   toBool(row[CALL_COL.qDevice]),
          q_case_management:          toBool(row[CALL_COL.qCase]),
          q_other:                    toBool(row[CALL_COL.qOther]),
          question_content:           questionContent,
          answer:                     toStr(row[CALL_COL.answer]),
          staff_name:                 staffName,
        })
        if (!error) added++; else failed++
      }
    }

    await supabase.from('eval_sync_logs').insert({
      sheet_type: 'call_log', status: 'success', rows_added: added, rows_skipped: skipped,
    })
    revalidatePath('/migration')
    return { success: true, rowsAdded: added, rowsSkipped: skipped, rowsFailed: failed }
  } catch (err) {
    return { success: false, rowsAdded: 0, rowsSkipped: 0, rowsFailed: 0, error: err instanceof Error ? err.message : String(err) }
  }
}

function deriveServiceFlags(cat: string | null): {
  is_consult: boolean; is_assessment: boolean; is_trial: boolean; is_rental: boolean
  is_custom_make: boolean; is_grant: boolean; is_education: boolean; is_other_business: boolean
  is_info_provision: boolean; is_repair: boolean; is_cleaning: boolean; is_reuse: boolean; is_monitoring: boolean
} {
  const c = (cat ?? '').trim()
  return {
    is_consult:       c.includes('상담'),
    is_assessment:    c.includes('평가') && !c.includes('교부'),
    is_trial:         c.includes('체험'),
    is_rental:        c === '대여',
    is_custom_make:   c.includes('맞춤') && !c.includes('교부'),
    is_grant:         c.includes('교부'),
    is_education:     c.includes('교육'),
    is_other_business: c.includes('기타사업'),
    is_info_provision: c.includes('정보제공') || c === '정보',
    is_repair:        c.includes('수리'),
    is_cleaning:      c.includes('세척') || c.includes('소독'),
    is_reuse:         c === '재사용',
    is_monitoring:    c.includes('모니터링'),
  }
}

export async function importServiceRecordsFile(formData: FormData): Promise<ImportResult> {
  if (!await hasAdminOrStaffPermission())
    return { success: false, rowsAdded: 0, rowsSkipped: 0, rowsFailed: 0, error: '권한이 없습니다' }

  try {
    const file = formData.get('file') as File | null
    if (!file) throw new Error('파일이 없습니다')

    const wb = parseWorkbook(await file.arrayBuffer())
    const sheetName = findSheet(wb, '서비스 상세', '서비스상세', '보조기기 서비스') ?? wb.SheetNames[0]
    const rows = getRows(wb, sheetName).slice(9)

    const supabase = createAdminClient()
    let added = 0, skipped = 0, failed = 0

    for (const row of rows) {
      if (!row[SR_COL.seq]) continue
      const receivedAt = parseServiceDate(row[SR_COL.date])
      const name       = toStr(row[SR_COL.name])
      const birthDate  = parseBirthDate(row[SR_COL.birthDate])
      if (!name) continue

      const { data: existing } = await supabase.from('eval_service_records').select('id')
        .eq('received_at', receivedAt ?? '').eq('name', name).eq('birth_date', birthDate ?? '').maybeSingle()
      if (existing) { skipped++; continue }

      const serviceCategory = toStr(row[SR_COL.serviceCategory])
      const flags = deriveServiceFlags(serviceCategory)
      const closedStatus = toStr(row[SR_COL.isClosed])
      const isClosed = closedStatus === '종결'
      const rawArea = toStr(row[SR_COL.serviceArea])
      const serviceArea = rawArea === '#N/A' ? null : rawArea

      const { error } = await supabase.from('eval_service_records').insert({
        received_at:       receivedAt,
        application_year:  receivedAt ? parseInt(receivedAt.split('-')[0]) : null,
        application_no:    row[SR_COL.appNo]    ? parseInt(String(row[SR_COL.appNo]))    : null,
        is_re_application: toBool(row[SR_COL.isReApplication]),
        name, birth_date: birthDate,
        gender:            toStr(row[SR_COL.gender]),
        region:            toStr(row[SR_COL.region]),
        disability_type:   toStr(row[SR_COL.disabilityType]),
        service_category:  serviceCategory,
        product_name:      toStr(row[SR_COL.productName]),
        item_category:     toStr(row[SR_COL.itemCategory]),
        service_content:   toStr(row[SR_COL.serviceContent]),
        service_area:      serviceArea,
        ...flags,
        is_public_funding: toBool(row[SR_COL.isPublicFunding]),
        is_private_funding: toBool(row[SR_COL.isPrivateFunding]),
        is_self_pay:       toBool(row[SR_COL.isSelfPay]),
        is_funding_secured: toBool(row[SR_COL.isFundingSecured]),
        referral_type:     toStr(row[SR_COL.referralType]),
        is_phone:          toBool(row[SR_COL.isPhone]),
        is_visit_in:       toBool(row[SR_COL.isVisitIn]),
        is_visit_out:      toBool(row[SR_COL.isVisitOut]),
        is_closed:         isClosed,
        staff_name:        toStr(row[SR_COL.staffName]),
        contact:           toStr(row[SR_COL.contact]),
        address:           toStr(row[SR_COL.address]),
        source:            'csv',
        application_month: receivedAt ? parseInt(receivedAt.split('-')[1]) : null,
        record_status:     isClosed ? '완료' : (closedStatus === '취소' ? '취소' : '미정'),
      })
      if (!error) added++; else failed++
    }

    await supabase.from('eval_sync_logs').insert({
      sheet_type: 'service_record', status: 'success', rows_added: added, rows_skipped: skipped,
    })
    revalidatePath('/migration')
    return { success: true, rowsAdded: added, rowsSkipped: skipped, rowsFailed: failed }
  } catch (err) {
    return { success: false, rowsAdded: 0, rowsSkipped: 0, rowsFailed: 0, error: err instanceof Error ? err.message : String(err) }
  }
}
