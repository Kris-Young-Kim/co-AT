# H-2 월별 실적 보고서 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** eval 앱에 월별 실적 보고서 페이지를 추가하여, 확정된 서비스 기록을 중앙보조기기센터 보고 양식 형태로 집계·조회하고 엑셀로 내보낼 수 있게 한다.

**Architecture:** `eval_service_records`를 `application_year` + `application_month` 기준으로 필터링하여 JS에서 집계(기존 generateBusinessReport 패턴 동일). 새 server action `getMonthlyReportSummary` + `generateMonthlyReportExcel`을 루트 `actions/` 에 추가. eval 앱에 `/reports` (연간 12개월 그리드) + `/reports/[year]/[month]` (월별 상세) 페이지 신규 생성.

**Tech Stack:** Next.js 15 App Router · TypeScript · ExcelJS (동적 생성, 템플릿 미사용) · Supabase (createAdminClient) · Tailwind + shadcn/ui

---

## File Map

| 작업 | 파일 | 역할 |
|------|------|------|
| CREATE | `actions/monthly-report-actions.ts` | 월별 집계 server action (getMonthlyReportSummary, generateMonthlyReportExcel) |
| CREATE | `apps/eval/app/reports/page.tsx` | 연도 선택 + 12개월 그리드 |
| CREATE | `apps/eval/app/reports/[year]/[month]/page.tsx` | 월별 상세 (요약 테이블 + 기록 목록 + 엑셀 버튼) |
| CREATE | `apps/eval/components/reports/MonthlyReportSummary.tsx` | 집계 테이블 컴포넌트 |
| CREATE | `apps/eval/components/reports/MonthlyReportExportButton.tsx` | 엑셀 다운로드 Client 버튼 |
| MODIFY | `apps/eval/components/layout/EvalSidebar.tsx` | "보고서" 섹션 + "월별 실적" 메뉴 추가 |

---

## Task 1: Monthly Report Types & Server Action (집계)

**Files:**
- Create: `actions/monthly-report-actions.ts`

### 1-1. 타입 정의 + 집계 액션 작성

- [ ] **Step 1: `actions/monthly-report-actions.ts` 생성**

```typescript
"use server"

import ExcelJS from 'exceljs'
import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"

export interface MonthlyReportSummary {
  year: number
  month: number
  totalRecords: number
  // 서비스 유형
  consult: number
  trial: number
  rental: number
  customMake: number
  grant: number
  education: number
  infoProvision: number
  cleaning: number
  repair: number
  reuse: number
  monitoring: number
  otherBusiness: number
  // 재원 구분
  publicFunding: number
  privateFunding: number
  selfPay: number
  // 경제 상태
  beneficiary: number   // 수급자
  nearPoverty: number   // 차상위
  general: number       // 일반
  // 장애 정도
  severe: number        // 중증
  mild: number          // 경증
}

export interface MonthlyGridItem {
  month: number
  totalRecords: number
  completedRecords: number
}

export async function getYearlyMonthlyGrid(year: number): Promise<
  { success: true; grid: MonthlyGridItem[] } | { success: false; error: string }
> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('eval_service_records')
    .select('application_month, record_status')
    .eq('application_year', year)
    .not('application_month', 'is', null)

  if (error) return { success: false, error: error.message }

  const rows = (data ?? []) as { application_month: number | null; record_status: string | null }[]

  const grid: MonthlyGridItem[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    totalRecords: 0,
    completedRecords: 0,
  }))

  for (const row of rows) {
    const m = row.application_month
    if (!m || m < 1 || m > 12) continue
    grid[m - 1].totalRecords++
    if (row.record_status === '완료') grid[m - 1].completedRecords++
  }

  return { success: true, grid }
}

export async function getMonthlyReportSummary(year: number, month: number): Promise<
  { success: true; summary: MonthlyReportSummary } | { success: false; error: string }
> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('eval_service_records')
    .select('*')
    .eq('application_year', year)
    .eq('application_month', month)
    .limit(5000)

  if (error) return { success: false, error: error.message }

  const records = (data ?? []) as Record<string, unknown>[]

  const count = (flag: string) => records.filter(r => r[flag] === true).length
  const countBy = (field: string, val: string) => records.filter(r => r[field] === val).length

  const summary: MonthlyReportSummary = {
    year,
    month,
    totalRecords: records.length,
    consult: count('is_consult'),
    trial: count('is_trial'),
    rental: count('is_rental'),
    customMake: count('is_custom_make'),
    grant: count('is_grant'),
    education: count('is_education'),
    infoProvision: count('is_info_provision'),
    cleaning: count('is_cleaning'),
    repair: count('is_repair'),
    reuse: count('is_reuse'),
    monitoring: count('is_monitoring'),
    otherBusiness: count('is_other_business'),
    publicFunding: count('is_public_funding'),
    privateFunding: count('is_private_funding'),
    selfPay: count('is_self_pay'),
    beneficiary: countBy('economic_status', '수급자'),
    nearPoverty: countBy('economic_status', '차상위'),
    general: countBy('economic_status', '일반'),
    severe: countBy('disability_severity', '중증'),
    mild: countBy('disability_severity', '경증'),
  }

  return { success: true, summary }
}
```

- [ ] **Step 2: 빌드 확인 (타입 오류 없는지)**

```bash
pnpm --filter @co-at/eval build 2>&1 | head -30
```
Expected: 빌드 오류 없음 (새 파일이므로 아직 import 없음)

---

## Task 2: Excel Export Action

**Files:**
- Modify: `actions/monthly-report-actions.ts` (함수 추가)

### 2-1. generateMonthlyReportExcel 함수 추가

- [ ] **Step 1: `actions/monthly-report-actions.ts` 하단에 Excel 생성 함수 추가**

```typescript
export async function generateMonthlyReportExcel(year: number, month: number): Promise<
  { success: boolean; buffer?: number[]; filename?: string; error?: string }
> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('eval_service_records')
    .select('*')
    .eq('application_year', year)
    .eq('application_month', month)
    .order('received_at', { ascending: true })
    .limit(5000)

  if (error) return { success: false, error: error.message }

  const records = (data ?? []) as Record<string, unknown>[]
  const count = (flag: string) => records.filter(r => r[flag] === true).length
  const countBy = (field: string, val: string) => records.filter(r => r[field] === val).length

  const workbook = new ExcelJS.Workbook()

  // ── Sheet 1: 실적 요약 ──
  const sheet1 = workbook.addWorksheet('실적 요약')
  sheet1.columns = [
    { header: '구분', key: 'category', width: 20 },
    { header: '항목', key: 'item', width: 24 },
    { header: '건수', key: 'count', width: 12 },
  ]
  sheet1.getRow(1).font = { bold: true }

  const summaryRows = [
    { category: `${year}년 ${month}월 실적`, item: '전체 건수', count: records.length },
    { category: '', item: '', count: '' },
    { category: '서비스 유형', item: '상담', count: count('is_consult') },
    { category: '', item: '체험지원', count: count('is_trial') },
    { category: '', item: '대여', count: count('is_rental') },
    { category: '', item: '맞춤제작', count: count('is_custom_make') },
    { category: '', item: '교부사업', count: count('is_grant') },
    { category: '', item: '교육', count: count('is_education') },
    { category: '', item: '정보제공', count: count('is_info_provision') },
    { category: '', item: '소독·세척', count: count('is_cleaning') },
    { category: '', item: '수리', count: count('is_repair') },
    { category: '', item: '재사용지원', count: count('is_reuse') },
    { category: '', item: '모니터링', count: count('is_monitoring') },
    { category: '', item: '기타사업', count: count('is_other_business') },
    { category: '', item: '', count: '' },
    { category: '재원 구분', item: '공적급여', count: count('is_public_funding') },
    { category: '', item: '민간지원', count: count('is_private_funding') },
    { category: '', item: '자부담', count: count('is_self_pay') },
    { category: '', item: '', count: '' },
    { category: '경제 상태', item: '수급자', count: countBy('economic_status', '수급자') },
    { category: '', item: '차상위', count: countBy('economic_status', '차상위') },
    { category: '', item: '일반', count: countBy('economic_status', '일반') },
    { category: '', item: '', count: '' },
    { category: '장애 정도', item: '중증', count: countBy('disability_severity', '중증') },
    { category: '', item: '경증', count: countBy('disability_severity', '경증') },
  ]
  sheet1.addRows(summaryRows)

  // ── Sheet 2: 개별 기록 ──
  const sheet2 = workbook.addWorksheet('개별 기록')
  sheet2.columns = [
    { header: '연번', key: 'no', width: 6 },
    { header: '성명', key: 'name', width: 10 },
    { header: '접수일', key: 'received_at', width: 12 },
    { header: '장애유형', key: 'disability_type', width: 14 },
    { header: '장애정도', key: 'disability_severity', width: 10 },
    { header: '경제상태', key: 'economic_status', width: 10 },
    { header: '지역', key: 'region', width: 10 },
    { header: '서비스 카테고리', key: 'service_category', width: 18 },
    { header: '품목명', key: 'product_name', width: 20 },
    { header: '상담', key: 'is_consult', width: 6 },
    { header: '체험', key: 'is_trial', width: 6 },
    { header: '대여', key: 'is_rental', width: 6 },
    { header: '맞춤제작', key: 'is_custom_make', width: 8 },
    { header: '교부', key: 'is_grant', width: 6 },
    { header: '교육', key: 'is_education', width: 6 },
    { header: '상태', key: 'record_status', width: 8 },
    { header: '담당자', key: 'staff_name', width: 10 },
  ]
  sheet2.getRow(1).font = { bold: true }

  records.forEach((r, i) => {
    sheet2.addRow({
      no: i + 1,
      name: r.name,
      received_at: r.received_at,
      disability_type: r.disability_type,
      disability_severity: r.disability_severity,
      economic_status: r.economic_status,
      region: r.region,
      service_category: r.service_category,
      product_name: r.product_name,
      is_consult: r.is_consult ? '✓' : '',
      is_trial: r.is_trial ? '✓' : '',
      is_rental: r.is_rental ? '✓' : '',
      is_custom_make: r.is_custom_make ? '✓' : '',
      is_grant: r.is_grant ? '✓' : '',
      is_education: r.is_education ? '✓' : '',
      record_status: r.record_status,
      staff_name: r.staff_name,
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return {
    success: true,
    buffer: Array.from(new Uint8Array(buffer as ArrayBuffer)),
    filename: `${year}년_${month}월_실적보고서.xlsx`,
  }
}
```

- [ ] **Step 2: 빌드 확인**

```bash
pnpm --filter @co-at/eval build 2>&1 | head -40
```
Expected: 오류 없음

---

## Task 3: Reports List Page (연도 그리드)

**Files:**
- Create: `apps/eval/app/reports/page.tsx`

### 3-1. 12개월 그리드 페이지 생성

- [ ] **Step 1: `apps/eval/app/reports/page.tsx` 생성**

```typescript
import { getYearlyMonthlyGrid } from '@/../actions/monthly-report-actions'
import Link from 'next/link'
import { FileText, CheckCircle2, Circle } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ year?: string }>
}

const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export default async function ReportsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const currentYear = new Date().getFullYear()
  const year = parseInt(params.year ?? String(currentYear), 10)

  const result = await getYearlyMonthlyGrid(year)
  const grid = result.success ? result.grid : []

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">월별 실적 보고서</h1>
          <p className="text-sm text-gray-500 mt-1">중앙보조기기센터 제출용 월별 실적 집계</p>
        </div>
        {/* Year selector */}
        <div className="flex items-center gap-2">
          <Link
            href={`/reports?year=${year - 1}`}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
          >
            ← {year - 1}년
          </Link>
          <span className="px-3 py-1.5 text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded">
            {year}년
          </span>
          {year < currentYear && (
            <Link
              href={`/reports?year=${year + 1}`}
              className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
            >
              {year + 1}년 →
            </Link>
          )}
        </div>
      </div>

      {!result.success && (
        <div className="text-red-500 text-sm mb-4">{result.error}</div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {grid.map((item) => {
          const hasRecords = item.totalRecords > 0
          return (
            <Link
              key={item.month}
              href={`/reports/${year}/${item.month}`}
              className="group block border rounded-lg p-4 hover:border-blue-400 hover:shadow-sm transition-all bg-white"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-800">{MONTH_LABELS[item.month - 1]}</span>
                {hasRecords
                  ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                  : <Circle className="h-4 w-4 text-gray-300" />
                }
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">전체</span>
                  <span className="font-medium">{item.totalRecords}건</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">완료</span>
                  <span className={item.completedRecords > 0 ? 'font-medium text-green-600' : 'text-gray-400'}>
                    {item.completedRecords}건
                  </span>
                </div>
              </div>
              {hasRecords && (
                <div className="mt-3 flex items-center gap-1 text-xs text-blue-600 group-hover:text-blue-700">
                  <FileText className="h-3 w-3" />
                  보고서 보기
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 개발 서버 기동 확인 (eval 앱)**

```bash
pnpm --filter @co-at/eval dev 2>&1 | head -20
```
Expected: 서버 기동 성공, 오류 없음

- [ ] **Step 3: 브라우저에서 `http://localhost:3002/reports` 접속 확인**

Expected: 12개월 그리드 렌더링, 연도 이동 버튼 동작

---

## Task 4: Monthly Detail Page (월별 상세)

**Files:**
- Create: `apps/eval/app/reports/[year]/[month]/page.tsx`
- Create: `apps/eval/components/reports/MonthlyReportSummary.tsx`
- Create: `apps/eval/components/reports/MonthlyReportExportButton.tsx`

### 4-1. MonthlyReportSummary 컴포넌트 생성

- [ ] **Step 1: `apps/eval/components/reports/MonthlyReportSummary.tsx` 생성**

```typescript
import type { MonthlyReportSummary } from '@/../actions/monthly-report-actions'

interface Props {
  summary: MonthlyReportSummary
}

function SummarySection({ label, rows }: { label: string; rows: { item: string; count: number }[] }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">{label}</h3>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(({ item, count }) => (
            <tr key={item} className="border-b last:border-0">
              <td className="py-1.5 px-2 text-gray-700">{item}</td>
              <td className="py-1.5 px-2 text-right font-medium text-gray-900">{count}건</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function MonthlyReportSummaryTable({ summary }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="border rounded-lg p-4 bg-white">
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold text-gray-900">{summary.totalRecords}</span>
          <span className="text-sm text-gray-500">건 (전체)</span>
        </div>

        <SummarySection
          label="서비스 유형"
          rows={[
            { item: '상담', count: summary.consult },
            { item: '체험지원', count: summary.trial },
            { item: '대여', count: summary.rental },
            { item: '맞춤제작', count: summary.customMake },
            { item: '교부사업 평가', count: summary.grant },
            { item: '교육', count: summary.education },
            { item: '정보제공', count: summary.infoProvision },
            { item: '소독·세척', count: summary.cleaning },
            { item: '수리', count: summary.repair },
            { item: '재사용지원', count: summary.reuse },
            { item: '모니터링', count: summary.monitoring },
            { item: '기타사업', count: summary.otherBusiness },
          ]}
        />
      </div>

      <div className="space-y-4">
        <div className="border rounded-lg p-4 bg-white">
          <SummarySection
            label="재원 구분"
            rows={[
              { item: '공적급여', count: summary.publicFunding },
              { item: '민간지원', count: summary.privateFunding },
              { item: '자부담', count: summary.selfPay },
            ]}
          />
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <SummarySection
            label="경제 상태"
            rows={[
              { item: '수급자', count: summary.beneficiary },
              { item: '차상위', count: summary.nearPoverty },
              { item: '일반', count: summary.general },
            ]}
          />
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <SummarySection
            label="장애 정도"
            rows={[
              { item: '중증', count: summary.severe },
              { item: '경증', count: summary.mild },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
```

### 4-2. MonthlyReportExportButton 컴포넌트 생성

- [ ] **Step 2: `apps/eval/components/reports/MonthlyReportExportButton.tsx` 생성**

```typescript
'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { generateMonthlyReportExcel } from '@/../actions/monthly-report-actions'

interface Props {
  year: number
  month: number
}

export function MonthlyReportExportButton({ year, month }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExport() {
    setLoading(true)
    setError(null)
    try {
      const result = await generateMonthlyReportExcel(year, month)
      if (!result.success || !result.buffer) {
        setError(result.error ?? '엑셀 생성 실패')
        return
      }
      const blob = new Blob([new Uint8Array(result.buffer)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename ?? `${year}년_${month}월_실적보고서.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        엑셀 내보내기
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
```

### 4-3. 월별 상세 페이지 생성

- [ ] **Step 3: `apps/eval/app/reports/[year]/[month]/page.tsx` 생성**

```typescript
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getMonthlyReportSummary } from '@/../actions/monthly-report-actions'
import { MonthlyReportSummaryTable } from '@/eval/components/reports/MonthlyReportSummary'
import { MonthlyReportExportButton } from '@/eval/components/reports/MonthlyReportExportButton'

interface PageProps {
  params: Promise<{ year: string; month: string }>
}

export default async function MonthlyReportDetailPage({ params }: PageProps) {
  const { year: yearStr, month: monthStr } = await params
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) notFound()

  const result = await getMonthlyReportSummary(year, month)

  if (!result.success) {
    return (
      <div className="p-6">
        <p className="text-red-500">{result.error}</p>
      </div>
    )
  }

  const { summary } = result

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/reports?year=${year}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          {year}년 목록
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {year}년 {month}월 실적 보고서
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            중앙보조기기센터 보고 양식 — 서비스 기록 집계
          </p>
        </div>
        <MonthlyReportExportButton year={year} month={month} />
      </div>

      {summary.totalRecords === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">{year}년 {month}월에 등록된 서비스 기록이 없습니다.</p>
          <Link
            href="/service-records"
            className="mt-3 inline-block text-sm text-blue-600 hover:underline"
          >
            서비스 기록 관리로 이동 →
          </Link>
        </div>
      ) : (
        <MonthlyReportSummaryTable summary={summary} />
      )}
    </div>
  )
}
```

> **Note:** `@/eval/components/...` alias: eval 앱 CLAUDE.md에 따르면 `@/eval/*` → `apps/eval/*`. 만약 alias 오류가 나면 상대경로 `../../components/reports/...` 로 대체한다.

- [ ] **Step 4: 개발 서버에서 `/reports/2026/6` 접속 확인**

Expected: 실적 요약 테이블 렌더링, 엑셀 내보내기 버튼 표시

---

## Task 5: Sidebar Integration

**Files:**
- Modify: `apps/eval/components/layout/EvalSidebar.tsx`

### 5-1. 보고서 섹션 추가

- [ ] **Step 1: EvalSidebar.tsx에 import 추가**

`apps/eval/components/layout/EvalSidebar.tsx` 상단 import 블록에 `FileBarChart` 추가:

```typescript
import {
  Users, BarChart3, LogOut, Phone, RefreshCw, Clock,
  FileEdit, GraduationCap, Gift, FileText, BarChart2,
  BookOpen, Kanban, QrCode, ClipboardList, Building2, Filter, ClipboardCheck,
  ExternalLink, Package, Globe, FileBarChart,
} from 'lucide-react'
```

- [ ] **Step 2: NAV_ENTRIES 배열에 보고서 섹션 추가**

`지식·관리` 섹션 바로 앞에 삽입:

```typescript
  { type: 'section', label: '보고서' },
  { type: 'item', href: '/reports', label: '월별 실적 보고서', icon: FileBarChart },
```

결과적으로 NAV_ENTRIES 에서 `지식·관리` 앞 위치:

```typescript
  { type: 'section', label: '보고서' },
  { type: 'item', href: '/reports', label: '월별 실적 보고서', icon: FileBarChart },

  { type: 'section', label: '지식·관리' },
  { type: 'item', href: '/knowledge', label: '보조기기 결과 이력', icon: BookOpen },
  { type: 'item', href: '/migration', label: 'Sheets 동기화', icon: RefreshCw },
```

- [ ] **Step 3: `/reports` URL의 isActive 로직 확인 (이미 prefix match 방식이므로 별도 처리 불필요)**

현재 `isActive()` 함수:
```typescript
return pathname === href || pathname.startsWith(href + '/')
```
`/reports`, `/reports/2026/6` 모두 자동 매칭됨 — 수정 불필요.

- [ ] **Step 4: 브라우저에서 사이드바 "보고서" 섹션 + "월별 실적 보고서" 링크 확인**

Expected: 사이드바에 보고서 섹션 표시, 클릭 시 `/reports` 이동

---

## Task 6: 빌드 검증 + TODO 업데이트

- [ ] **Step 1: eval 앱 전체 빌드 확인**

```bash
pnpm --filter @co-at/eval build 2>&1 | tail -20
```
Expected: ✓ Compiled successfully

- [ ] **Step 2: TypeScript strict 체크**

```bash
pnpm --filter @co-at/eval exec tsc --noEmit 2>&1 | head -30
```
Expected: 오류 없음

- [ ] **Step 3: stats 앱에 보고서 링크 추가 (선택적 — StatsSidebar 또는 monthly page)**

`apps/stats/components/layout/StatsSidebar.tsx` 또는 `apps/stats/app/monthly/page.tsx` 에서 eval 앱 월별 보고서로 바로가기 링크 추가:

```typescript
<a
  href="https://eval.gwatc.cloud/reports"
  target="_blank"
  rel="noopener noreferrer"
  className="text-xs text-blue-600 hover:underline"
>
  → eval 월별 실적 보고서
</a>
```

- [ ] **Step 4: docs/TODO.md Phase H-2 체크박스 완료 처리**

`docs/TODO.md` 에서:
```markdown
- [ ] **eval** — 서비스 기록 확정 시 보고 양식 항목 자동 집계 (월별)
- [ ] **eval/stats** — 보고서 화면 연동 (현황 요약 + 엑셀 내보내기)
```
→
```markdown
- [x] **eval** — 서비스 기록 확정 시 보고 양식 항목 자동 집계 (월별)
- [x] **eval/stats** — 보고서 화면 연동 (현황 요약 + 엑셀 내보내기)
```

- [ ] **Step 5: git commit**

```bash
git add actions/monthly-report-actions.ts \
  apps/eval/app/reports/ \
  apps/eval/components/reports/ \
  apps/eval/components/layout/EvalSidebar.tsx \
  docs/TODO.md
git commit -m "feat(eval): H-2 월별 실적 보고서 — 집계·상세·엑셀 내보내기"
```

---

## Self-Review

### Spec Coverage

| 요구사항 | 담당 Task |
|---------|----------|
| 서비스 기록 확정 시 보고 양식 항목 자동 집계 (월별) | Task 1 `getMonthlyReportSummary` |
| 보고서 화면 연동 (현황 요약) | Task 3 `/reports` + Task 4 `/reports/[year]/[month]` |
| 엑셀 내보내기 | Task 2 `generateMonthlyReportExcel` + Task 4 ExportButton |
| 사이드바 메뉴 연결 | Task 5 EvalSidebar |
| stats 앱 연동 링크 | Task 6 선택 단계 |

### Placeholder Scan

- 모든 단계에 실제 코드 포함 ✓
- "TBD" 또는 "fill in details" 없음 ✓
- 타입명 일관성: `MonthlyReportSummary` (Task 1에서 정의, Task 4에서 import) ✓
- 함수명 일관성: `getYearlyMonthlyGrid`, `getMonthlyReportSummary`, `generateMonthlyReportExcel` 모두 Task 1·2에서 정의, 이후 단계에서 동일 이름 사용 ✓

### 알려진 제약

- `application_month`가 null인 레코드는 집계에서 제외됨 (마이그레이션 050 이전 데이터) — 의도적 동작
- ExcelJS는 이미 `actions/report-actions.ts`에서 사용 중이므로 추가 의존성 불필요
- `@/eval/components/...` alias가 동작 안 할 경우 상대경로로 대체 (각 단계 Note 참조)
