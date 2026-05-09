# Phase 13: Google Sheets 마이그레이션 & 실적 보고 자동화 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Google Sheets(콜센터 상담 일지, 서비스 실적)의 과거 데이터를 Supabase로 마이그레이션하고, 3종 중앙 보고 엑셀 파일을 자동 생성하는 UI를 eval 앱에 추가한다.

**Architecture:** `googleapis` Service Account로 구글 시트를 읽어 Supabase에 upsert한다. 보고서는 ExcelJS로 원본 템플릿에 데이터를 주입해 다운로드한다. 모든 Server Action은 monorepo root의 `/actions/`에 추가하고, UI 페이지는 `apps/eval/app/` 아래에 추가한다.

**Tech Stack:** Next.js 16 App Router, Supabase (admin client), googleapis v144, ExcelJS v4, TypeScript strict

---

## 파일 맵

| 파일 | 역할 |
|---|---|
| `migrations/041_extend_call_logs.sql` | call_logs에 requester_name, requester_contact 추가 |
| `migrations/042_create_eval_service_records.sql` | 서비스 실적 전용 테이블 생성 |
| `migrations/043_create_eval_sync_logs.sql` | 동기화 이력 테이블 생성 |
| `migrations/044_create_report_views.sql` | 보고서용 뷰 2종 생성 |
| `apps/eval/lib/google-sheets.ts` | googleapis 클라이언트 초기화 |
| `actions/migration-actions.ts` | Google Sheets → Supabase upsert Server Action |
| `actions/report-actions.ts` | Supabase → Excel Buffer 생성 Server Action |
| `apps/eval/app/migration/page.tsx` | 동기화 현황 UI 페이지 |
| `apps/eval/app/reports/page.tsx` | 보고서 출력 UI 페이지 |
| `apps/eval/components/layout/EvalSidebar.tsx` | 기존 파일 수정 — 메뉴 2개 추가 |
| `apps/eval/public/templates/` | 엑셀 템플릿 3개 복사 위치 |

---

## Task 1: DB 마이그레이션 파일 4개 작성

**Files:**
- Create: `migrations/041_extend_call_logs.sql`
- Create: `migrations/042_create_eval_service_records.sql`
- Create: `migrations/043_create_eval_sync_logs.sql`
- Create: `migrations/044_create_report_views.sql`

- [ ] **Step 1: 041 — call_logs 확장**

```sql
-- migrations/041_extend_call_logs.sql
ALTER TABLE call_logs
  ADD COLUMN IF NOT EXISTS requester_name    TEXT,
  ADD COLUMN IF NOT EXISTS requester_contact TEXT;

COMMENT ON COLUMN call_logs.requester_name    IS '의뢰인 성명';
COMMENT ON COLUMN call_logs.requester_contact IS '의뢰인 연락처';
```

- [ ] **Step 2: 042 — eval_service_records 생성**

```sql
-- migrations/042_create_eval_service_records.sql
CREATE TABLE IF NOT EXISTS eval_service_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID REFERENCES clients(id),

  -- 접수 정보
  received_at       DATE,
  application_year  INTEGER,
  application_no    INTEGER,
  is_re_application BOOLEAN DEFAULT false,

  -- 대상자 정보 (시트 원본 보존)
  name              TEXT,
  birth_date        DATE,
  gender            TEXT,
  region            TEXT,
  disability_type   TEXT,

  -- 서비스 분류
  service_category  TEXT,
  product_name      TEXT,
  item_category     TEXT,
  service_content   TEXT,
  service_area      TEXT,

  -- 보조기기센터 사업 체크박스
  is_consult        BOOLEAN DEFAULT false,
  is_assessment     BOOLEAN DEFAULT false,
  is_trial          BOOLEAN DEFAULT false,
  is_rental         BOOLEAN DEFAULT false,
  is_custom_make    BOOLEAN DEFAULT false,
  is_grant          BOOLEAN DEFAULT false,
  is_education      BOOLEAN DEFAULT false,
  is_other_business BOOLEAN DEFAULT false,
  is_info_provision BOOLEAN DEFAULT false,

  -- 재원연계
  is_public_funding  BOOLEAN DEFAULT false,
  is_private_funding BOOLEAN DEFAULT false,
  is_self_pay        BOOLEAN DEFAULT false,
  is_funding_secured BOOLEAN DEFAULT false,

  -- 사후관리
  is_repair     BOOLEAN DEFAULT false,
  is_cleaning   BOOLEAN DEFAULT false,
  is_reuse      BOOLEAN DEFAULT false,
  is_monitoring BOOLEAN DEFAULT false,

  -- 서비스 제공 방법
  referral_type TEXT,
  is_phone      BOOLEAN DEFAULT false,
  is_visit_in   BOOLEAN DEFAULT false,
  is_visit_out  BOOLEAN DEFAULT false,

  is_closed  BOOLEAN DEFAULT false,
  staff_name TEXT,
  source     TEXT DEFAULT 'sheets',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE eval_service_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can manage eval_service_records"
  ON eval_service_records FOR ALL
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_eval_sr_received_at    ON eval_service_records(received_at);
CREATE INDEX IF NOT EXISTS idx_eval_sr_name_birthdate ON eval_service_records(name, birth_date);
CREATE INDEX IF NOT EXISTS idx_eval_sr_client_id      ON eval_service_records(client_id);

COMMENT ON TABLE eval_service_records IS '보조기기 서비스 실적 — 중앙 보고용 전용 테이블';
```

- [ ] **Step 3: 043 — eval_sync_logs 생성**

```sql
-- migrations/043_create_eval_sync_logs.sql
CREATE TABLE IF NOT EXISTS eval_sync_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_type   TEXT NOT NULL CHECK (sheet_type IN ('call_log', 'service_record')),
  status       TEXT NOT NULL CHECK (status IN ('success', 'error')),
  rows_added   INTEGER DEFAULT 0,
  rows_skipped INTEGER DEFAULT 0,
  error_msg    TEXT,
  synced_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE eval_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read eval_sync_logs"
  ON eval_sync_logs FOR SELECT USING (true);

CREATE POLICY "service role can insert eval_sync_logs"
  ON eval_sync_logs FOR INSERT WITH CHECK (true);

COMMENT ON TABLE eval_sync_logs IS 'Google Sheets 동기화 실행 이력';
```

- [ ] **Step 4: 044 — 보고서 뷰 생성**

```sql
-- migrations/044_create_report_views.sql
CREATE OR REPLACE VIEW v_call_log_report AS
SELECT
  log_date,
  requester_name,
  requester_region,
  requester_contact,
  requester_type,
  target_name,
  target_gender,
  target_disability_type,
  target_disability_severity,
  target_economic_status,
  q_public_benefit,
  q_private_benefit,
  q_device,
  q_case_management,
  q_other,
  question_content,
  answer,
  staff_name
FROM call_logs
ORDER BY log_date, created_at;

CREATE OR REPLACE VIEW v_service_record_report AS
SELECT
  received_at,
  application_year,
  application_no,
  name,
  birth_date,
  gender,
  region,
  disability_type,
  service_category,
  product_name,
  item_category,
  service_content,
  service_area,
  is_consult, is_assessment, is_trial, is_rental,
  is_custom_make, is_grant, is_education,
  is_other_business, is_info_provision,
  is_public_funding, is_private_funding,
  is_self_pay, is_funding_secured,
  is_repair, is_cleaning, is_reuse, is_monitoring,
  referral_type, is_phone, is_visit_in, is_visit_out,
  is_closed, staff_name
FROM eval_service_records
ORDER BY received_at, created_at;
```

- [ ] **Step 5: Supabase Dashboard에서 4개 마이그레이션 순서대로 실행**

  실행 순서: 041 → 042 → 043 → 044

  각 파일을 SQL Editor에 붙여넣고 실행. 오류 없이 완료되는지 확인.

- [ ] **Step 6: 커밋**

```bash
git add migrations/041_extend_call_logs.sql \
        migrations/042_create_eval_service_records.sql \
        migrations/043_create_eval_sync_logs.sql \
        migrations/044_create_report_views.sql
git commit -m "feat: add Phase 13 DB migrations (call_logs extend, eval_service_records, sync_logs, views)"
```

---

## Task 2: 패키지 설치 & 엑셀 템플릿 배치

**Files:**
- Modify: `apps/eval/package.json`
- Create: `apps/eval/public/templates/` (디렉터리)

- [ ] **Step 1: googleapis, exceljs 설치**

```bash
cd apps/eval
pnpm add googleapis exceljs
```

Expected output: `dependencies` 섹션에 `googleapis`, `exceljs` 추가 확인.

- [ ] **Step 2: public/templates 디렉터리 생성**

```bash
mkdir -p apps/eval/public/templates
```

- [ ] **Step 3: 엑셀 템플릿 3개 복사**

아래 3개 파일을 `apps/eval/public/templates/`로 복사한다.
- `docs/(2026) 콜센터 상담 일지_강원.xlsx` → `apps/eval/public/templates/call_log_template.xlsx`
- `docs/2. (강원특별자치도보조기기센터)2026년 지역보조기기센터 서비스 실적.xlsx` → `apps/eval/public/templates/service_record_template.xlsx`
- `docs/1. (강원특별자치도보조기기센터)2026년 지역보조기기센터 사업 실적보고 양식.xlsx` → `apps/eval/public/templates/business_report_template.xlsx`

```bash
cp "docs/(2026) 콜센터 상담 일지_강원.xlsx" apps/eval/public/templates/call_log_template.xlsx
cp "docs/2. (강원특별자치도보조기기센터)2026년 지역보조기기센터 서비스 실적.xlsx" apps/eval/public/templates/service_record_template.xlsx
cp "docs/1. (강원특별자치도보조기기센터)2026년 지역보조기기센터 사업 실적보고 양식.xlsx" apps/eval/public/templates/business_report_template.xlsx
```

- [ ] **Step 4: .env.example에 새 환경변수 추가**

`d:/AILeader1/project/valuewith/co-AT/.env.example` 파일 끝에 추가:

```bash
# Google Sheets API (Phase 13 - eval app migration)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
GOOGLE_CALL_LOG_SHEET_ID=<콜센터 상담 일지 스프레드시트 ID>
GOOGLE_SERVICE_RECORD_SHEET_ID=<서비스 실적 스프레드시트 ID>
```

- [ ] **Step 5: 커밋**

```bash
git add apps/eval/package.json apps/eval/public/templates/ .env.example
git commit -m "feat: install googleapis/exceljs, add Excel templates and env vars for Phase 13"
```

---

## Task 3: Google Sheets 클라이언트 라이브러리

**Files:**
- Create: `apps/eval/lib/google-sheets.ts`

- [ ] **Step 1: 파일 생성**

```typescript
// apps/eval/lib/google-sheets.ts
import { google, sheets_v4 } from 'googleapis'

/**
 * Google Sheets API 클라이언트를 Service Account로 초기화.
 * GOOGLE_SERVICE_ACCOUNT_JSON 환경변수에 Service Account JSON 전체를 저장한다.
 */
function getAuthClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

/**
 * 지정한 스프레드시트의 시트 데이터를 2차원 배열로 반환한다.
 * @param spreadsheetId Google 스프레드시트 ID (URL의 /d/ 뒤 문자열)
 * @param range 읽을 범위 (예: "2026!A:W")
 */
export async function getSheetValues(
  spreadsheetId: string,
  range: string
): Promise<(string | number | boolean | null)[][]> {
  const auth = getAuthClient()
  const sheets = google.sheets({ version: 'v4', auth })

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  })

  return (response.data.values ?? []) as (string | number | boolean | null)[][]
}

/**
 * 스프레드시트의 모든 시트 이름 목록을 반환한다.
 */
export async function getSheetNames(spreadsheetId: string): Promise<string[]> {
  const auth = getAuthClient()
  const sheets = google.sheets({ version: 'v4', auth })

  const response = await sheets.spreadsheets.get({ spreadsheetId })
  return (response.data.sheets ?? []).map(
    (s: sheets_v4.Schema$Sheet) => s.properties?.title ?? ''
  )
}
```

- [ ] **Step 2: 빌드 확인 (타입 에러 없는지)**

```bash
cd apps/eval
pnpm tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 3: 커밋**

```bash
git add apps/eval/lib/google-sheets.ts
git commit -m "feat: add Google Sheets API client for Phase 13 migration"
```

---

## Task 4: 마이그레이션 Server Action

**Files:**
- Create: `actions/migration-actions.ts`

call_logs 타입도 requester_name, requester_contact 추가.

- [ ] **Step 1: call-log-actions.ts 타입 업데이트**

`actions/call-log-actions.ts` 파일의 `CallLog` 인터페이스에 두 필드 추가:

```typescript
// actions/call-log-actions.ts 의 CallLog 인터페이스에 추가
export interface CallLog {
  id: string
  log_date: string
  requester_name: string | null      // ← 추가
  requester_contact: string | null   // ← 추가
  requester_type: string | null
  requester_region: string | null
  target_name: string | null
  target_gender: string | null
  target_disability_type: string | null
  target_disability_severity: string | null
  target_economic_status: string | null
  q_public_benefit: boolean
  q_private_benefit: boolean
  q_device: boolean
  q_case_management: boolean
  q_other: boolean
  question_content: string | null
  answer: string | null
  staff_name: string | null
  created_at: string | null
}
```

- [ ] **Step 2: migration-actions.ts 생성**

```typescript
// actions/migration-actions.ts
"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { getSheetValues, getSheetNames } from "../../apps/eval/lib/google-sheets"

// ────────────────────────────────────────────
// 콜센터 상담 일지 동기화
// ────────────────────────────────────────────

/**
 * 콜센터 상담 일지 시트의 컬럼 인덱스 (0-based, Row 9부터 데이터)
 * Row 4~6이 헤더이고 Row 9부터 실제 데이터.
 */
const CALL_COL = {
  date: 2,           // 상담일
  requesterName: 3,  // 의뢰인 성명
  requesterRegion: 4,// 의뢰인 지역/소속
  requesterContact: 5,// 의뢰인 연락처
  requesterType: 6,  // 의뢰인 유형
  targetName: 7,     // 대상자 성명
  targetGender: 8,   // 대상자 성별
  disabilityType: 9, // 대상자 장애유형
  disabilitySeverity: 10, // 대상자 장애정도
  economicStatus: 11,// 대상자 경제상황
  qPublic: 12,       // 공적급여
  qPrivate: 13,      // 민간급여
  qDevice: 14,       // 보조기기
  qCase: 15,         // 사례연계
  qOther: 16,        // 기타
  questionContent: 17,// 질문내용
  answer: 18,        // 답변
  staffName: 19,     // 상담자
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
  // 형식: "2026-01-07" 또는 "2026-01-07 00:00:00"
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

    // 연도 시트만 처리 (숫자로만 이루어진 시트 이름)
    const yearSheets = sheetNames.filter(n => /^\d{4}$/.test(n))

    let totalAdded = 0
    let totalSkipped = 0

    for (const sheet of yearSheets) {
      const rows = await getSheetValues(sheetId, `${sheet}!A:X`)
      // 데이터는 Row 9 (0-based index 8)부터 시작
      const dataRows = rows.slice(8)

      for (const row of dataRows) {
        // 연번(index 1)이 없으면 빈 행 — 건너뜀
        if (!row[1]) continue

        const logDate = parseDate(row[CALL_COL.date])
        if (!logDate) continue

        const staffName = toStr(row[CALL_COL.staffName])
        const questionContent = toStr(row[CALL_COL.questionContent])

        // 중복 체크: log_date + staff_name + question_content
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

        await supabase.from('call_logs').insert({
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
        totalAdded++
      }
    }

    // 동기화 이력 기록
    await supabase.from('eval_sync_logs').insert({
      sheet_type: 'call_log',
      status: 'success',
      rows_added: totalAdded,
      rows_skipped: totalSkipped,
    })

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

/**
 * 서비스 실적 시트 컬럼 인덱스 (0-based, Row 10부터 데이터)
 */
const SR_COL = {
  date: 0,           // 날짜(접수일)
  seq: 1,            // 연번
  appYear: 5,        // 접수번호 년도
  appNo: 6,          // 접수번호 번호
  name: 7,           // 이름
  birthDate: 8,      // 생년월일
  region: 11,        // 거주지 시군구
  disabilityType: 12,// 장애유형
  serviceCategory: 13,// 서비스 분류
  productName: 14,   // 제품명
  itemCategory: 15,  // 품목고시
  serviceContent: 16,// 서비스 제공 내용
  serviceArea: 17,   // 서비스 영역
  isConsult: 18,     // 상담
  isAssessment: 19,  // 평가
  isTrial: 20,       // 체험지원
  isRental: 21,      // 대여
  isCustomMake: 22,  // 맞춤제작
  isGrant: 23,       // 교부사업 맞춤형 평가
  isEducation: 24,   // 교육
  isOtherBusiness: 25,// 기타사업
  isInfoProvision: 26,// 정보제공/교육훈련
  isPublicFunding: 27,// 공적급여
  isPrivateFunding: 28,// 민간급여
  isSelfPay: 29,     // 자부담
  isFundingSecured: 30,// 재원확보
  isRepair: 31,      // 점검 및 수리
  isCleaning: 32,    // 소독 및 세척
  isReuse: 33,       // 재사용
  isMonitoring: 34,  // 모니터링
  referralType: 35,  // 의뢰구분
  isPhone: 36,       // 유선
  isVisitIn: 37,     // 내방
  isVisitOut: 38,    // 방문(출장)
  isClosed: 39,      // 종결여부
  staffName: 40,     // 담당자
} as const

function parseServiceDate(v: unknown): string | null {
  if (!v) return null
  // 형식: 20260102.0 또는 "20260102"
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
  // 형식: "130812-3" → 주민번호 앞자리
  const match = s.match(/^(\d{2})(\d{2})(\d{2})/)
  if (match) {
    const yy = parseInt(match[1])
    const century = yy >= 0 && yy <= 24 ? '20' : '19'
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
    // '보조기기 서비스 상세' 시트, 데이터는 Row 10 (0-based index 9)부터
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

      // 중복 체크: received_at + name + birth_date
      const { data: existing } = await supabase
        .from('eval_service_records')
        .select('id')
        .eq('received_at', receivedAt ?? '')
        .eq('name', name)
        .maybeSingle()

      if (existing) {
        totalSkipped++
        continue
      }

      await supabase.from('eval_service_records').insert({
        received_at: receivedAt,
        application_year: row[SR_COL.appYear] ? parseInt(String(row[SR_COL.appYear])) : null,
        application_no: row[SR_COL.appNo] ? parseInt(String(row[SR_COL.appNo])) : null,
        name,
        birth_date: birthDate,
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
      })
      totalAdded++
    }

    await supabase.from('eval_sync_logs').insert({
      sheet_type: 'service_record',
      status: 'success',
      rows_added: totalAdded,
      rows_skipped: totalSkipped,
    })

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

  const [{ count: callCount }, { count: srCount }, { data: lastLogs }] = await Promise.all([
    supabase.from('call_logs').select('*', { count: 'exact', head: true }),
    supabase.from('eval_service_records').select('*', { count: 'exact', head: true }),
    supabase.from('eval_sync_logs')
      .select('sheet_type, synced_at, status')
      .eq('status', 'success')
      .order('synced_at', { ascending: false })
      .limit(10),
  ])

  const lastCallLog = lastLogs?.find(l => l.sheet_type === 'call_log')?.synced_at ?? null
  const lastSR = lastLogs?.find(l => l.sheet_type === 'service_record')?.synced_at ?? null

  return {
    success: true,
    callLogCount: callCount ?? 0,
    serviceRecordCount: srCount ?? 0,
    lastCallLogSync: lastCallLog,
    lastServiceRecordSync: lastSR,
  }
}
```

- [ ] **Step 3: 타입 체크**

```bash
cd apps/eval && pnpm tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 4: 커밋**

```bash
git add actions/migration-actions.ts actions/call-log-actions.ts
git commit -m "feat: add Google Sheets sync Server Actions for call_logs and eval_service_records"
```

---

## Task 5: 보고서 생성 Server Action

**Files:**
- Create: `actions/report-actions.ts`

- [ ] **Step 1: report-actions.ts 생성**

```typescript
// actions/report-actions.ts
"use server"

import path from 'path'
import fs from 'fs'
import ExcelJS from 'exceljs'
import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"

function getTemplatePath(filename: string): string {
  // Next.js: public/ 폴더는 프로세스 실행 위치 기준으로 접근
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

  if (error) return { success: false, error: error.message }
  if (!data?.length) return { success: false, error: '해당 기간에 데이터가 없습니다' }

  const templatePath = getTemplatePath('call_log_template.xlsx')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(templatePath)

  // 연도별로 시트에 데이터 주입 (2026, 2025, 2024 시트)
  const yearGroups: Record<string, typeof data> = {}
  for (const row of data) {
    const year = row.log_date?.slice(0, 4) ?? 'unknown'
    if (!yearGroups[year]) yearGroups[year] = []
    yearGroups[year].push(row)
  }

  for (const [year, rows] of Object.entries(yearGroups)) {
    const sheet = workbook.getWorksheet(year)
    if (!sheet) continue

    // 데이터 시작 행: Row 9
    let rowNum = 9
    for (const record of rows) {
      const r = sheet.getRow(rowNum)
      r.getCell(2).value = rowNum - 8                          // 연번
      r.getCell(3).value = record.log_date                     // 상담일
      r.getCell(4).value = record.requester_name               // 의뢰인 성명
      r.getCell(5).value = record.requester_region             // 지역/소속
      r.getCell(6).value = record.requester_contact            // 연락처
      r.getCell(7).value = record.requester_type               // 유형
      r.getCell(8).value = record.target_name                  // 대상자 성명
      r.getCell(9).value = record.target_gender                // 성별
      r.getCell(10).value = record.target_disability_type      // 장애유형
      r.getCell(11).value = record.target_disability_severity  // 장애정도
      r.getCell(12).value = record.target_economic_status      // 경제상황
      r.getCell(13).value = record.q_public_benefit ? '✓' : '' // 공적급여
      r.getCell(14).value = record.q_private_benefit ? '✓' : ''// 민간급여
      r.getCell(15).value = record.q_device ? '✓' : ''         // 보조기기
      r.getCell(16).value = record.q_case_management ? '✓' : ''// 사례연계
      r.getCell(17).value = record.q_other ? '✓' : ''          // 기타
      r.getCell(18).value = record.question_content             // 질문내용
      r.getCell(19).value = record.answer                       // 답변
      r.getCell(20).value = record.staff_name                   // 상담자
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

  if (error) return { success: false, error: error.message }
  if (!data?.length) return { success: false, error: '해당 기간에 데이터가 없습니다' }

  const templatePath = getTemplatePath('service_record_template.xlsx')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(templatePath)

  const sheet = workbook.getWorksheet('보조기기 서비스 상세')
  if (!sheet) return { success: false, error: '템플릿에서 시트를 찾을 수 없습니다' }

  // 데이터 시작 행: Row 10
  let rowNum = 10
  for (const record of data) {
    const r = sheet.getRow(rowNum)
    r.getCell(1).value = record.received_at
    r.getCell(2).value = rowNum - 9  // 연번
    r.getCell(8).value = record.name
    r.getCell(9).value = record.birth_date
    r.getCell(12).value = record.region
    r.getCell(13).value = record.disability_type
    r.getCell(14).value = record.service_category
    r.getCell(15).value = record.product_name
    r.getCell(16).value = record.item_category
    r.getCell(17).value = record.service_content
    r.getCell(18).value = record.service_area
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
    r.getCell(36).value = record.referral_type
    r.getCell(37).value = record.is_phone ? '✓' : ''
    r.getCell(38).value = record.is_visit_in ? '✓' : ''
    r.getCell(39).value = record.is_visit_out ? '✓' : ''
    r.getCell(40).value = record.is_closed ? '종결' : ''
    r.getCell(41).value = record.staff_name
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

  // 집계 데이터 조회
  const { data: srData, error: srError } = await supabase
    .from('eval_service_records')
    .select('*')
    .gte('received_at', startDate)
    .lte('received_at', endDate)

  const { data: callData, error: callError } = await supabase
    .from('call_logs')
    .select('*')
    .gte('log_date', startDate)
    .lte('log_date', endDate)

  if (srError) return { success: false, error: srError.message }
  if (callError) return { success: false, error: callError.message }

  const records = srData ?? []
  const calls = callData ?? []

  // 집계 계산
  const stats = {
    consult:      records.filter(r => r.is_consult).length,
    assessment:   records.filter(r => r.is_assessment).length,
    trial:        records.filter(r => r.is_trial).length,
    rental:       records.filter(r => r.is_rental).length,
    customMake:   records.filter(r => r.is_custom_make).length,
    grant:        records.filter(r => r.is_grant).length,
    education:    records.filter(r => r.is_education).length,
    infoProvision:records.filter(r => r.is_info_provision).length,
    repair:       records.filter(r => r.is_repair).length,
    cleaning:     records.filter(r => r.is_cleaning).length,
    reuse:        records.filter(r => r.is_reuse).length,
    monitoring:   records.filter(r => r.is_monitoring).length,
    callTotal:    calls.length,
  }

  const templatePath = getTemplatePath('business_report_template.xlsx')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(templatePath)

  // 시트 1: 전체 사업 실적 — 실적 컬럼(E열) 업데이트
  const sheet1 = workbook.getWorksheet('1.전체 사업 실적')
  if (sheet1) {
    // 셀 위치는 템플릿의 Row 4~14, 실적값은 E열(5번째)
    sheet1.getCell('E5').value = stats.callTotal    // 콜센터
    sheet1.getCell('E8').value = stats.rental       // 대여
    sheet1.getCell('E9').value = stats.customMake   // 맞춤제작
    sheet1.getCell('E10').value = stats.grant       // 교부사업 맞춤형 평가
    sheet1.getCell('E11').value = stats.cleaning    // 소독 및 세척
    sheet1.getCell('E12').value = stats.repair      // 점검 및 수리
    sheet1.getCell('E13').value = stats.reuse       // 재사용
  }

  // 시트 6: 대여 현황 — rental인 record 목록
  const rentalRecords = records.filter(r => r.is_rental)
  const sheet6 = workbook.getWorksheet('6.대여 현황 관리(대기자 등)')
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

  // 시트 7: 제작 서비스 현황 — custom_make인 record 목록
  const makeRecords = records.filter(r => r.is_custom_make)
  const sheet7 = workbook.getWorksheet('7.제작 서비스 현황 관리')
  if (sheet7 && makeRecords.length > 0) {
    let rowNum = 3
    for (const rec of makeRecords) {
      const r = sheet7.getRow(rowNum)
      r.getCell(2).value = rec.name
      r.getCell(3).value = rec.product_name
      r.getCell(4).value = rec.product_name
      r.getCell(7).value = rec.received_at
      r.commit()
      rowNum++
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const filename = `사업_실적보고_${params.year}년.xlsx`
  return { success: true, buffer: Array.from(new Uint8Array(buffer)), filename }
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd apps/eval && pnpm tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 3: 커밋**

```bash
git add actions/report-actions.ts
git commit -m "feat: add Excel report generation Server Actions (call log, service record, business report)"
```

---

## Task 6: 동기화 UI 페이지

**Files:**
- Create: `apps/eval/app/migration/page.tsx`
- Create: `apps/eval/components/eval/SyncButton.tsx`

- [ ] **Step 1: SyncButton 클라이언트 컴포넌트 생성**

```typescript
// apps/eval/components/eval/SyncButton.tsx
'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

interface SyncButtonProps {
  label: string
  action: () => Promise<{ success: boolean; rowsAdded: number; rowsSkipped: number; error?: string }>
  onComplete: () => void
}

export function SyncButton({ label, action, onComplete }: SyncButtonProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setResult(null)
    try {
      const res = await action()
      if (res.success) {
        setResult(`완료: ${res.rowsAdded}건 추가, ${res.rowsSkipped}건 중복 건너뜀`)
        onComplete()
      } else {
        setResult(`오류: ${res.error}`)
      }
    } catch (e) {
      setResult(`오류: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? '동기화 중...' : label}
      </button>
      {result && (
        <p className={`text-sm ${result.startsWith('오류') ? 'text-red-600' : 'text-green-600'}`}>
          {result}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: migration/page.tsx 생성**

```typescript
// apps/eval/app/migration/page.tsx
import { getSyncStats, getSyncLogs, syncCallLogs, syncServiceRecords } from '@/actions/migration-actions'
import { SyncButton } from '@/eval/components/eval/SyncButton'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
}

export default async function MigrationPage() {
  const [statsResult, logsResult] = await Promise.all([
    getSyncStats(),
    getSyncLogs(20),
  ])

  const stats = statsResult.success ? statsResult : null
  const logs = logsResult.success ? logsResult.logs ?? [] : []

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Google Sheets 동기화</h1>
      <p className="text-sm text-gray-500 mb-8">
        구글 스프레드시트의 데이터를 Supabase로 가져옵니다. 중복 데이터는 자동으로 건너뜁니다.
      </p>

      {/* 동기화 카드 2개 */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        {/* 콜센터 상담 일지 */}
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-base font-semibold text-gray-900 mb-1">콜센터 상담 일지</h2>
          <p className="text-sm text-gray-500 mb-1">
            총 <span className="font-medium text-gray-900">{stats?.callLogCount ?? '—'}건</span>
          </p>
          <p className="text-xs text-gray-400 mb-4">
            마지막 동기화: {formatDate(stats?.lastCallLogSync)}
          </p>
          <SyncButton
            label="동기화 실행"
            action={syncCallLogs}
            onComplete={() => {}}
          />
        </div>

        {/* 서비스 실적 */}
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-base font-semibold text-gray-900 mb-1">서비스 실적</h2>
          <p className="text-sm text-gray-500 mb-1">
            총 <span className="font-medium text-gray-900">{stats?.serviceRecordCount ?? '—'}건</span>
          </p>
          <p className="text-xs text-gray-400 mb-4">
            마지막 동기화: {formatDate(stats?.lastServiceRecordSync)}
          </p>
          <SyncButton
            label="동기화 실행"
            action={syncServiceRecords}
            onComplete={() => {}}
          />
        </div>
      </div>

      {/* 이력 테이블 */}
      <h2 className="text-base font-semibold text-gray-900 mb-3">최근 동기화 이력</h2>
      {logs.length === 0 ? (
        <p className="text-sm text-gray-500">동기화 이력이 없습니다.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">일시</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">유형</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">결과</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">추가</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">건너뜀</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{formatDate(log.synced_at)}</td>
                  <td className="px-4 py-3">
                    {log.sheet_type === 'call_log' ? '콜센터 상담' : '서비스 실적'}
                  </td>
                  <td className="px-4 py-3">
                    {log.status === 'success' ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" /> 성공
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600" title={log.error_msg ?? ''}>
                        <XCircle className="h-4 w-4" /> 오류
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{log.rows_added}건</td>
                  <td className="px-4 py-3 text-right text-gray-400">{log.rows_skipped}건</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 타입 체크**

```bash
cd apps/eval && pnpm tsc --noEmit
```

- [ ] **Step 4: 커밋**

```bash
git add apps/eval/app/migration/ apps/eval/components/eval/SyncButton.tsx
git commit -m "feat: add Google Sheets sync UI page (/migration)"
```

---

## Task 7: 보고서 출력 UI 페이지

**Files:**
- Create: `apps/eval/app/reports/page.tsx`
- Create: `apps/eval/components/eval/DownloadReportButton.tsx`

- [ ] **Step 1: DownloadReportButton 클라이언트 컴포넌트 생성**

```typescript
// apps/eval/components/eval/DownloadReportButton.tsx
'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'

interface DownloadReportButtonProps {
  label: string
  action: () => Promise<{ success: boolean; buffer?: number[]; filename?: string; error?: string }>
}

export function DownloadReportButton({ label, action }: DownloadReportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const result = await action()
      if (!result.success || !result.buffer || !result.filename) {
        setError(result.error ?? '알 수 없는 오류')
        return
      }
      // Buffer → Blob → 다운로드
      const blob = new Blob([new Uint8Array(result.buffer)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="h-4 w-4" />
        {loading ? '생성 중...' : label}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: reports/page.tsx 생성**

```typescript
// apps/eval/app/reports/page.tsx
'use client'

import { useState } from 'react'
import { DownloadReportButton } from '@/eval/components/eval/DownloadReportButton'
import {
  generateCallLogReport,
  generateServiceRecordReport,
  generateBusinessReport,
} from '@/actions/report-actions'

const currentYear = new Date().getFullYear()

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`)
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`)
  const [year, setYear] = useState(currentYear)

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">보고서 출력</h1>
      <p className="text-sm text-gray-500 mb-8">
        Supabase에 저장된 데이터를 중앙 보고 양식 엑셀로 다운로드합니다.
      </p>

      {/* 기간 선택 */}
      <div className="flex items-end gap-4 mb-8 p-4 bg-gray-50 rounded-lg border">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">시작일</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">종료일</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">연도 (사업 실적)</label>
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-md text-sm focus:outline-none"
          >
            {[2026, 2025, 2024].map(y => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        </div>
      </div>

      {/* 보고서 카드 3개 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-5 bg-white">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">콜센터 상담 일지</h2>
          <p className="text-xs text-gray-500 mb-4">전화 상담 기록 원본 양식</p>
          <DownloadReportButton
            label="다운로드"
            action={() => generateCallLogReport({ startDate, endDate })}
          />
        </div>

        <div className="border rounded-lg p-5 bg-white">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">서비스 실적</h2>
          <p className="text-xs text-gray-500 mb-4">보조기기 서비스 상세 목록</p>
          <DownloadReportButton
            label="다운로드"
            action={() => generateServiceRecordReport({ startDate, endDate })}
          />
        </div>

        <div className="border rounded-lg p-5 bg-white">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">사업 실적보고 양식</h2>
          <p className="text-xs text-gray-500 mb-4">7개 시트 집계 보고서</p>
          <DownloadReportButton
            label="다운로드"
            action={() => generateBusinessReport({ year })}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 타입 체크**

```bash
cd apps/eval && pnpm tsc --noEmit
```

- [ ] **Step 4: 커밋**

```bash
git add apps/eval/app/reports/ apps/eval/components/eval/DownloadReportButton.tsx
git commit -m "feat: add report download UI page (/reports) with 3 Excel export types"
```

---

## Task 8: 사이드바 메뉴 추가

**Files:**
- Modify: `apps/eval/components/layout/EvalSidebar.tsx`

- [ ] **Step 1: 사이드바에 메뉴 2개 추가**

`apps/eval/components/layout/EvalSidebar.tsx` 의 `NAV_ITEMS`를 다음으로 교체:

```typescript
import { Users, BarChart3, LogOut, Phone, RefreshCw, FileDown } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',           label: '대시보드',       icon: BarChart3 },
  { href: '/clients',    label: '클라이언트',      icon: Users },
  { href: '/call-logs',  label: '콜센터 상담',     icon: Phone },
  { href: '/migration',  label: 'Sheets 동기화',  icon: RefreshCw },
  { href: '/reports',    label: '보고서 출력',     icon: FileDown },
] as const
```

- [ ] **Step 2: 빌드 확인**

```bash
cd apps/eval && pnpm build
```

Expected: Build succeeded. No errors.

- [ ] **Step 3: 커밋**

```bash
git add apps/eval/components/layout/EvalSidebar.tsx
git commit -m "feat: add migration and reports menu items to EvalSidebar"
```

---

## Task 9: 환경변수 설정 및 동작 검증

- [ ] **Step 1: Google Cloud Console 설정**

  1. [Google Cloud Console](https://console.cloud.google.com/) → 프로젝트 선택 또는 신규 생성
  2. **API 및 서비스** → **사용 설정된 API** → **Google Sheets API** 활성화
  3. **IAM 및 관리자** → **서비스 계정** → **서비스 계정 만들기**
  4. 서비스 계정 생성 후 **키 추가** → **JSON** 다운로드
  5. 다운로드한 JSON 파일 내용 전체를 `GOOGLE_SERVICE_ACCOUNT_JSON` 환경변수에 설정

- [ ] **Step 2: 스프레드시트에 서비스 계정 공유**

  1. 콜센터 상담 일지 구글 스프레드시트 열기 → **공유** → 서비스 계정 이메일 추가 (**뷰어** 권한)
  2. 서비스 실적 스프레드시트 동일하게 공유
  3. 각 스프레드시트 URL에서 `/d/` 와 `/edit` 사이의 ID 복사 → 환경변수에 설정

- [ ] **Step 3: 로컬 .env.local 설정**

`apps/eval/.env.local` (또는 monorepo root `.env.local`) 에 아래 추가:

```
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...전체JSON..."}
GOOGLE_CALL_LOG_SHEET_ID=1AbCdEfGh...
GOOGLE_SERVICE_RECORD_SHEET_ID=1XyZ...
```

- [ ] **Step 4: 개발 서버 실행 및 동기화 테스트**

```bash
cd apps/eval && pnpm dev
```

브라우저에서 `http://localhost:3002/migration` 접속.
- 콜센터 상담 일지 "동기화 실행" 클릭 → "완료: N건 추가" 메시지 확인
- Supabase Dashboard → `call_logs` 테이블에 데이터 확인

- [ ] **Step 5: 보고서 출력 테스트**

`http://localhost:3002/reports` 접속.
- 기간 설정 후 "콜센터 상담 일지 다운로드" 클릭 → xlsx 파일 다운로드 확인
- 다운로드된 파일을 Excel로 열어 데이터가 올바른 위치에 있는지 확인

- [ ] **Step 6: 서비스 실적 동기화 테스트**

`/migration` 에서 "서비스 실적 동기화 실행" 클릭 → 완료 확인
`/reports` 에서 "서비스 실적 다운로드" → 파일 확인

- [ ] **Step 7: 최종 커밋**

```bash
git add .
git commit -m "feat: Phase 13 complete — Google Sheets migration and Excel report automation"
```

---

## 셀 위치 검증 노트

`generateBusinessReport` 의 시트1 셀 위치(`E5`, `E8` 등)는 템플릿 파일의 실제 구조에 따라 다를 수 있다. 다운로드 후 값이 엉뚱한 셀에 들어간 경우, `apps/eval/public/templates/business_report_template.xlsx`를 직접 열어 각 사업 항목의 실적값이 있는 셀 주소를 확인하고 `report-actions.ts`의 셀 참조를 수정한다.

예시 수정 방법:
```typescript
// 셀 주소를 직접 지정 (A1 표기법)
sheet1.getCell('E5').value = stats.callTotal
// 또는 행/열 번호로 지정
sheet1.getRow(5).getCell(5).value = stats.callTotal
```
