# Phase H-2: 월별 확정 실적 보고서 자동 집계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 서비스 기록 `record_status='완료'` 로 확정된 건만 월별로 집계하여 eval 앱에서 실시간 조회·Excel 다운로드, stats 앱 월별 현황 페이지에 확정 실적 요약을 표시한다.

**Architecture:** DB 뷰/트리거 없이 `eval_service_records WHERE record_status='완료'` 를 서버 액션에서 on-demand 집계. 확정 기록이 생길 때마다 다음 페이지 로드 시 자동 반영됨. eval 앱 `/monthly-report` 신규 페이지 + stats 앱 `/monthly` 페이지에 확정 요약 섹션 추가.

**Tech Stack:** Next.js 16 App Router, Supabase (`createAdminClient`), TypeScript, ExcelJS, shadcn/ui, Vitest

---

## 파일 맵

| 구분 | 경로 |
|------|------|
| Create | `actions/monthly-report-actions.ts` |
| Create | `tests/actions/monthly-report.test.ts` |
| Create | `apps/eval/components/eval/MonthlyReportTable.tsx` |
| Create | `apps/eval/app/monthly-report/page.tsx` |
| Modify | `apps/eval/components/layout/EvalSidebar.tsx` |
| Modify | `apps/stats/actions/stats-actions.ts` |
| Modify | `apps/stats/app/monthly/page.tsx` |

---

## Task 1: 서버 액션 — `actions/monthly-report-actions.ts`

**Files:**
- Create: `actions/monthly-report-actions.ts`

### 역할
- `getMonthlyConfirmedSummary(year)` — `eval_service_records`에서 `record_status='완료'` 레코드를 월별로 집계
- `generateMonthlyConfirmedExcel(year)` — ExcelJS로 중앙보조기기센터 양식 Excel 생성

- [ ] **Step 1: 파일 생성**

```typescript
// actions/monthly-report-actions.ts
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

  const buffer = await workbook.xlsx.writeBuffer()
  return {
    success: true,
    buffer: Array.from(buffer as Uint8Array),
    filename: `월별확정실적_${year}년.xlsx`,
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add actions/monthly-report-actions.ts
git commit -m "feat(report): add getMonthlyConfirmedSummary and generateMonthlyConfirmedExcel actions"
```

---

## Task 2: 테스트 — `tests/actions/monthly-report.test.ts`

**Files:**
- Create: `tests/actions/monthly-report.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
// tests/actions/monthly-report.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMonthlyConfirmedSummary } from '@/actions/monthly-report-actions'
import { mockHasAdminOrStaffPermission } from '../../tests/setup'
import { createAdminClient } from '@/lib/supabase/admin'

vi.mock('@/lib/supabase/admin')

describe('getMonthlyConfirmedSummary', () => {
  beforeEach(() => vi.clearAllMocks())

  it('권한 없으면 error 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(false)
    const result = await getMonthlyConfirmedSummary(2026)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('권한이 없습니다')
  })

  it('완료 기록 없으면 12개 월 전부 0으로 반환', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: (_: unknown, res: (v: unknown) => void) =>
        res({ data: [], error: null }),
    }
    vi.mocked(createAdminClient).mockReturnValueOnce({ from: () => chain } as any)

    const result = await getMonthlyConfirmedSummary(2026)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.rows).toHaveLength(12)
      expect(result.rows[0].month).toBe(1)
      expect(result.rows[0].total_cases).toBe(0)
      expect(result.rows[11].month).toBe(12)
    }
  })

  it('완료 기록을 월별로 집계한다', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const fakeRows = [
      { client_id: 'c1', application_month: 3, received_at: null, is_consult: true, is_assessment: false, is_trial: false, is_rental: true, is_custom_make: false, is_grant: false, is_education: false, is_info_provision: false, is_other_business: false },
      { client_id: 'c2', application_month: 3, received_at: null, is_consult: false, is_assessment: false, is_trial: false, is_rental: false, is_custom_make: false, is_grant: true, is_education: false, is_info_provision: false, is_other_business: false },
      { client_id: 'c1', application_month: 5, received_at: null, is_consult: true, is_assessment: false, is_trial: false, is_rental: false, is_custom_make: false, is_grant: false, is_education: false, is_info_provision: false, is_other_business: false },
    ]
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: (_: unknown, res: (v: unknown) => void) =>
        res({ data: fakeRows, error: null }),
    }
    vi.mocked(createAdminClient).mockReturnValueOnce({ from: () => chain } as any)

    const result = await getMonthlyConfirmedSummary(2026)
    expect(result.success).toBe(true)
    if (!result.success) return

    const march = result.rows.find(r => r.month === 3)!
    expect(march.total_cases).toBe(2)
    expect(march.total_clients).toBe(2)
    expect(march.consult).toBe(1)
    expect(march.rental).toBe(1)
    expect(march.grant).toBe(1)

    const may = result.rows.find(r => r.month === 5)!
    expect(may.total_cases).toBe(1)
    expect(may.consult).toBe(1)

    // c1이 3월과 5월 둘 다 있어도 각 월은 독립 집계
    expect(march.total_clients).toBe(2)
    expect(may.total_clients).toBe(1)
  })

  it('received_at 으로 월을 fallback 처리한다', async () => {
    mockHasAdminOrStaffPermission.mockResolvedValueOnce(true)
    const fakeRows = [
      { client_id: 'c1', application_month: null, received_at: '2026-07-15', is_consult: true, is_assessment: false, is_trial: false, is_rental: false, is_custom_make: false, is_grant: false, is_education: false, is_info_provision: false, is_other_business: false },
    ]
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: (_: unknown, res: (v: unknown) => void) =>
        res({ data: fakeRows, error: null }),
    }
    vi.mocked(createAdminClient).mockReturnValueOnce({ from: () => chain } as any)

    const result = await getMonthlyConfirmedSummary(2026)
    expect(result.success).toBe(true)
    if (!result.success) return
    const july = result.rows.find(r => r.month === 7)!
    expect(july.consult).toBe(1)
  })
})
```

- [ ] **Step 2: 테스트 실행 — 통과 확인**

```bash
pnpm test tests/actions/monthly-report.test.ts
```

Expected: 4 tests PASS

- [ ] **Step 3: 커밋**

```bash
git add tests/actions/monthly-report.test.ts
git commit -m "test(report): add unit tests for getMonthlyConfirmedSummary"
```

---

## Task 3: UI 컴포넌트 — `MonthlyReportTable.tsx`

**Files:**
- Create: `apps/eval/components/eval/MonthlyReportTable.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// apps/eval/components/eval/MonthlyReportTable.tsx
import type { MonthlyConfirmedRow } from '@/actions/monthly-report-actions'

interface Props {
  rows: MonthlyConfirmedRow[]
  year: number
}

const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

const COLS: { key: keyof Omit<MonthlyConfirmedRow, 'month'>; label: string }[] = [
  { key: 'consult',        label: '상담' },
  { key: 'assessment',     label: '평가' },
  { key: 'trial',          label: '체험' },
  { key: 'rental',         label: '대여' },
  { key: 'custom_make',    label: '맞춤제작' },
  { key: 'grant',          label: '교부평가' },
  { key: 'education',      label: '교육' },
  { key: 'info_provision', label: '정보제공' },
  { key: 'other_business', label: '기타사업' },
  { key: 'total_cases',    label: '합계건수' },
  { key: 'total_clients',  label: '연인원' },
]

function sumCol(rows: MonthlyConfirmedRow[], key: keyof Omit<MonthlyConfirmedRow, 'month'>): number {
  return rows.reduce((acc, r) => acc + r[key], 0)
}

export function MonthlyReportTable({ rows, year }: Props) {
  if (rows.every(r => r.total_cases === 0)) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        {year}년 확정 서비스 기록이 없습니다.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-blue-50 text-blue-800">
            <th className="px-3 py-2 text-left font-semibold w-12 border-b border-blue-100">월</th>
            {COLS.map(c => (
              <th key={c.key} className="px-3 py-2 text-right font-semibold border-b border-blue-100">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr
              key={row.month}
              className={row.total_cases === 0 ? 'text-gray-300' : 'hover:bg-gray-50'}
            >
              <td className="px-3 py-1.5 font-medium text-gray-700 border-b border-gray-100">
                {MONTH_LABELS[row.month - 1]}
              </td>
              {COLS.map(c => (
                <td
                  key={c.key}
                  className={`px-3 py-1.5 text-right border-b border-gray-100 tabular-nums ${
                    (c.key === 'total_cases' || c.key === 'total_clients') && row[c.key] > 0
                      ? 'font-semibold text-gray-900'
                      : 'text-gray-600'
                  }`}
                >
                  {row[c.key] > 0 ? row[c.key] : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-yellow-50 font-semibold text-gray-900">
            <td className="px-3 py-2">합계</td>
            {COLS.map(c => (
              <td key={c.key} className="px-3 py-2 text-right tabular-nums">
                {sumCol(rows, c.key)}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/eval/components/eval/MonthlyReportTable.tsx
git commit -m "feat(eval): add MonthlyReportTable component"
```

---

## Task 4: eval 페이지 — `/monthly-report`

**Files:**
- Create: `apps/eval/app/monthly-report/page.tsx`

- [ ] **Step 1: 페이지 작성**

```tsx
// apps/eval/app/monthly-report/page.tsx
import Link from 'next/link'
import { getMonthlyConfirmedSummary, generateMonthlyConfirmedExcel } from '@/actions/monthly-report-actions'
import { MonthlyReportTable } from '@/eval/components/eval/MonthlyReportTable'
import { DownloadReportButton } from '@/eval/components/eval/DownloadReportButton'

interface Props {
  searchParams: Promise<{ year?: string }>
}

const AVAILABLE_YEARS = [2024, 2025, 2026, 2027]

export default async function MonthlyReportPage({ searchParams }: Props) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))

  const result = await getMonthlyConfirmedSummary(year)
  const rows = result.success ? result.rows : []

  const downloadAction = generateMonthlyConfirmedExcel.bind(null, year)

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">월별 확정 실적 보고서</h1>
        <p className="text-sm text-gray-500 mt-1">
          record_status = <span className="font-mono text-green-700">완료</span> 기준 집계 — 중앙보조기기센터 제출 양식
        </p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          {AVAILABLE_YEARS.map(y => (
            <Link
              key={y}
              href={`/monthly-report?year=${y}`}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                y === year
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {y}년
            </Link>
          ))}
        </div>
        <DownloadReportButton
          label={`${year}년 Excel 다운로드`}
          action={downloadAction}
        />
      </div>

      {!result.success ? (
        <p className="text-red-500 text-sm">{result.error}</p>
      ) : (
        <MonthlyReportTable rows={rows} year={year} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/eval/app/monthly-report/page.tsx
git commit -m "feat(eval): add /monthly-report page — confirmed service record aggregation"
```

---

## Task 5: EvalSidebar 메뉴 추가

**Files:**
- Modify: `apps/eval/components/layout/EvalSidebar.tsx`

현재 파일의 `NAV_ENTRIES` 상단 import에 `FileSpreadsheet` 아이콘을 추가하고, `지식·관리` 섹션 아래에 항목을 추가한다.

- [ ] **Step 1: `EvalSidebar.tsx` 수정 — import에 FileSpreadsheet 추가**

`apps/eval/components/layout/EvalSidebar.tsx` 4번째 줄의 import를 다음으로 교체:

```typescript
import {
  Users, BarChart3, LogOut, Phone, RefreshCw, Clock,
  FileEdit, GraduationCap, Gift, FileText, BarChart2,
  BookOpen, Kanban, QrCode, ClipboardList, Building2, Filter,
  FileSpreadsheet,
} from 'lucide-react'
```

- [ ] **Step 2: `NAV_ENTRIES` 배열에 항목 추가**

`지식·관리` 섹션 아래, `{ type: 'item', href: '/migration', ... }` 바로 위에 추가:

```typescript
  { type: 'item', href: '/monthly-report', label: '월별 확정 보고서', icon: FileSpreadsheet },
```

수정 후 `지식·관리` 섹션:
```typescript
  { type: 'section', label: '지식·관리' },
  { type: 'item', href: '/knowledge', label: '보조기기 결과 이력', icon: BookOpen },
  { type: 'item', href: '/monthly-report', label: '월별 확정 보고서', icon: FileSpreadsheet },
  { type: 'item', href: '/migration', label: 'Sheets 동기화', icon: RefreshCw },
```

- [ ] **Step 3: 커밋**

```bash
git add apps/eval/components/layout/EvalSidebar.tsx
git commit -m "feat(eval): add 월별 확정 보고서 menu item to EvalSidebar"
```

---

## Task 6: stats 앱 — 확정 실적 섹션 추가

### 6-A: `apps/stats/actions/stats-actions.ts` 에 함수 추가

**Files:**
- Modify: `apps/stats/actions/stats-actions.ts`

파일 끝에 다음을 추가 (기존 타입 정의 뒤):

- [ ] **Step 1: `MonthlyConfirmedStats` 타입 + `getMonthlyConfirmedStats` 함수 추가**

`apps/stats/actions/stats-actions.ts` 파일 끝에 append:

```typescript
// ──────────────────────────────────────────
// 확정 실적 (record_status = '완료')
// ──────────────────────────────────────────

export interface MonthlyConfirmedStats {
  month: number
  total_cases: number
  total_clients: number
  consult: number
  assessment: number
  trial: number
  rental: number
  custom_make: number
  grant: number
  education: number
}

export async function getMonthlyConfirmedStats(year: number): Promise<
  { success: true; stats: MonthlyConfirmedStats[] } | { success: false; error: string }
> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('eval_service_records')
      .select(
        'client_id, application_month, received_at, ' +
        'is_consult, is_assessment, is_trial, is_rental, is_custom_make, is_grant, is_education'
      )
      .eq('record_status', '완료')
      .eq('application_year', year)

    if (error) return { success: false, error: error.message }

    const byMonth: Record<number, MonthlyConfirmedStats & { clientIds: Set<string> }> = {}
    for (let m = 1; m <= 12; m++) {
      byMonth[m] = { month: m, total_cases: 0, total_clients: 0, consult: 0, assessment: 0, trial: 0, rental: 0, custom_make: 0, grant: 0, education: 0, clientIds: new Set() }
    }

    for (const r of (data ?? []) as Array<Record<string, unknown>>) {
      const m = (r.application_month as number | null) ?? (r.received_at ? new Date(r.received_at as string).getMonth() + 1 : null)
      if (!m || !byMonth[m]) continue
      byMonth[m].total_cases++
      if (r.client_id) byMonth[m].clientIds.add(r.client_id as string)
      if (r.is_consult) byMonth[m].consult++
      if (r.is_assessment) byMonth[m].assessment++
      if (r.is_trial) byMonth[m].trial++
      if (r.is_rental) byMonth[m].rental++
      if (r.is_custom_make) byMonth[m].custom_make++
      if (r.is_grant) byMonth[m].grant++
      if (r.is_education) byMonth[m].education++
    }

    const stats: MonthlyConfirmedStats[] = Object.values(byMonth).map(({ clientIds, ...row }) => ({
      ...row,
      total_clients: clientIds.size,
    }))
    return { success: true, stats }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/stats/actions/stats-actions.ts
git commit -m "feat(stats): add getMonthlyConfirmedStats action"
```

### 6-B: `apps/stats/app/monthly/page.tsx` 확정 섹션 추가

**Files:**
- Modify: `apps/stats/app/monthly/page.tsx`

- [ ] **Step 3: 기존 페이지에 확정 실적 섹션 추가**

현재 `apps/stats/app/monthly/page.tsx` 내용을 다음으로 교체:

```tsx
// apps/stats/app/monthly/page.tsx
import { getMonthlyStats, getMonthlyConfirmedStats } from '@/actions/stats-actions'
import { getCallLogMonthlyCount } from '@/actions/call-log-actions'
import { MonthlyTable } from '@/stats/components/stats/MonthlyTable'
import { MonthlyComparisonChart } from '@/stats/components/stats/MonthlyComparisonChart'
import { YearSelector } from '@/stats/components/stats/YearSelector'

interface MonthlyPageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function MonthlyPage({ searchParams }: MonthlyPageProps) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))

  const [statsResult, prevStatsResult, callResult, confirmedResult] = await Promise.all([
    getMonthlyStats(year),
    getMonthlyStats(year - 1),
    getCallLogMonthlyCount(year),
    getMonthlyConfirmedStats(year),
  ])

  const stats = statsResult.success ? statsResult.stats ?? [] : []
  const prevStats = prevStatsResult.success ? prevStatsResult.stats ?? [] : []
  const callCenter = callResult.success ? callResult.monthly ?? [] : []
  const confirmed = confirmedResult.success ? confirmedResult.stats : []

  const confirmedTotal = confirmed.reduce((s, r) => s + r.total_cases, 0)
  const confirmedClients = confirmed.reduce((s, r) => s + r.total_clients, 0)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">월별 현황</h1>
        <YearSelector currentYear={year} />
      </div>

      {/* 확정 실적 요약 카드 */}
      <div className="mb-6 p-4 rounded-xl border border-green-200 bg-green-50">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-3">
          {year}년 확정 실적 (record_status = 완료)
        </p>
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-8">
          {[
            { label: '합계건수', value: confirmedTotal },
            { label: '연인원',   value: confirmedClients },
            { label: '상담',     value: confirmed.reduce((s, r) => s + r.consult, 0) },
            { label: '평가',     value: confirmed.reduce((s, r) => s + r.assessment, 0) },
            { label: '체험',     value: confirmed.reduce((s, r) => s + r.trial, 0) },
            { label: '대여',     value: confirmed.reduce((s, r) => s + r.rental, 0) },
            { label: '맞춤제작', value: confirmed.reduce((s, r) => s + r.custom_make, 0) },
            { label: '교부평가', value: confirmed.reduce((s, r) => s + r.grant, 0) },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-xl font-bold text-green-800">{value}</p>
              <p className="text-xs text-green-600 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <MonthlyComparisonChart
        currentYear={year}
        currentStats={stats}
        prevStats={prevStats}
      />
      {stats.length === 0 ? (
        <p className="text-gray-500">데이터가 없습니다.</p>
      ) : (
        <MonthlyTable stats={stats} callCenter={callCenter} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: 커밋**

```bash
git add apps/stats/app/monthly/page.tsx
git commit -m "feat(stats): add confirmed stats summary card to monthly page"
```

---

## Task 7: 빌드 검증

- [ ] **Step 1: eval 앱 빌드**

```bash
pnpm --filter @co-at/eval build
```

Expected: `✓ Compiled successfully` — `monthly-report` 라우트 포함

- [ ] **Step 2: stats 앱 빌드**

```bash
pnpm --filter @co-at/stats build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: 전체 테스트**

```bash
pnpm test
```

Expected: monthly-report 테스트 4개 포함 PASS

- [ ] **Step 4: 최종 커밋**

```bash
git add -A
git commit -m "feat(H-2): monthly confirmed report — eval /monthly-report page + stats confirmed summary"
```

---

## Self-Review

### Spec Coverage 체크

| 요구사항 | Task |
|---------|------|
| 서비스 기록 확정(완료) → 월별 자동 집계 | Task 1 (`getMonthlyConfirmedSummary`) |
| eval 보고서 화면 연동 | Task 3, 4 |
| 엑셀 내보내기 | Task 1 (`generateMonthlyConfirmedExcel`) |
| stats 현황 요약 연동 | Task 6 |
| 사이드바 메뉴 진입점 | Task 5 |

### 타입 일관성 체크
- `MonthlyConfirmedRow` (Task 1) — Task 3 컴포넌트 Props에서 동일하게 사용 ✓
- `getMonthlyConfirmedStats` 반환 타입 `MonthlyConfirmedStats[]` — Task 6-B에서 동일하게 참조 ✓
- `DownloadReportButton`의 `action` prop — `generateMonthlyConfirmedExcel.bind(null, year)` 시그니처 일치 ✓

### Placeholder 없음 확인
- 모든 step에 실제 코드 포함 ✓
- `TODO`, `TBD` 없음 ✓
