/**
 * Standalone Google Sheets → Supabase sync script.
 * Runs outside Next.js — no Clerk auth required.
 *
 * Usage:
 *   pnpm tsx scripts/sync-sheets.ts [clients|call_logs|service_records|all]
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { google, sheets_v4 } from 'googleapis'
import * as XLSX from 'xlsx'

// ── Supabase admin client ─────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Google API clients ────────────────────────────────────────────────────────

function buildGoogleAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON')
  // dotenv may expand \n escape sequences into actual newlines; re-escape them
  const normalized = raw.replace(/\r?\n/g, '\\n')
  const creds = JSON.parse(normalized) as { private_key?: string; [key: string]: unknown }
  // Reconstruct private_key to ensure it is valid PEM for OpenSSL.
  // dotenv may expand \n and indent JSON, producing broken headers and
  // base64 lines with leading spaces. We strip all whitespace from the
  // base64 body and re-wrap to 64-char lines.
  if (typeof creds.private_key === 'string') {
    const raw_pk = creds.private_key
      .replace(/\\n/g, '\n')  // convert any remaining literal \n sequences
      .replace(/\r/g, '')     // strip carriage returns
    // Extract base64 body (strip PEM delimiters and all whitespace)
    const body = raw_pk.replace(/-----[^-]*-----/g, '').replace(/\s+/g, '')
    // Re-wrap to 64-char lines and add proper PEM delimiters
    const lines = body.match(/.{1,64}/g) ?? []
    creds.private_key = `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----\n`
  }
  return new google.auth.GoogleAuth({
    credentials: creds as object,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  })
}

const gAuth = buildGoogleAuth()
const sheets = google.sheets({ version: 'v4', auth: gAuth }) as sheets_v4.Sheets
const drive = google.drive({ version: 'v3', auth: gAuth })

// Download an Office file (XLSX) via Drive API and parse with the xlsx library.
// Falls back to this when the Sheets API returns "not a Google Sheets document".
async function downloadXlsxWorkbook(fileId: string): Promise<XLSX.WorkBook> {
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  )
  return XLSX.read(res.data as ArrayBuffer, { type: 'buffer', cellDates: true })
}

async function getSheetValues(spreadsheetId: string, range: string) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  })
  return (res.data.values ?? []) as (string | number | boolean | null)[][]
}

async function getSheetNames(spreadsheetId: string): Promise<string[]> {
  const res = await sheets.spreadsheets.get({ spreadsheetId })
  return (res.data.sheets ?? []).map((s) => s.properties?.title ?? '')
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  const s = String(v).trim().replace('.0', '')
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : null
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

function parseBirthDate(v: unknown): string | null {
  if (!v) return null
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
  const s = String(v ?? '').trim()
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

async function logSync(
  sheetType: string,
  status: 'success' | 'error',
  rowsAdded: number,
  rowsSkipped: number,
  errorMsg?: string
) {
  await supabase.from('eval_sync_logs').insert({
    sheet_type: sheetType,
    status,
    rows_added: rowsAdded,
    rows_skipped: rowsSkipped,
    error_msg: errorMsg ?? null,
  })
}

// ── 대상자 정보 동기화 ────────────────────────────────────────────────────────

const CLIENT_BASIC_COL = {
  seq: 0, registrationNo: 1, name: 2, birthDate: 3, gender: 4,
  regionSi: 5, addressDetail: 6, contact: 7, guardianContact: 8,
  economicStatus: 12, housingType: 13, hasElevator: 16, obstacles: 17,
} as const

const CLIENT_DISABILITY_COL = {
  registrationNo: 1, disabilityType: 3, disabilityGrade: 4,
  disabilityCause: 5, disabilityOnset: 6,
} as const

async function syncClients() {
  const sheetId = process.env.GOOGLE_CLIENT_SHEET_ID
  if (!sheetId) throw new Error('Missing GOOGLE_CLIENT_SHEET_ID')

  console.log('[clients] 시트 읽는 중...')
  const [basicRows, disabilityRows] = await Promise.all([
    getSheetValues(sheetId, '대상자기초정보!A:R'),
    getSheetValues(sheetId, '대상자장애정보!A:G'),
  ])

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
      disability_type: normalizeDisabilityType(row[CLIENT_DISABILITY_COL.disabilityType]),
      disability_grade: toStr(row[CLIENT_DISABILITY_COL.disabilityGrade]),
      disability_cause: toStr(row[CLIENT_DISABILITY_COL.disabilityCause]),
      disability_onset_date: toStr(row[CLIENT_DISABILITY_COL.disabilityOnset]),
    })
  }

  let added = 0, skipped = 0
  console.log(`[clients] 데이터 행 수: ${basicRows.slice(1).length}`)

  for (const row of basicRows.slice(1)) {
    const name = toStr(row[CLIENT_BASIC_COL.name])
    if (!name) continue

    const registrationNo = toStr(row[CLIENT_BASIC_COL.registrationNo])
    const birthDate = parseClientBirthDate(row[CLIENT_BASIC_COL.birthDate])

    let existing = null
    if (registrationNo) {
      const { data } = await supabase.from('clients').select('id')
        .eq('registration_number', registrationNo).maybeSingle()
      existing = data
    } else {
      const { data } = await supabase.from('clients').select('id')
        .eq('name', name).eq('birth_date', birthDate ?? '').maybeSingle()
      existing = data
    }

    if (existing) { skipped++; continue }

    const region = toStr(row[CLIENT_BASIC_COL.regionSi])
    const detail = toStr(row[CLIENT_BASIC_COL.addressDetail])
    const address = [region, detail].filter(Boolean).join(' ') || null
    const dis = registrationNo ? disabilityMap.get(registrationNo) : undefined

    const { error } = await supabase.from('clients').insert({
      registration_number: registrationNo,
      name,
      birth_date: birthDate,
      gender: normalizeGender(row[CLIENT_BASIC_COL.gender]),
      address,
      contact: toStr(row[CLIENT_BASIC_COL.contact]),
      guardian_contact: toStr(row[CLIENT_BASIC_COL.guardianContact]),
      economic_status: toStr(row[CLIENT_BASIC_COL.economicStatus]),
      housing_type: toStr(row[CLIENT_BASIC_COL.housingType]),
      has_elevator: toBoolKorean(row[CLIENT_BASIC_COL.hasElevator]),
      obstacles: toStr(row[CLIENT_BASIC_COL.obstacles]),
      disability_type: dis?.disability_type ?? null,
      disability_grade: dis?.disability_grade ?? null,
      disability_cause: dis?.disability_cause ?? null,
      disability_onset_date: dis?.disability_onset_date ?? null,
    })
    if (!error) added++
  }

  await logSync('client', 'success', added, skipped)
  console.log(`[clients] ✅ 추가: ${added}, 스킵: ${skipped}`)
  return { added, skipped }
}

// ── 콜센터 상담 일지 동기화 ───────────────────────────────────────────────────

const CALL_COL = {
  date: 2, requesterName: 3, requesterRegion: 4, requesterContact: 5,
  requesterType: 6, targetName: 7, targetGender: 8, disabilityType: 9,
  disabilitySeverity: 10, economicStatus: 11, qPublic: 12, qPrivate: 13,
  qDevice: 14, qCase: 15, qOther: 16, questionContent: 17, answer: 18, staffName: 19,
} as const

async function syncCallLogs() {
  const sheetId = process.env.GOOGLE_CALL_LOG_SHEET_ID
  if (!sheetId) throw new Error('Missing GOOGLE_CALL_LOG_SHEET_ID')

  // Try native Sheets API; fall back to Drive API + xlsx for Office files
  let xlsxWorkbook: XLSX.WorkBook | null = null
  let yearSheets: string[]

  try {
    const sheetNames = await getSheetNames(sheetId)
    yearSheets = sheetNames.filter((n) => /^\d{4}$/.test(n))
  } catch (e) {
    const errMsg = String((e as { message?: string }).message ?? e)
    if (!errMsg.includes('Office file') && !(e as { code?: number }).code?.toString().includes('400')) throw e
    console.log('[call_logs] Office 파일 감지 — Drive API fallback 사용')
    xlsxWorkbook = await downloadXlsxWorkbook(sheetId)
    yearSheets = xlsxWorkbook.SheetNames.filter((n) => /^\d{4}$/.test(n))
  }
  console.log(`[call_logs] 연도별 시트: ${yearSheets.join(', ')}`)

  let added = 0, skipped = 0

  for (const sheet of yearSheets) {
    let rows: (string | number | boolean | null | Date)[][]
    if (xlsxWorkbook) {
      const ws = xlsxWorkbook.Sheets[sheet]
      if (!ws) continue
      rows = XLSX.utils.sheet_to_json<(string | number | boolean | null | Date)[]>(ws, {
        header: 1, defval: null, cellDates: true,
      })
    } else {
      rows = await getSheetValues(sheetId, `${sheet}!A:X`)
    }
    const dataRows = rows.slice(8)
    console.log(`[call_logs] ${sheet} 시트: ${dataRows.length}행`)

    for (const row of dataRows) {
      if (!row[1]) continue
      const logDate = parseDate(row[CALL_COL.date])
      if (!logDate) continue

      const staffName = toStr(row[CALL_COL.staffName])
      const questionContent = toStr(row[CALL_COL.questionContent])

      const { data: existing } = await supabase.from('call_logs').select('id')
        .eq('log_date', logDate)
        .eq('staff_name', staffName ?? '')
        .eq('question_content', questionContent ?? '')
        .maybeSingle()

      if (existing) { skipped++; continue }

      const { error } = await supabase.from('call_logs').insert({
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
      if (!error) added++
    }
  }

  await logSync('call_log', 'success', added, skipped)
  console.log(`[call_logs] ✅ 추가: ${added}, 스킵: ${skipped}`)
  return { added, skipped }
}

// ── 서비스 실적 동기화 ────────────────────────────────────────────────────────

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
  isClosed: 39, staffName: 40,
  contact: 41,
  address: 42,
} as const

async function syncServiceRecords() {
  // support both plural (canonical) and singular (legacy) env var names
  const sheetIds = (process.env.GOOGLE_SERVICE_RECORD_SHEET_IDS ?? process.env.GOOGLE_SERVICE_RECORD_SHEET_ID ?? '')
    .split(',').map((s) => s.trim()).filter(Boolean)
  if (sheetIds.length === 0) throw new Error('Missing GOOGLE_SERVICE_RECORD_SHEET_IDS')

  let totalAdded = 0, totalSkipped = 0

  for (const sheetId of sheetIds) {
    console.log(`[service_records] 시트 ${sheetId} 읽는 중...`)
    let rows: (string | number | boolean | null | Date)[][]
    try {
      rows = await getSheetValues(sheetId, '보조기기 서비스 상세!A:AQ')
    } catch (e) {
      const errMsg = String((e as { message?: string }).message ?? e)
      if (!errMsg.includes('Office file') && !(e as { code?: number }).code?.toString().includes('400')) throw e
      console.log(`[service_records] Office 파일 감지 — Drive API fallback 사용 (${sheetId})`)
      const wb = await downloadXlsxWorkbook(sheetId)
      const sheetName = wb.SheetNames.find((n) => n.includes('서비스 상세') || n.includes('서비스상세'))
        ?? wb.SheetNames[0]
      rows = XLSX.utils.sheet_to_json<(string | number | boolean | null | Date)[]>(
        wb.Sheets[sheetName], { header: 1, defval: null, cellDates: true }
      )
    }
    const dataRows = rows.slice(9)
    console.log(`[service_records] 데이터 행 수: ${dataRows.length}`)

    for (const row of dataRows) {
      if (!row[SR_COL.seq]) continue

      const receivedAt = parseServiceDate(row[SR_COL.date])
      const name = toStr(row[SR_COL.name])
      const birthDate = parseBirthDate(row[SR_COL.birthDate])
      if (!name) continue

      const { data: existing } = await supabase.from('eval_service_records').select('id')
        .eq('received_at', receivedAt ?? '')
        .eq('name', name)
        .eq('birth_date', birthDate ?? '')
        .maybeSingle()

      if (existing) { totalSkipped++; continue }

      const { error } = await supabase.from('eval_service_records').insert({
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
      if (!error) totalAdded++
    }
  }

  await logSync('service_record', 'success', totalAdded, totalSkipped)
  console.log(`[service_records] ✅ 추가: ${totalAdded}, 스킵: ${totalSkipped}`)
  return { added: totalAdded, skipped: totalSkipped }
}

// ── main ──────────────────────────────────────────────────────────────────────

const target = process.argv[2] ?? 'all'

async function main() {
  console.log(`\n🚀 동기화 시작 (대상: ${target})\n`)

  try {
    if (target === 'all' || target === 'clients') {
      await syncClients()
    }
    if (target === 'all' || target === 'call_logs') {
      await syncCallLogs()
    }
    if (target === 'all' || target === 'service_records') {
      await syncServiceRecords()
    }
    console.log('\n✅ 동기화 완료')
  } catch (err) {
    console.error('\n❌ 오류:', err)
    process.exit(1)
  }
}

main()
