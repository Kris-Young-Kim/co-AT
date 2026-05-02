# Phase 3: apps/stats — 성과 KPI 대시보드 + Excel 실적 보고 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 보조공학사가 ① eval 앱에서 콜센터 상담 일지를 입력하고, ② stats 앱에서 연도별 목표 대비 실적을 시각화하며, ③ 중앙 보고용 Excel 파일(보조기기센터 사업 실적 보고 양식)을 내보낼 수 있는 시스템을 구축한다.

**Architecture:**
- **eval 추가**: `call_logs` 테이블 + 상담 일지 입력 UI (eval 앱 내 새 섹션)
- **stats 신규**: `annual_targets` 테이블(연도별 목표) + 목표 vs 실적 대시보드 + xlsx 내보내기
- **applications 확장**: `domain` 컬럼 추가(WC/ADL/S/SP/EC/CA/L/AAC/AM) — 서비스 영역 분류

**Data Sources (existing):**
- `applications` table — 서비스 신청 (대여/맞춤제작/교부평가/소독/수리/재사용 등)
- `stats-actions.ts` — `getStatsSummary`, `getMonthlyStats`, `getYearlyStats`, `getBusinessDetailStats`

**New DB tables:** `call_logs`, `annual_targets`
**Modified:** `applications` + `domain` column

**Excel export:** `xlsx` (SheetJS) — server action으로 버퍼 생성 → 클라이언트 다운로드

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase, Clerk v6, Tailwind CSS, xlsx

---

## File Map

```
-- DB 마이그레이션 --
migrations/034_create_call_logs.sql
migrations/035_create_annual_targets.sql
migrations/036_add_domain_to_applications.sql

-- eval 앱 추가 --
actions/call-log-actions.ts               ← 신규: CRUD for call_logs
apps/eval/app/call-logs/
  page.tsx                                ← 상담 일지 목록
  new/page.tsx                            ← 상담 일지 등록
  [id]/edit/page.tsx                      ← 상담 일지 수정
apps/eval/components/eval/
  CallLogForm.tsx                         ← 등록/수정 폼
  CallLogTable.tsx                        ← 목록 테이블
apps/eval/components/layout/
  EvalSidebar.tsx                         ← 수정: '콜센터 상담' 메뉴 추가

-- stats 앱 (신규) --
apps/stats/tsconfig.json                  ← 수정
apps/stats/next.config.mjs                ← 수정
actions/annual-target-actions.ts          ← 신규: CRUD for annual_targets
actions/excel-export-actions.ts           ← 신규: xlsx 생성 server action
apps/stats/app/
  layout.tsx                              ← StatsSidebar 레이아웃
  globals.css                             ← print CSS
  page.tsx                                ← KPI 대시보드 (목표 vs 실적)
  targets/page.tsx                        ← 연도별 목표 설정
  monthly/page.tsx                        ← 월별 현황
  business/page.tsx                       ← 사업별·영역별 현황
  yearly/page.tsx                         ← 연도별 추이
apps/stats/components/
  layout/StatsSidebar.tsx
  stats/
    YearSelector.tsx
    AchievementTable.tsx                  ← 목표/실적/달성률 테이블
    MonthlyTable.tsx
    BusinessDomainTable.tsx               ← 사업별 × WC/ADL 영역 교차 테이블
    YearlyTable.tsx
    ExportButton.tsx                      ← xlsx 다운로드 버튼 (client)
  targets/
    TargetForm.tsx                        ← 목표값 입력 폼 (client)
```

---

## Task 1: DB 마이그레이션 3개

**Files:**
- Create: `migrations/034_create_call_logs.sql`
- Create: `migrations/035_create_annual_targets.sql`
- Create: `migrations/036_add_domain_to_applications.sql`

- [ ] **Step 1: Create migrations/034_create_call_logs.sql**

```sql
-- migrations/034_create_call_logs.sql
-- 콜센터 상담 일지 테이블

CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 정보
  log_date DATE NOT NULL,

  -- 의뢰인 정보
  requester_type TEXT CHECK (requester_type IN (
    '장애 당사자', '보호자 및 지인', '유관기관 종사자',
    '시군구(및 읍면동) 담당자', '교육기관 종사자', '기타'
  )),
  requester_region TEXT,

  -- 대상자 정보
  target_name TEXT,
  target_gender TEXT CHECK (target_gender IN ('남', '여', NULL)),
  target_disability_type TEXT,
  target_disability_severity TEXT CHECK (target_disability_severity IN ('심한', '심하지 않은', NULL)),
  target_economic_status TEXT,

  -- 질문 유형 (다중 선택)
  q_public_benefit    BOOLEAN NOT NULL DEFAULT false,  -- 공적급여
  q_private_benefit   BOOLEAN NOT NULL DEFAULT false,  -- 민간급여
  q_device            BOOLEAN NOT NULL DEFAULT false,  -- 보조기기
  q_case_management   BOOLEAN NOT NULL DEFAULT false,  -- 사례연계
  q_other             BOOLEAN NOT NULL DEFAULT false,  -- 기타

  -- 상담 내용
  question_content TEXT,
  answer TEXT,

  -- 담당자
  staff_name TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_logs_log_date ON call_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_call_logs_requester_type ON call_logs(requester_type);

ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can manage call_logs"
  ON call_logs FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE call_logs IS '콜센터 상담 일지 — 중앙 보고용';
```

- [ ] **Step 2: Create migrations/035_create_annual_targets.sql**

```sql
-- migrations/035_create_annual_targets.sql
-- 연도별 사업 목표값 테이블

CREATE TABLE IF NOT EXISTS annual_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL UNIQUE,

  -- 보조기기 상담 및 정보제공
  consultation      INTEGER NOT NULL DEFAULT 0,   -- 보조기기 상담(연인원)
  -- 콜센터는 '상시'이므로 목표 없음

  -- 체험지원
  experience        INTEGER NOT NULL DEFAULT 0,   -- 보조기기 사용 체험

  -- 맞춤형 지원사업
  rental            INTEGER NOT NULL DEFAULT 0,   -- 대여
  custom_make       INTEGER NOT NULL DEFAULT 0,   -- 맞춤 제작 지원
  -- 교부사업 맞춤형 평가지원은 '상시'

  -- 사후관리 지원사업
  cleaning          INTEGER NOT NULL DEFAULT 0,   -- 소독 및 세척
  repair            INTEGER NOT NULL DEFAULT 0,   -- 점검 및 수리
  reuse             INTEGER NOT NULL DEFAULT 0,   -- 재사용 지원

  -- 교육 및 홍보사업
  professional_edu  INTEGER NOT NULL DEFAULT 0,   -- 전문인력 교육 등
  promotion         INTEGER NOT NULL DEFAULT 0,   -- 홍보

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE annual_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can manage annual_targets"
  ON annual_targets FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2026년 초기 목표값 삽입 (강원 기준)
INSERT INTO annual_targets (
  year, consultation, experience,
  rental, custom_make,
  cleaning, repair, reuse,
  professional_edu, promotion
) VALUES (
  2026, 600, 30,
  77, 100,
  84, 15, 9,
  10, 22
) ON CONFLICT (year) DO NOTHING;

COMMENT ON TABLE annual_targets IS '연도별 사업 목표값 — 중앙 보고 달성률 계산용';
```

- [ ] **Step 3: Create migrations/036_add_domain_to_applications.sql**

```sql
-- migrations/036_add_domain_to_applications.sql
-- applications 테이블에 서비스 영역 컬럼 추가
-- 영역: WC(휠체어), ADL(일상생활), S(보행), SP(자세유지), EC(환경조절),
--       CA(의사소통), L(학습), AAC(보완대체의사소통), AM(장기요양)

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS domain TEXT
    CHECK (domain IN ('WC','ADL','S','SP','EC','CA','L','AAC','AM'));

CREATE INDEX IF NOT EXISTS idx_applications_domain ON applications(domain);

COMMENT ON COLUMN applications.domain IS
  '서비스 영역: WC/ADL/S/SP/EC/CA/L/AAC/AM — 중앙 보고 영역별 집계용';
```

- [ ] **Step 4: Apply migrations (Supabase dashboard SQL editor에서 실행)**

3개 파일을 순서대로 실행한다.

- [ ] **Step 5: Commit**

```bash
cd D:/AILeader1/project/valuewith/co-AT
git add migrations/034_create_call_logs.sql \
        migrations/035_create_annual_targets.sql \
        migrations/036_add_domain_to_applications.sql
git commit -m "feat(db): add call_logs, annual_targets tables and domain field on applications"
```

---

## Task 2: call-log-actions.ts + annual-target-actions.ts

**Files:**
- Create: `actions/call-log-actions.ts`
- Create: `actions/annual-target-actions.ts`

- [ ] **Step 1: Create actions/call-log-actions.ts**

```typescript
"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { revalidatePath } from "next/cache"

export interface CallLog {
  id: string
  log_date: string
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

export type CreateCallLogInput = Omit<CallLog, 'id' | 'created_at'>

export async function getCallLogs(params?: {
  year?: number
  month?: number
  limit?: number
  offset?: number
}): Promise<{ success: boolean; logs?: CallLog[]; total?: number; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  let query = supabase.from('call_logs').select('*', { count: 'exact' })

  if (params?.year) {
    query = query
      .gte('log_date', `${params.year}-01-01`)
      .lte('log_date', `${params.year}-12-31`)
  }
  if (params?.month && params?.year) {
    const mm = String(params.month).padStart(2, '0')
    const lastDay = new Date(params.year, params.month, 0).getDate()
    query = query
      .gte('log_date', `${params.year}-${mm}-01`)
      .lte('log_date', `${params.year}-${mm}-${lastDay}`)
  }

  query = query.order('log_date', { ascending: false })

  const limit = params?.limit ?? 100
  const offset = params?.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) return { success: false, error: error.message }
  return { success: true, logs: (data ?? []) as CallLog[], total: count ?? 0 }
}

export async function getCallLogById(id: string): Promise<{ success: boolean; log?: CallLog; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase.from('call_logs').select('*').eq('id', id).single()
  if (error) return { success: false, error: error.message }
  return { success: true, log: data as CallLog }
}

export async function createCallLog(
  input: CreateCallLogInput
): Promise<{ success: boolean; log?: CallLog; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('call_logs')
    .insert(input)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/call-logs')
  return { success: true, log: data as CallLog }
}

export async function updateCallLog(
  id: string,
  input: Partial<CreateCallLogInput>
): Promise<{ success: boolean; log?: CallLog; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('call_logs')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/call-logs')
  return { success: true, log: data as CallLog }
}

export async function deleteCallLog(id: string): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { error } = await supabase.from('call_logs').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/call-logs')
  return { success: true }
}

/** 월별 콜센터 건수 집계 (stats용) */
export async function getCallLogMonthlyCount(year: number): Promise<{
  success: boolean
  monthly?: { month: number; count: number }[]
  total?: number
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('call_logs')
    .select('log_date')
    .gte('log_date', `${year}-01-01`)
    .lte('log_date', `${year}-12-31`)

  if (error) return { success: false, error: error.message }

  const counts = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0 }))
  for (const row of data ?? []) {
    const m = new Date(row.log_date).getMonth()
    counts[m].count++
  }
  const total = counts.reduce((s, c) => s + c.count, 0)
  return { success: true, monthly: counts, total }
}
```

- [ ] **Step 2: Create actions/annual-target-actions.ts**

```typescript
"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { revalidatePath } from "next/cache"

export interface AnnualTarget {
  id: string
  year: number
  consultation: number
  experience: number
  rental: number
  custom_make: number
  cleaning: number
  repair: number
  reuse: number
  professional_edu: number
  promotion: number
  created_at: string | null
  updated_at: string | null
}

export type UpsertTargetInput = Omit<AnnualTarget, 'id' | 'created_at' | 'updated_at'>

export async function getAnnualTarget(year: number): Promise<{
  success: boolean
  target?: AnnualTarget
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('annual_targets')
    .select('*')
    .eq('year', year)
    .maybeSingle()

  if (error) return { success: false, error: error.message }
  return { success: true, target: data as AnnualTarget | undefined }
}

export async function upsertAnnualTarget(
  input: UpsertTargetInput
): Promise<{ success: boolean; target?: AnnualTarget; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('annual_targets')
    .upsert({ ...input, updated_at: new Date().toISOString() }, { onConflict: 'year' })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/targets')
  return { success: true, target: data as AnnualTarget }
}
```

- [ ] **Step 3: Commit**

```bash
git add actions/call-log-actions.ts actions/annual-target-actions.ts
git commit -m "feat(actions): add call-log and annual-target server actions"
```

---

## Task 3: eval — 콜센터 상담 일지 UI

**Files:**
- Create: `apps/eval/components/eval/CallLogForm.tsx`
- Create: `apps/eval/components/eval/CallLogTable.tsx`
- Create: `apps/eval/app/call-logs/page.tsx`
- Create: `apps/eval/app/call-logs/new/page.tsx`
- Create: `apps/eval/app/call-logs/[id]/edit/page.tsx`
- Modify: `apps/eval/components/layout/EvalSidebar.tsx`

- [ ] **Step 1: Create CallLogForm.tsx**

```typescript
// apps/eval/components/eval/CallLogForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CallLog, CreateCallLogInput } from '@/actions/call-log-actions'

interface CallLogFormProps {
  defaultValues?: Partial<CallLog>
  onSubmit: (data: CreateCallLogInput) => Promise<{ success: boolean; error?: string }>
  submitLabel?: string
}

const REQUESTER_TYPES = [
  '장애 당사자', '보호자 및 지인', '유관기관 종사자',
  '시군구(및 읍면동) 담당자', '교육기관 종사자', '기타',
]

const Q_TYPES = [
  { key: 'q_public_benefit', label: '공적급여' },
  { key: 'q_private_benefit', label: '민간급여' },
  { key: 'q_device', label: '보조기기' },
  { key: 'q_case_management', label: '사례연계' },
  { key: 'q_other', label: '기타' },
] as const

export function CallLogForm({ defaultValues, onSubmit, submitLabel = '저장' }: CallLogFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qTypes, setQTypes] = useState({
    q_public_benefit: defaultValues?.q_public_benefit ?? false,
    q_private_benefit: defaultValues?.q_private_benefit ?? false,
    q_device: defaultValues?.q_device ?? false,
    q_case_management: defaultValues?.q_case_management ?? false,
    q_other: defaultValues?.q_other ?? false,
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)

    const data: CreateCallLogInput = {
      log_date: fd.get('log_date') as string,
      requester_type: (fd.get('requester_type') as string) || null,
      requester_region: (fd.get('requester_region') as string) || null,
      target_name: (fd.get('target_name') as string) || null,
      target_gender: (fd.get('target_gender') as string) || null,
      target_disability_type: (fd.get('target_disability_type') as string) || null,
      target_disability_severity: (fd.get('target_disability_severity') as string) || null,
      target_economic_status: (fd.get('target_economic_status') as string) || null,
      ...qTypes,
      question_content: (fd.get('question_content') as string) || null,
      answer: (fd.get('answer') as string) || null,
      staff_name: (fd.get('staff_name') as string) || null,
    }

    const result = await onSubmit(data)
    setLoading(false)
    if (!result.success) { setError(result.error ?? '저장 실패'); return }
    router.push('/call-logs')
    router.refresh()
  }

  const textField = (name: string, label: string, required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        name={name}
        type="text"
        defaultValue={(defaultValues as Record<string, unknown>)?.[name] as string ?? ''}
        required={required}
        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* 상담일 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          상담일 <span className="text-red-500">*</span>
        </label>
        <input
          name="log_date"
          type="date"
          defaultValue={defaultValues?.log_date ?? ''}
          required
          className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 의뢰인 정보 */}
      <fieldset className="border rounded-lg p-4 space-y-3">
        <legend className="text-sm font-semibold text-gray-700 px-1">의뢰인 정보</legend>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">의뢰인 유형</label>
          <select
            name="requester_type"
            defaultValue={defaultValues?.requester_type ?? ''}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
          >
            <option value="">선택</option>
            {REQUESTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {textField('requester_region', '지역 또는 소속')}
      </fieldset>

      {/* 대상자 정보 */}
      <fieldset className="border rounded-lg p-4 space-y-3">
        <legend className="text-sm font-semibold text-gray-700 px-1">대상자 정보</legend>
        <div className="grid grid-cols-2 gap-3">
          {textField('target_name', '성명')}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
            <select
              name="target_gender"
              defaultValue={defaultValues?.target_gender ?? ''}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
            >
              <option value="">선택</option>
              <option value="남">남</option>
              <option value="여">여</option>
            </select>
          </div>
        </div>
        {textField('target_disability_type', '장애유형')}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">장애정도</label>
          <select
            name="target_disability_severity"
            defaultValue={defaultValues?.target_disability_severity ?? ''}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
          >
            <option value="">선택</option>
            <option value="심한">심한</option>
            <option value="심하지 않은">심하지 않은</option>
          </select>
        </div>
        {textField('target_economic_status', '경제상황')}
      </fieldset>

      {/* 질문 유형 */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">질문 유형 (복수 선택 가능)</p>
        <div className="flex flex-wrap gap-3">
          {Q_TYPES.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={qTypes[key]}
                onChange={e => setQTypes(prev => ({ ...prev, [key]: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 질문내용 + 답변 */}
      {(['question_content', 'answer'] as const).map(field => (
        <div key={field}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field === 'question_content' ? '질문 내용' : '답변(조치사항)'}
          </label>
          <textarea
            name={field}
            rows={3}
            defaultValue={(defaultValues?.[field] as string) ?? ''}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      ))}

      {textField('staff_name', '상담자')}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '저장 중...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 border text-sm font-medium rounded-md hover:bg-gray-50"
        >
          취소
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create CallLogTable.tsx**

```typescript
// apps/eval/components/eval/CallLogTable.tsx
import type { CallLog } from '@/actions/call-log-actions'
import Link from 'next/link'

interface CallLogTableProps {
  logs: CallLog[]
}

const Q_LABELS: (keyof CallLog)[] = [
  'q_public_benefit', 'q_private_benefit', 'q_device', 'q_case_management', 'q_other'
]
const Q_NAMES = ['공적급여', '민간급여', '보조기기', '사례연계', '기타']

function getQTypes(log: CallLog): string {
  return Q_LABELS
    .map((k, i) => (log[k] ? Q_NAMES[i] : null))
    .filter(Boolean)
    .join(', ') || '—'
}

export function CallLogTable({ logs }: CallLogTableProps) {
  if (logs.length === 0) {
    return <div className="text-center py-12 text-gray-500">상담 일지가 없습니다.</div>
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-700">상담일</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">의뢰인 유형</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">대상자</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">질문 유형</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">담당자</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {logs.map(log => (
            <tr key={log.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">{log.log_date}</td>
              <td className="px-4 py-3 text-gray-600">{log.requester_type ?? '—'}</td>
              <td className="px-4 py-3">
                {log.target_name ?? '—'}
                {log.target_disability_type && (
                  <span className="text-xs text-gray-400 ml-1">({log.target_disability_type})</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs">{getQTypes(log)}</td>
              <td className="px-4 py-3 text-gray-600">{log.staff_name ?? '—'}</td>
              <td className="px-4 py-3">
                <Link href={`/call-logs/${log.id}/edit`} className="text-blue-600 hover:underline">
                  수정
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Create call-logs pages**

```typescript
// apps/eval/app/call-logs/page.tsx
import { getCallLogs } from '@/actions/call-log-actions'
import { CallLogTable } from '@/eval/components/eval/CallLogTable'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface CallLogsPageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function CallLogsPage({ searchParams }: CallLogsPageProps) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))

  const result = await getCallLogs({ year, limit: 200 })
  const logs = result.success ? result.logs ?? [] : []
  const total = result.success ? result.total ?? 0 : 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">콜센터 상담 일지</h1>
          <p className="text-sm text-gray-500 mt-1">{year}년 총 {total}건</p>
        </div>
        <Link
          href="/call-logs/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          상담 등록
        </Link>
      </div>

      {/* 연도 필터 */}
      <form method="GET" className="flex gap-3 mb-6">
        <select
          name="year"
          defaultValue={year}
          className="px-3 py-2 border rounded-md text-sm focus:outline-none"
        >
          {[2026, 2025, 2024, 2023].map(y => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900"
        >
          조회
        </button>
      </form>

      <CallLogTable logs={logs} />
    </div>
  )
}
```

```typescript
// apps/eval/app/call-logs/new/page.tsx
import { createCallLog } from '@/actions/call-log-actions'
import { CallLogForm } from '@/eval/components/eval/CallLogForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CallLogNewPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/call-logs" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">콜센터 상담 등록</h1>
      </div>
      <CallLogForm onSubmit={createCallLog} submitLabel="등록" />
    </div>
  )
}
```

```typescript
// apps/eval/app/call-logs/[id]/edit/page.tsx
import { getCallLogById, updateCallLog } from '@/actions/call-log-actions'
import { CallLogForm } from '@/eval/components/eval/CallLogForm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface EditPageProps {
  params: Promise<{ id: string }>
}

export default async function CallLogEditPage({ params }: EditPageProps) {
  const { id } = await params
  const result = await getCallLogById(id)
  if (!result.success || !result.log) notFound()

  async function handleUpdate(data: Parameters<typeof updateCallLog>[1]) {
    'use server'
    return updateCallLog(id, data)
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/call-logs" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">상담 일지 수정</h1>
      </div>
      <CallLogForm
        defaultValues={result.log}
        onSubmit={handleUpdate}
        submitLabel="수정 저장"
      />
    </div>
  )
}
```

- [ ] **Step 4: Add '콜센터 상담' to EvalSidebar**

Read `apps/eval/components/layout/EvalSidebar.tsx` then add menu item:

```typescript
// navItems 배열에 추가
{ href: '/call-logs', label: '콜센터 상담', icon: Phone },
```

`lucide-react`에서 `Phone` import 추가:
```typescript
import { Users, ClipboardList, Phone } from 'lucide-react'
```

- [ ] **Step 5: Commit**

```bash
git add apps/eval/components/eval/CallLogForm.tsx \
  apps/eval/components/eval/CallLogTable.tsx \
  "apps/eval/app/call-logs/page.tsx" \
  "apps/eval/app/call-logs/new/page.tsx" \
  "apps/eval/app/call-logs/[id]/edit/page.tsx" \
  apps/eval/components/layout/EvalSidebar.tsx
git commit -m "feat(eval): add call center log CRUD (콜센터 상담 일지)"
```

---

## Task 4: stats 앱 — tsconfig + Layout

**Files:**
- Modify: `apps/stats/tsconfig.json`
- Modify: `apps/stats/next.config.mjs`
- Create: `apps/stats/components/layout/StatsSidebar.tsx`
- Modify: `apps/stats/app/layout.tsx`
- Modify: `apps/stats/app/globals.css`

- [ ] **Step 1: Update apps/stats/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/stats/*": ["./*"],
      "@/components/ui/*": ["../../packages/ui/ui/*"],
      "@/lib/supabase/*": ["../../packages/lib/supabase/*"],
      "@/lib/validators": ["../../packages/lib/validators.ts"],
      "@/types/*": ["../../packages/lib/types/*"],
      "@/*": ["../../*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 2: Read and update apps/stats/next.config.mjs — add externalDir**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { externalDir: true },
  transpilePackages: ['@co-at/ui', '@co-at/lib', '@co-at/auth', '@co-at/types'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
}
export default nextConfig
```

- [ ] **Step 3: Create StatsSidebar.tsx**

```typescript
// apps/stats/components/layout/StatsSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Briefcase, TrendingUp, Target, FileSpreadsheet } from 'lucide-react'

const navItems = [
  { href: '/', label: 'KPI 대시보드', icon: LayoutDashboard },
  { href: '/monthly', label: '월별 현황', icon: CalendarDays },
  { href: '/business', label: '사업별 현황', icon: Briefcase },
  { href: '/yearly', label: '연도별 추이', icon: TrendingUp },
  { href: '/targets', label: '목표 관리', icon: Target },
  { href: '/export', label: 'Excel 내보내기', icon: FileSpreadsheet },
]

export function StatsSidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 shrink-0 border-r bg-white h-screen sticky top-0 flex flex-col print:hidden">
      <div className="p-4 border-b">
        <h1 className="text-base font-bold text-gray-900">성과 대시보드</h1>
        <p className="text-xs text-gray-500 mt-0.5">stats.gwatc.cloud</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 4: Read and update apps/stats/app/layout.tsx**

```typescript
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { StatsSidebar } from '@/stats/components/layout/StatsSidebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'GWATC — 성과 대시보드',
  description: '보조공학센터 사업 실적 및 성과 관리',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="ko">
        <body className="bg-gray-50">
          <div className="flex min-h-screen">
            <StatsSidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}
```

- [ ] **Step 5: Read and append print CSS to apps/stats/app/globals.css**

파일 끝에 추가:
```css
@media print {
  body { background: white; }
  .print\:hidden { display: none !important; }
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/stats/tsconfig.json apps/stats/next.config.mjs \
  apps/stats/components/layout/StatsSidebar.tsx \
  apps/stats/app/layout.tsx apps/stats/app/globals.css
git commit -m "feat(stats): configure tsconfig, layout, sidebar"
```

---

## Task 5: stats — 공유 컴포넌트

**Files:**
- Create: `apps/stats/components/stats/YearSelector.tsx`
- Create: `apps/stats/components/stats/AchievementTable.tsx`
- Create: `apps/stats/components/stats/MonthlyTable.tsx`
- Create: `apps/stats/components/stats/BusinessDomainTable.tsx`
- Create: `apps/stats/components/stats/YearlyTable.tsx`

- [ ] **Step 1: Create YearSelector.tsx**

```typescript
// apps/stats/components/stats/YearSelector.tsx
'use client'

import { useRouter, usePathname } from 'next/navigation'

export function YearSelector({ currentYear, from = 2023 }: { currentYear: number; from?: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const thisYear = new Date().getFullYear()
  const years = Array.from({ length: thisYear - from + 1 }, (_, i) => thisYear - i)

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">연도</span>
      <select
        value={currentYear}
        onChange={e => router.push(`${pathname}?year=${e.target.value}`)}
        className="px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {years.map(y => <option key={y} value={y}>{y}년</option>)}
      </select>
    </div>
  )
}
```

- [ ] **Step 2: Create AchievementTable.tsx**

목표 vs 실적 vs 달성률 테이블.

```typescript
// apps/stats/components/stats/AchievementTable.tsx
import type { AnnualTarget } from '@/actions/annual-target-actions'

interface Row {
  label: string
  target: number | '상시'
  actual: number
}

interface AchievementTableProps {
  target: AnnualTarget | null
  actual: {
    consultation: number   // 보조기기 상담 연인원
    callCenter: number     // 콜센터
    experience: number
    rental: number
    customMake: number
    assessment: number     // 교부사업 평가 (상시)
    cleaning: number
    repair: number
    reuse: number
    professionalEdu: number
    promotion: number
  }
}

function rate(actual: number, target: number | '상시'): string {
  if (target === '상시') return '상시'
  if (target === 0) return '—'
  return `${Math.round((actual / target) * 100)}%`
}

export function AchievementTable({ target, actual }: AchievementTableProps) {
  const rows: Row[] = [
    { label: '보조기기 상담(연인원)', target: target?.consultation ?? 0, actual: actual.consultation },
    { label: '콜센터', target: '상시', actual: actual.callCenter },
    { label: '보조기기 사용 체험', target: target?.experience ?? 0, actual: actual.experience },
    { label: '대여', target: target?.rental ?? 0, actual: actual.rental },
    { label: '보조기기 맞춤 제작 지원', target: target?.custom_make ?? 0, actual: actual.customMake },
    { label: '교부사업 맞춤형 평가지원', target: '상시', actual: actual.assessment },
    { label: '보조기기 소독 및 세척', target: target?.cleaning ?? 0, actual: actual.cleaning },
    { label: '보조기기 점검 및 수리', target: target?.repair ?? 0, actual: actual.repair },
    { label: '보조기기 재사용 지원', target: target?.reuse ?? 0, actual: actual.reuse },
    { label: '전문인력 교육 등', target: target?.professional_edu ?? 0, actual: actual.professionalEdu },
    { label: '홍보', target: target?.promotion ?? 0, actual: actual.promotion },
  ]

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-700">사업 내용</th>
            <th className="px-4 py-3 font-medium text-gray-700 text-center">목표</th>
            <th className="px-4 py-3 font-medium text-gray-700 text-center">실적</th>
            <th className="px-4 py-3 font-medium text-gray-700 text-center">달성률</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map(row => {
            const r = rate(row.actual, row.target)
            const pct = r !== '상시' && r !== '—' ? parseInt(r) : null
            return (
              <tr key={row.label} className="hover:bg-gray-50">
                <td className="px-4 py-2.5">{row.label}</td>
                <td className="px-4 py-2.5 text-center text-gray-600">
                  {row.target === '상시' ? '상시' : row.target.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-center font-medium">{row.actual.toLocaleString()}</td>
                <td className={`px-4 py-2.5 text-center font-semibold ${
                  pct === null ? 'text-gray-400' :
                  pct >= 100 ? 'text-green-600' :
                  pct >= 70 ? 'text-blue-600' : 'text-red-500'
                }`}>
                  {r}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Create MonthlyTable.tsx**

```typescript
// apps/stats/components/stats/MonthlyTable.tsx
import type { MonthlyStats } from '@/actions/stats-actions'

export function MonthlyTable({ stats, callCenter }: {
  stats: MonthlyStats[]
  callCenter: { month: number; count: number }[]
}) {
  const ccMap = Object.fromEntries(callCenter.map(c => [c.month, c.count]))
  const totals = stats.reduce(
    (acc, s) => ({
      consultation: acc.consultation + s.consultation,
      experience: acc.experience + s.experience,
      custom: acc.custom + s.custom,
      aftercare: acc.aftercare + s.aftercare,
      education: acc.education + s.education,
      total: acc.total + s.total,
      cc: acc.cc + (ccMap[s.month] ?? 0),
    }),
    { consultation: 0, experience: 0, custom: 0, aftercare: 0, education: 0, total: 0, cc: 0 }
  )

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-3 py-3 text-center font-medium text-gray-700">월</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700">콜센터</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700">I.상담·정보</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700">II.체험</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700">III.맞춤형</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700">IV.사후관리</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700">V.교육·홍보</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700">합계</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {stats.map(s => (
            <tr key={s.month} className="hover:bg-gray-50">
              <td className="px-3 py-2.5 text-center font-medium">{s.month}월</td>
              <td className="px-3 py-2.5 text-center text-blue-700">{ccMap[s.month] ?? 0}</td>
              <td className="px-3 py-2.5 text-center">{s.consultation}</td>
              <td className="px-3 py-2.5 text-center">{s.experience}</td>
              <td className="px-3 py-2.5 text-center">{s.custom}</td>
              <td className="px-3 py-2.5 text-center">{s.aftercare}</td>
              <td className="px-3 py-2.5 text-center">{s.education}</td>
              <td className="px-3 py-2.5 text-center font-bold text-blue-700">{s.total}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t bg-gray-50 font-semibold">
          <tr>
            <td className="px-3 py-3 text-center">합계</td>
            <td className="px-3 py-3 text-center text-blue-700">{totals.cc}</td>
            <td className="px-3 py-3 text-center">{totals.consultation}</td>
            <td className="px-3 py-3 text-center">{totals.experience}</td>
            <td className="px-3 py-3 text-center">{totals.custom}</td>
            <td className="px-3 py-3 text-center">{totals.aftercare}</td>
            <td className="px-3 py-3 text-center">{totals.education}</td>
            <td className="px-3 py-3 text-center text-blue-700">{totals.total}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Create BusinessDomainTable.tsx**

사업별 × WC/ADL/… 영역 교차 집계. 영역별 실인원은 `applications.domain` 필드로 집계.

```typescript
// apps/stats/components/stats/BusinessDomainTable.tsx
const DOMAINS = ['WC','ADL','S','SP','EC','CA','L','AAC','AM'] as const
type Domain = typeof DOMAINS[number]

export interface DomainRow {
  label: string
  total: number
  byDomain: Partial<Record<Domain, number>>
  actual_persons: number  // 실인원
  extended_persons: number // 연인원
}

export function BusinessDomainTable({ rows }: { rows: DomainRow[] }) {
  if (rows.length === 0) return <p className="text-gray-500">데이터가 없습니다.</p>
  return (
    <div className="border rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-3 py-3 text-left font-medium text-gray-700 sticky left-0 bg-gray-50">사업명</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700">합계</th>
            {DOMAINS.map(d => (
              <th key={d} className="px-3 py-3 text-center font-medium text-gray-700">{d}</th>
            ))}
            <th className="px-3 py-3 text-center font-medium text-gray-700">실인원</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700">연인원</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map(row => (
            <tr key={row.label} className="hover:bg-gray-50">
              <td className="px-3 py-2.5 sticky left-0 bg-white">{row.label}</td>
              <td className="px-3 py-2.5 text-center font-bold text-blue-700">{row.total}</td>
              {DOMAINS.map(d => (
                <td key={d} className="px-3 py-2.5 text-center">{row.byDomain[d] ?? 0}</td>
              ))}
              <td className="px-3 py-2.5 text-center">{row.actual_persons}</td>
              <td className="px-3 py-2.5 text-center">{row.extended_persons}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 5: Create YearlyTable.tsx**

```typescript
// apps/stats/components/stats/YearlyTable.tsx
import type { YearlyStats } from '@/actions/stats-actions'

export function YearlyTable({ stats }: { stats: YearlyStats[] }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            {['연도','I.상담·정보','II.체험','III.맞춤형','IV.사후관리','V.교육·홍보','합계'].map(h => (
              <th key={h} className="px-4 py-3 text-center font-medium text-gray-700">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {[...stats].reverse().map(row => (
            <tr key={row.year} className="hover:bg-gray-50">
              <td className="px-4 py-2.5 text-center font-medium">{row.year}년</td>
              <td className="px-4 py-2.5 text-center">{row.consultation}</td>
              <td className="px-4 py-2.5 text-center">{row.experience}</td>
              <td className="px-4 py-2.5 text-center">{row.custom}</td>
              <td className="px-4 py-2.5 text-center">{row.aftercare}</td>
              <td className="px-4 py-2.5 text-center">{row.education}</td>
              <td className="px-4 py-2.5 text-center font-bold text-blue-700">{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/stats/components/stats/
git commit -m "feat(stats): add shared stat components (YearSelector, AchievementTable, MonthlyTable, etc)"
```

---

## Task 6: stats — KPI 대시보드 + 목표 설정 페이지

**Files:**
- Modify: `apps/stats/app/page.tsx`
- Create: `apps/stats/components/targets/TargetForm.tsx`
- Create: `apps/stats/app/targets/page.tsx`

- [ ] **Step 1: Create TargetForm.tsx**

```typescript
// apps/stats/components/targets/TargetForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AnnualTarget, UpsertTargetInput } from '@/actions/annual-target-actions'

interface TargetFormProps {
  year: number
  defaultValues?: AnnualTarget | null
  onSubmit: (data: UpsertTargetInput) => Promise<{ success: boolean; error?: string }>
}

const FIELDS: { key: keyof UpsertTargetInput; label: string }[] = [
  { key: 'consultation', label: '보조기기 상담(연인원)' },
  { key: 'experience', label: '보조기기 사용 체험' },
  { key: 'rental', label: '대여' },
  { key: 'custom_make', label: '보조기기 맞춤 제작 지원' },
  { key: 'cleaning', label: '보조기기 소독 및 세척' },
  { key: 'repair', label: '보조기기 점검 및 수리' },
  { key: 'reuse', label: '보조기기 재사용 지원' },
  { key: 'professional_edu', label: '전문인력 교육 등' },
  { key: 'promotion', label: '홍보' },
]

export function TargetForm({ year, defaultValues, onSubmit }: TargetFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const data: UpsertTargetInput = { year } as UpsertTargetInput
    for (const { key } of FIELDS) {
      (data as Record<string, unknown>)[key] = parseInt(fd.get(key) as string) || 0
    }
    const result = await onSubmit(data)
    setLoading(false)
    if (!result.success) { setError(result.error ?? '저장 실패'); return }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
      <p className="text-sm text-gray-500 mb-4">콜센터·교부사업 맞춤형 평가지원은 '상시' 항목으로 목표 없음</p>
      {FIELDS.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-4">
          <label className="w-52 shrink-0 text-sm text-gray-700">{label}</label>
          <input
            name={key}
            type="number"
            min={0}
            defaultValue={(defaultValues as Record<string, unknown>)?.[key] as number ?? 0}
            className="w-28 px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-400">건</span>
        </div>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '저장 중...' : '목표 저장'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Create apps/stats/app/targets/page.tsx**

```typescript
import { getAnnualTarget, upsertAnnualTarget } from '@/actions/annual-target-actions'
import { TargetForm } from '@/stats/components/targets/TargetForm'
import { YearSelector } from '@/stats/components/stats/YearSelector'

interface TargetsPageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function TargetsPage({ searchParams }: TargetsPageProps) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))

  const result = await getAnnualTarget(year)
  const target = result.success ? result.target ?? null : null

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">연도별 목표 관리</h1>
        <YearSelector currentYear={year} />
      </div>

      <div className="bg-white border rounded-lg p-6 max-w-lg">
        <h2 className="font-semibold text-gray-900 mb-4">{year}년 목표값</h2>
        <TargetForm
          year={year}
          defaultValues={target}
          onSubmit={upsertAnnualTarget}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Read and update apps/stats/app/page.tsx — KPI 대시보드**

```typescript
import { getStatsSummary, getMonthlyStats } from '@/actions/stats-actions'
import { getAnnualTarget } from '@/actions/annual-target-actions'
import { getCallLogMonthlyCount } from '@/actions/call-log-actions'
import { AchievementTable } from '@/stats/components/stats/AchievementTable'
import { YearSelector } from '@/stats/components/stats/YearSelector'
import Link from 'next/link'

interface DashboardPageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function StatsDashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  const [summaryResult, targetResult, callResult] = await Promise.all([
    getStatsSummary(startDate, endDate),
    getAnnualTarget(year),
    getCallLogMonthlyCount(year),
  ])

  const summary = summaryResult.success ? summaryResult.summary : null
  const target = targetResult.success ? targetResult.target ?? null : null
  const callTotal = callResult.success ? callResult.total ?? 0 : 0
  const bs = summary?.businessSummary

  const actual = {
    consultation: bs?.consultation ?? 0,
    callCenter: callTotal,
    experience: bs?.experience ?? 0,
    rental: bs?.custom ?? 0,   // sub_category 매핑 필요시 조정
    customMake: bs?.custom ?? 0,
    assessment: 0,             // 교부사업 평가 별도 집계
    cleaning: bs?.aftercare ?? 0,
    repair: bs?.aftercare ?? 0,
    reuse: bs?.aftercare ?? 0,
    professionalEdu: bs?.education ?? 0,
    promotion: bs?.education ?? 0,
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">KPI 대시보드</h1>
        <div className="flex items-center gap-3">
          <YearSelector currentYear={year} />
          <Link
            href={`/export?year=${year}`}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
          >
            Excel 내보내기
          </Link>
        </div>
      </div>

      {!summary ? (
        <p className="text-gray-500">데이터를 불러올 수 없습니다.</p>
      ) : (
        <div className="space-y-6">
          {/* 요약 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '총 서비스', value: `${summary.totalApplications}건` },
              { label: '총 대상자', value: `${summary.totalClients}명` },
              { label: '완료율', value: `${summary.completionRate.toFixed(1)}%` },
              { label: '콜센터', value: `${callTotal}건` },
            ].map(({ label, value }) => (
              <div key={label} className="border rounded-lg p-5 bg-white">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {/* 목표 vs 실적 */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{year}년 목표 대비 실적</h2>
              <Link href={`/targets?year=${year}`} className="text-sm text-blue-600 hover:underline">
                목표 수정
              </Link>
            </div>
            <AchievementTable target={target} actual={actual} />
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/stats/app/page.tsx \
  apps/stats/components/targets/TargetForm.tsx \
  apps/stats/app/targets/page.tsx
git commit -m "feat(stats): add KPI dashboard with achievement rate and target management"
```

---

## Task 7: stats — 월별/사업별/연도별 뷰 페이지

**Files:**
- Create: `apps/stats/app/monthly/page.tsx`
- Create: `apps/stats/app/business/page.tsx`
- Create: `apps/stats/app/yearly/page.tsx`

- [ ] **Step 1: Create apps/stats/app/monthly/page.tsx**

```typescript
import { getMonthlyStats } from '@/actions/stats-actions'
import { getCallLogMonthlyCount } from '@/actions/call-log-actions'
import { MonthlyTable } from '@/stats/components/stats/MonthlyTable'
import { YearSelector } from '@/stats/components/stats/YearSelector'

interface MonthlyPageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function MonthlyPage({ searchParams }: MonthlyPageProps) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))

  const [statsResult, callResult] = await Promise.all([
    getMonthlyStats(year),
    getCallLogMonthlyCount(year),
  ])

  const stats = statsResult.success ? statsResult.stats ?? [] : []
  const callCenter = callResult.success ? callResult.monthly ?? [] : []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">월별 현황</h1>
        <YearSelector currentYear={year} />
      </div>
      {stats.length === 0 ? (
        <p className="text-gray-500">데이터가 없습니다.</p>
      ) : (
        <MonthlyTable stats={stats} callCenter={callCenter} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create apps/stats/app/business/page.tsx**

WC/ADL 영역 집계는 `applications.domain` 컬럼을 직접 쿼리한다.

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'
import { BusinessDomainTable, type DomainRow } from '@/stats/components/stats/BusinessDomainTable'
import { YearSelector } from '@/stats/components/stats/YearSelector'
import { redirect } from 'next/navigation'

interface BusinessPageProps {
  searchParams: Promise<{ year?: string }>
}

const DOMAINS = ['WC','ADL','S','SP','EC','CA','L','AAC','AM'] as const
type Domain = typeof DOMAINS[number]

const SERVICE_ROWS = [
  { key: 'rental',       label: '대여' },
  { key: 'custom_make',  label: '보조기기 맞춤 제작 지원' },
  { key: 'assessment',   label: '교부사업 맞춤형 평가지원' },
  { key: 'cleaning',     label: '보조기기 소독 및 세척' },
  { key: 'repair',       label: '보조기기 점검 및 수리' },
  { key: 'reuse',        label: '보조기기 재사용 지원' },
]

export default async function BusinessPage({ searchParams }: BusinessPageProps) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))

  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) redirect('/')

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('applications')
    .select('sub_category, domain, client_id, status')
    .gte('created_at', `${year}-01-01`)
    .lte('created_at', `${year}-12-31`)

  const apps = data ?? []

  const rows: DomainRow[] = SERVICE_ROWS.map(({ key, label }) => {
    const filtered = apps.filter(a => a.sub_category === key)
    const byDomain: Partial<Record<Domain, number>> = {}
    for (const d of DOMAINS) {
      const cnt = filtered.filter(a => a.domain === d).length
      if (cnt > 0) byDomain[d] = cnt
    }
    const uniqueClients = new Set(filtered.map(a => a.client_id).filter(Boolean)).size
    return {
      label,
      total: filtered.length,
      byDomain,
      actual_persons: uniqueClients,
      extended_persons: filtered.length,
    }
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">사업별 현황</h1>
        <YearSelector currentYear={year} />
      </div>
      <BusinessDomainTable rows={rows} />
    </div>
  )
}
```

- [ ] **Step 3: Create apps/stats/app/yearly/page.tsx**

```typescript
import { getYearlyStats } from '@/actions/stats-actions'
import { YearlyTable } from '@/stats/components/stats/YearlyTable'

export default async function YearlyPage() {
  const thisYear = new Date().getFullYear()
  const result = await getYearlyStats(2023, thisYear)
  const stats = result.success ? result.stats ?? [] : []

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">연도별 추이</h1>
      {stats.length === 0 ? (
        <p className="text-gray-500">데이터가 없습니다.</p>
      ) : (
        <YearlyTable stats={stats} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/stats/app/monthly/page.tsx \
  apps/stats/app/business/page.tsx \
  apps/stats/app/yearly/page.tsx
git commit -m "feat(stats): add monthly, business domain, and yearly pages"
```

---

## Task 8: stats — Excel 내보내기

`xlsx` (SheetJS)를 사용해 중앙 보고용 Excel 파일을 생성한다. 서버 액션에서 버퍼를 만들고, 클라이언트 컴포넌트에서 Blob 다운로드한다.

**Files:**
- Create: `actions/excel-export-actions.ts`
- Create: `apps/stats/components/stats/ExportButton.tsx`
- Create: `apps/stats/app/export/page.tsx`

- [ ] **Step 1: Install xlsx in stats app**

```bash
cd D:/AILeader1/project/valuewith/co-AT
pnpm add xlsx --filter stats
```

- [ ] **Step 2: Create actions/excel-export-actions.ts**

```typescript
"use server"

import * as XLSX from 'xlsx'
import { getStatsSummary, getMonthlyStats } from '@/actions/stats-actions'
import { getAnnualTarget } from '@/actions/annual-target-actions'
import { getCallLogMonthlyCount } from '@/actions/call-log-actions'
import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'

export async function generateReportExcel(year: number): Promise<{
  success: boolean
  buffer?: number[]
  filename?: string
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const startDate = `${year}-01-01`
  const endDate   = `${year}-12-31`

  const [summaryResult, monthlyResult, targetResult, callResult] = await Promise.all([
    getStatsSummary(startDate, endDate),
    getMonthlyStats(year),
    getAnnualTarget(year),
    getCallLogMonthlyCount(year),
  ])

  if (!summaryResult.success || !summaryResult.summary) {
    return { success: false, error: '통계 데이터를 불러올 수 없습니다' }
  }

  const summary = summaryResult.summary
  const monthly = monthlyResult.success ? monthlyResult.stats ?? [] : []
  const target  = targetResult.success  ? targetResult.target ?? null : null
  const callMonthly = callResult.success ? callResult.monthly ?? [] : []
  const ccMap = Object.fromEntries(callMonthly.map(c => [c.month, c.count]))

  const wb = XLSX.utils.book_new()

  // ── 시트 1: 전체 사업 실적 ──────────────────────────────────
  const sheet1Data: (string | number)[][] = [
    [`${year}년 보조기기센터 사업 실적 보고`],
    [],
    ['사업내용', '목표', '실적', '달성률'],
    ['보조기기 상담(연인원)', target?.consultation ?? '—', summary.totalApplications,
      target?.consultation ? `${Math.round(summary.totalApplications / target.consultation * 100)}%` : '—'],
    ['콜센터', '상시', callResult.total ?? 0, '상시'],
    ['보조기기 사용 체험', target?.experience ?? '—', summary.businessSummary.experience,
      target?.experience ? `${Math.round(summary.businessSummary.experience / target.experience * 100)}%` : '—'],
    ['대여', target?.rental ?? '—', summary.businessSummary.custom, '—'],
    ['보조기기 맞춤 제작 지원', target?.custom_make ?? '—', summary.businessSummary.custom, '—'],
    ['교부사업 맞춤형 평가지원', '상시', 0, '상시'],
    ['보조기기 소독 및 세척', target?.cleaning ?? '—', summary.businessSummary.aftercare, '—'],
    ['보조기기 점검 및 수리', target?.repair ?? '—', summary.businessSummary.aftercare, '—'],
    ['보조기기 재사용 지원', target?.reuse ?? '—', summary.businessSummary.aftercare, '—'],
    ['전문인력 교육 등', target?.professional_edu ?? '—', summary.businessSummary.education, '—'],
    ['홍보', target?.promotion ?? '—', summary.businessSummary.education, '—'],
  ]
  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data)
  ws1['!cols'] = [{ wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, ws1, '전체 사업 실적')

  // ── 시트 2: 월별 현황 ───────────────────────────────────────
  const sheet2Data: (string | number)[][] = [
    [`${year}년 월별 서비스 현황`],
    [],
    ['월', '콜센터', 'I.상담·정보', 'II.체험', 'III.맞춤형', 'IV.사후관리', 'V.교육·홍보', '합계'],
    ...monthly.map(m => [
      `${m.month}월`,
      ccMap[m.month] ?? 0,
      m.consultation, m.experience, m.custom, m.aftercare, m.education, m.total,
    ]),
    ['합계',
      Object.values(ccMap).reduce((a, b) => a + b, 0),
      monthly.reduce((s, m) => s + m.consultation, 0),
      monthly.reduce((s, m) => s + m.experience, 0),
      monthly.reduce((s, m) => s + m.custom, 0),
      monthly.reduce((s, m) => s + m.aftercare, 0),
      monthly.reduce((s, m) => s + m.education, 0),
      monthly.reduce((s, m) => s + m.total, 0),
    ],
  ]
  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data)
  ws2['!cols'] = [{ wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, ws2, '월별 현황')

  // 버퍼 생성
  const raw = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  // Server Action은 Uint8Array/Buffer를 직렬화할 수 없으므로 number[] 변환
  const buffer = Array.from(raw as Uint8Array)
  const filename = `${year}년_보조기기센터_사업실적.xlsx`

  return { success: true, buffer, filename }
}
```

- [ ] **Step 3: Create ExportButton.tsx**

```typescript
// apps/stats/components/stats/ExportButton.tsx
'use client'

import { useState } from 'react'
import { generateReportExcel } from '@/actions/excel-export-actions'
import { Download } from 'lucide-react'

export function ExportButton({ year }: { year: number }) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    const result = await generateReportExcel(year)
    setLoading(false)

    if (!result.success || !result.buffer) {
      alert(result.error ?? 'Excel 생성에 실패했습니다')
      return
    }

    const blob = new Blob(
      [new Uint8Array(result.buffer)],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    )
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = result.filename ?? `${year}년_사업실적.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
    >
      <Download className="h-4 w-4" />
      {loading ? '생성 중...' : `${year}년 Excel 내보내기`}
    </button>
  )
}
```

- [ ] **Step 4: Create apps/stats/app/export/page.tsx**

```typescript
import { ExportButton } from '@/stats/components/stats/ExportButton'
import { YearSelector } from '@/stats/components/stats/YearSelector'

interface ExportPageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function ExportPage({ searchParams }: ExportPageProps) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Excel 내보내기</h1>
        <YearSelector currentYear={year} />
      </div>

      <div className="bg-white border rounded-lg p-6 max-w-lg space-y-4">
        <h2 className="font-semibold text-gray-900">보조기기센터 사업 실적 보고 ({year}년)</h2>
        <p className="text-sm text-gray-600">
          중앙 보고용 Excel 파일을 생성합니다.<br />
          포함 내용: 전체 사업 실적 (목표/실적/달성률), 월별 현황
        </p>
        <ExportButton year={year} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add actions/excel-export-actions.ts \
  apps/stats/components/stats/ExportButton.tsx \
  apps/stats/app/export/page.tsx
git commit -m "feat(stats): add Excel export for annual performance report (xlsx)"
```

---

## Task 9: TypeScript 검증 + 최종 커밋

- [ ] **Step 1: TypeScript check eval**

```bash
npx tsc --noEmit --skipLibCheck -p apps/eval/tsconfig.json 2>&1 | head -30
```

- [ ] **Step 2: TypeScript check stats**

```bash
npx tsc --noEmit --skipLibCheck -p apps/stats/tsconfig.json 2>&1 | head -30
```

- [ ] **Step 3: Fix any errors, then final commit**

```bash
git add .
git commit -m "feat: phase 3 complete — call center log, KPI dashboard, Excel export"
```

---

## Checklist — Spec Coverage

| 요구사항 | 구현 위치 |
|---|---|
| 콜센터 상담 일지 입력 | Task 3 — eval /call-logs CRUD |
| 연도별 목표값 DB 저장 | Task 1 (migration) + Task 2 (actions) + Task 6 (targets page) |
| 목표 vs 실적 시각화 | Task 6 — AchievementTable (달성률 색상 표시) |
| 월별 현황 (콜센터 포함) | Task 7 — MonthlyTable |
| 사업별 × WC/ADL 영역 | Task 7 — BusinessDomainTable |
| 연도별 추이 | Task 7 — YearlyTable |
| Excel 내보내기 (중앙 보고용) | Task 8 — xlsx 2시트 (전체실적 + 월별현황) |
