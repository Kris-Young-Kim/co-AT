# Finance 예산 시각화 차트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/reports` 페이지에 탭 구조와 recharts 기반 차트 5종을 추가해 예산 집행 현황을 시각화한다.

**Architecture:** `ChartsTab` 클라이언트 컴포넌트가 `getDashboardData(year)` Server Action을 `useEffect`로 호출해 데이터를 가져온다. 순수 변환 함수(`chart-utils.ts`)를 별도 모듈로 분리해 테스트 가능하게 한다. `page.tsx`는 `'downloads' | 'charts'` 탭 상태를 관리하며 두 탭은 각자의 연도/월 state를 독립적으로 보유한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, recharts 3.6.0, Tailwind CSS, Supabase (기존 `getDashboardData` 재사용), Vitest

---

## 파일 구조

| 파일 | 역할 |
|------|------|
| `migrations/084_seed_finance_categories.sql` | 신규 — 본사업/특성화/기능보강 카테고리 계층 시딩 |
| `apps/finance/package.json` | 수정 — `recharts` 추가 |
| `apps/finance/app/reports/chart-utils.ts` | 신규 — 순수 변환 함수 (`formatKRW`, `getExecutionColor`, `buildFundingSourceData`, `buildQuarterlyData`, `buildSubsidyTypeData`) |
| `apps/finance/app/reports/ChartsTab.tsx` | 신규 — 5개 차트를 담는 클라이언트 컴포넌트 |
| `apps/finance/app/reports/page.tsx` | 수정 — 탭 스위처 추가, `ChartsTab` 렌더 |
| `tests/finance/chart-utils.test.ts` | 신규 — chart-utils 유닛 테스트 |

---

### Task 1: DB 마이그레이션 — 카테고리 초기 데이터 삽입

**Files:**
- Create: `migrations/084_seed_finance_categories.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

```sql
-- migrations/084_seed_finance_categories.sql
-- Seed initial budget category hierarchy.
-- Idempotent: ON CONFLICT (code) DO NOTHING prevents duplicate inserts.
WITH
  p1 AS (
    INSERT INTO finance_budget_categories (name, code, order_no)
    VALUES ('본사업', 'MAIN', 1)
    ON CONFLICT (code) DO NOTHING
    RETURNING id
  ),
  p2 AS (
    INSERT INTO finance_budget_categories (name, code, order_no)
    VALUES ('특성화 사업', 'SPECIAL', 2)
    ON CONFLICT (code) DO NOTHING
    RETURNING id
  ),
  p3 AS (
    INSERT INTO finance_budget_categories (name, code, order_no)
    VALUES ('기능보강 사업', 'INFRA', 3)
    ON CONFLICT (code) DO NOTHING
    RETURNING id
  )
INSERT INTO finance_budget_categories (name, code, parent_id, order_no)
SELECT '경상보조', 'MAIN_CURRENT',    id, 1 FROM p1
UNION ALL
SELECT '자본보조', 'MAIN_CAPITAL',    id, 2 FROM p1
UNION ALL
SELECT '경상보조', 'SPECIAL_CURRENT', id, 1 FROM p2
UNION ALL
SELECT '자본보조', 'SPECIAL_CAPITAL', id, 2 FROM p2
UNION ALL
SELECT '자본보조', 'INFRA_CAPITAL',   id, 1 FROM p3
ON CONFLICT (code) DO NOTHING;
```

- [ ] **Step 2: Supabase MCP로 마이그레이션 적용**

`mcp__plugin_supabase_supabase__apply_migration` 툴 호출:
- `name`: `084_seed_finance_categories`
- `query`: 위 SQL 전체

- [ ] **Step 3: 삽입 결과 검증**

`mcp__plugin_supabase_supabase__execute_sql` 툴로 아래 쿼리 실행:
```sql
SELECT code, name, parent_id IS NULL AS is_root
FROM finance_budget_categories
ORDER BY order_no, parent_id NULLS FIRST;
```
예상 결과: 8개 행 (루트 3개 + 자식 5개)

- [ ] **Step 4: 커밋**

```bash
git add migrations/084_seed_finance_categories.sql
git commit -m "feat(finance): seed budget category hierarchy (본사업/특성화/기능보강)"
```

---

### Task 2: recharts 의존성 추가

**Files:**
- Modify: `apps/finance/package.json`

- [ ] **Step 1: package.json에 recharts 추가**

`apps/finance/package.json` dependencies에 추가:
```json
"recharts": "^3.6.0"
```

결과:
```json
{
  "dependencies": {
    "@clerk/nextjs": "^6.36.3",
    "@co-at/auth": "workspace:*",
    "@co-at/lib": "workspace:*",
    "@co-at/types": "workspace:*",
    "@co-at/ui": "workspace:*",
    "clsx": "^2.1.0",
    "exceljs": "^4.4.0",
    "lucide-react": "^0.344.0",
    "next": "^16.1.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^3.6.0",
    "tailwind-merge": "^2.2.1"
  }
}
```

- [ ] **Step 2: 패키지 설치**

```bash
pnpm install
```

Expected: `recharts` resolved in `apps/finance/node_modules` 또는 workspace root

- [ ] **Step 3: 커밋**

```bash
git add apps/finance/package.json pnpm-lock.yaml
git commit -m "feat(finance): add recharts dependency"
```

---

### Task 3: chart-utils.ts 순수 변환 함수 + 테스트

**Files:**
- Create: `apps/finance/app/reports/chart-utils.ts`
- Create: `tests/finance/chart-utils.test.ts`

- [ ] **Step 1: 테스트 파일 작성 (실패 상태)**

```ts
// tests/finance/chart-utils.test.ts
import { describe, it, expect } from 'vitest'
import {
  formatKRW,
  getExecutionColor,
  buildFundingSourceData,
  buildQuarterlyData,
  buildSubsidyTypeData,
} from '../../apps/finance/app/reports/chart-utils'
import type { FinanceCategoryStats, FinanceMonthlySpend } from '@co-at/types'

describe('formatKRW', () => {
  it('formats zero', () => expect(formatKRW(0)).toBe('0원'))
  it('formats thousands with comma', () => expect(formatKRW(1_000)).toBe('1,000원'))
  it('formats millions', () => expect(formatKRW(5_000_000)).toBe('5,000,000원'))
})

describe('getExecutionColor', () => {
  it('returns blue below 50', () => expect(getExecutionColor(0)).toBe('#3b82f6'))
  it('returns blue at 49', () => expect(getExecutionColor(49)).toBe('#3b82f6'))
  it('returns yellow at 50', () => expect(getExecutionColor(50)).toBe('#f59e0b'))
  it('returns yellow at 79', () => expect(getExecutionColor(79)).toBe('#f59e0b'))
  it('returns green at 80', () => expect(getExecutionColor(80)).toBe('#10b981'))
  it('returns green at 100', () => expect(getExecutionColor(100)).toBe('#10b981'))
})

describe('buildFundingSourceData', () => {
  it('splits budget and spent 50/50', () => {
    const result = buildFundingSourceData(10_000_000, 6_000_000)
    expect(result).toEqual([
      { name: '국비', 예산: 5_000_000, 집행액: 3_000_000 },
      { name: '도비', 예산: 5_000_000, 집행액: 3_000_000 },
    ])
  })
  it('handles zero values', () => {
    expect(buildFundingSourceData(0, 0)).toEqual([
      { name: '국비', 예산: 0, 집행액: 0 },
      { name: '도비', 예산: 0, 집행액: 0 },
    ])
  })
  it('rounds odd amounts down', () => {
    const result = buildFundingSourceData(9_999_999, 5_000_001)
    expect(result[0]['예산']).toBe(4_999_999)
    expect(result[0]['집행액']).toBe(2_500_000)
  })
})

describe('buildQuarterlyData', () => {
  it('groups months 1-3 into Q1', () => {
    const monthly: FinanceMonthlySpend[] = [
      { month: 1, amount: 100 }, { month: 2, amount: 200 }, { month: 3, amount: 300 },
    ]
    const result = buildQuarterlyData(monthly, 0)
    expect(result[0]).toEqual({ name: 'Q1', 집행액: 600 })
  })
  it('groups all 4 quarters correctly', () => {
    const monthly: FinanceMonthlySpend[] = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      amount: (i + 1) * 100,
    }))
    const result = buildQuarterlyData(monthly, 0)
    expect(result).toEqual([
      { name: 'Q1', 집행액: 600 },
      { name: 'Q2', 집행액: 1_500 },
      { name: 'Q3', 집행액: 2_400 },
      { name: 'Q4', 집행액: 3_300 },
    ])
  })
  it('treats missing months as zero', () => {
    const result = buildQuarterlyData([], 0)
    expect(result).toEqual([
      { name: 'Q1', 집행액: 0 },
      { name: 'Q2', 집행액: 0 },
      { name: 'Q3', 집행액: 0 },
      { name: 'Q4', 집행액: 0 },
    ])
  })
})

describe('buildSubsidyTypeData', () => {
  const makeCategory = (id: string, name: string, code: string, parentId: string | null) => ({
    id, name, code, parent_id: parentId, order_no: 0, created_at: '',
  })

  it('returns name as "{parent} {child}" with budget and spent', () => {
    const stats: FinanceCategoryStats[] = [
      {
        category: makeCategory('1', '본사업', 'MAIN', null),
        budget: 10_000_000, spent: 4_000_000, remaining: 6_000_000, rate: 40,
        children: [
          { category: makeCategory('2', '경상보조', 'MAIN_CURRENT', '1'), budget: 5_000_000, spent: 2_000_000, remaining: 3_000_000, rate: 40 },
          { category: makeCategory('3', '자본보조', 'MAIN_CAPITAL', '1'), budget: 5_000_000, spent: 2_000_000, remaining: 3_000_000, rate: 40 },
        ],
      },
    ]
    expect(buildSubsidyTypeData(stats)).toEqual([
      { name: '본사업 경상보조', 예산: 5_000_000, 집행액: 2_000_000 },
      { name: '본사업 자본보조', 예산: 5_000_000, 집행액: 2_000_000 },
    ])
  })

  it('returns empty array when no children', () => {
    const stats: FinanceCategoryStats[] = [
      { category: makeCategory('1', '본사업', 'MAIN', null), budget: 0, spent: 0, remaining: 0, rate: 0 },
    ]
    expect(buildSubsidyTypeData(stats)).toEqual([])
  })

  it('flattens multiple parents', () => {
    const stats: FinanceCategoryStats[] = [
      {
        category: makeCategory('1', '본사업', 'MAIN', null),
        budget: 0, spent: 0, remaining: 0, rate: 0,
        children: [
          { category: makeCategory('2', '경상보조', 'MAIN_CURRENT', '1'), budget: 100, spent: 50, remaining: 50, rate: 50 },
        ],
      },
      {
        category: makeCategory('3', '기능보강 사업', 'INFRA', null),
        budget: 0, spent: 0, remaining: 0, rate: 0,
        children: [
          { category: makeCategory('4', '자본보조', 'INFRA_CAPITAL', '3'), budget: 200, spent: 80, remaining: 120, rate: 40 },
        ],
      },
    ]
    expect(buildSubsidyTypeData(stats)).toEqual([
      { name: '본사업 경상보조', 예산: 100, 집행액: 50 },
      { name: '기능보강 사업 자본보조', 예산: 200, 집행액: 80 },
    ])
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
pnpm test tests/finance/chart-utils.test.ts
```

Expected: FAIL — `Cannot find module '../../apps/finance/app/reports/chart-utils'`

- [ ] **Step 3: chart-utils.ts 구현**

```ts
// apps/finance/app/reports/chart-utils.ts
import type { FinanceCategoryStats, FinanceMonthlySpend } from '@co-at/types'

export function formatKRW(n: number): string {
  return n.toLocaleString('ko-KR') + '원'
}

export function getExecutionColor(rate: number): string {
  if (rate < 50) return '#3b82f6'
  if (rate < 80) return '#f59e0b'
  return '#10b981'
}

export interface FundingSourceRow {
  name: string
  예산: number
  집행액: number
}

export function buildFundingSourceData(totalBudget: number, totalSpent: number): FundingSourceRow[] {
  return [
    { name: '국비', 예산: Math.floor(totalBudget * 0.5), 집행액: Math.floor(totalSpent * 0.5) },
    { name: '도비', 예산: Math.floor(totalBudget * 0.5), 집행액: Math.floor(totalSpent * 0.5) },
  ]
}

export interface QuarterlyRow {
  name: string
  집행액: number
}

export function buildQuarterlyData(monthlySpend: FinanceMonthlySpend[], _totalBudget: number): QuarterlyRow[] {
  const QUARTERS = [
    { name: 'Q1', months: [1, 2, 3] },
    { name: 'Q2', months: [4, 5, 6] },
    { name: 'Q3', months: [7, 8, 9] },
    { name: 'Q4', months: [10, 11, 12] },
  ]
  return QUARTERS.map(q => ({
    name: q.name,
    집행액: q.months.reduce(
      (sum, m) => sum + (monthlySpend.find(ms => ms.month === m)?.amount ?? 0),
      0
    ),
  }))
}

export interface SubsidyTypeRow {
  name: string
  예산: number
  집행액: number
}

export function buildSubsidyTypeData(categoryStats: FinanceCategoryStats[]): SubsidyTypeRow[] {
  return categoryStats.flatMap(s =>
    (s.children ?? []).map(child => ({
      name: `${s.category.name} ${child.category.name}`,
      예산: child.budget,
      집행액: child.spent,
    }))
  )
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
pnpm test tests/finance/chart-utils.test.ts
```

Expected: PASS — 16 tests passed

- [ ] **Step 5: 커밋**

```bash
git add apps/finance/app/reports/chart-utils.ts tests/finance/chart-utils.test.ts
git commit -m "feat(finance): chart-utils — formatKRW, getExecutionColor, buildFundingSourceData, buildQuarterlyData, buildSubsidyTypeData"
```

---

### Task 4: ChartsTab 컴포넌트 구현

**Files:**
- Create: `apps/finance/app/reports/ChartsTab.tsx`

- [ ] **Step 1: ChartsTab.tsx 생성**

```tsx
// apps/finance/app/reports/ChartsTab.tsx
'use client'

import { useEffect, useState } from 'react'
import {
  RadialBarChart, RadialBar, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, LabelList, ResponsiveContainer,
} from 'recharts'
import { getDashboardData } from '@/actions/finance-actions'
import type { FinanceDashboardData } from '@co-at/types'
import {
  formatKRW, getExecutionColor,
  buildFundingSourceData, buildQuarterlyData, buildSubsidyTypeData,
} from './chart-utils'

interface Props {
  initialYear: number
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-lg p-5">
      <p className="font-semibold mb-3">{title}</p>
      {children}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-100 rounded-lg h-64" />
        <div className="bg-gray-100 rounded-lg h-64" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-100 rounded-lg h-64" />
        <div className="bg-gray-100 rounded-lg h-64" />
      </div>
      <div className="bg-gray-100 rounded-lg h-64" />
    </div>
  )
}

export function ChartsTab({ initialYear }: Props) {
  const now = new Date()
  const [year, setYear] = useState(initialYear)
  const [data, setData] = useState<FinanceDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getDashboardData(year)
      .then(setData)
      .catch(() => setError('데이터를 불러오지 못했습니다'))
      .finally(() => setLoading(false))
  }, [year])

  return (
    <div className="space-y-6">
      <div className="flex gap-2 items-center">
        <select
          value={year}
          onChange={e => setYear(parseInt(e.target.value))}
          className="border rounded-md px-3 py-1.5 text-sm"
        >
          {years.map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
      </div>

      {loading && <Skeleton />}
      {!loading && error && <p className="text-red-500 text-sm">{error}</p>}
      {!loading && !error && data && <Charts data={data} />}
    </div>
  )
}

function Charts({ data }: { data: FinanceDashboardData }) {
  const executionColor = getExecutionColor(data.executionRate)
  const fundingData    = buildFundingSourceData(data.totalBudget, data.totalSpent)
  const quarterlyData  = buildQuarterlyData(data.monthlySpend, data.totalBudget)
  const subsidyData    = buildSubsidyTypeData(data.categoryStats)
  const businessData   = data.categoryStats.map(s => ({ name: s.category.name, rate: s.rate }))

  return (
    <div className="space-y-4">
      {/* Row 1 */}
      <div className="grid grid-cols-2 gap-4">
        {/* Chart 1: 전체 집행률 */}
        <ChartCard title="전체 집행률">
          <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                cx="50%" cy="50%"
                innerRadius="60%" outerRadius="80%"
                barSize={20}
                data={[{ name: '집행률', value: data.executionRate, fill: executionColor }]}
                startAngle={90} endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#f3f4f6' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold" style={{ color: executionColor }}>
                {data.executionRate}%
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 text-center">
            <div>
              <p className="text-gray-500 text-xs">총예산</p>
              <p className="text-sm font-medium">{formatKRW(data.totalBudget)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">집행액</p>
              <p className="text-sm font-medium">{formatKRW(data.totalSpent)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">잔액</p>
              <p className="text-sm font-medium">{formatKRW(data.remaining)}</p>
            </div>
          </div>
        </ChartCard>

        {/* Chart 2: 국비·도비 구분 */}
        <ChartCard title="국비·도비 구분">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={fundingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={n => Math.round(n / 10_000) + '만'} width={55} />
              <Tooltip formatter={(v: number) => formatKRW(v)} />
              <Legend />
              <Bar dataKey="예산" fill="#93c5fd" />
              <Bar dataKey="집행액" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-4">
        {/* Chart 3: 사업별 집행률 */}
        <ChartCard title="사업별 집행률">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={businessData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 120]} tickFormatter={n => n + '%'} />
              <Tooltip formatter={(v: number) => v + '%'} />
              <ReferenceLine
                y={100}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{ value: '100%', position: 'right', fontSize: 11 }}
              />
              <Bar dataKey="rate" fill="#10b981" name="집행률">
                <LabelList dataKey="rate" position="top" formatter={(v: number) => v + '%'} fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 4: 사업별 × 보조유형 */}
        <ChartCard title="사업별 · 보조유형별">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={subsidyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={n => Math.round(n / 10_000) + '만'} width={55} />
              <Tooltip formatter={(v: number) => formatKRW(v)} />
              <Legend />
              <Bar dataKey="예산" fill="#a5b4fc" />
              <Bar dataKey="집행액" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: full width */}
      <ChartCard title="분기별 지출">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={quarterlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={n => Math.round(n / 10_000) + '만'} width={55} />
            <Tooltip formatter={(v: number) => formatKRW(v)} />
            <ReferenceLine
              y={data.totalBudget / 4}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              label={{ value: '균등 기준', position: 'right', fontSize: 11 }}
            />
            <Bar dataKey="집행액" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript 타입 체크**

```bash
cd apps/finance && npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add apps/finance/app/reports/ChartsTab.tsx
git commit -m "feat(finance): ChartsTab — 5종 차트 컴포넌트 (집행률/국비도비/사업별/보조유형/분기별)"
```

---

### Task 5: page.tsx 탭 구조 추가

**Files:**
- Modify: `apps/finance/app/reports/page.tsx`

- [ ] **Step 1: page.tsx를 탭 구조로 업데이트**

기존 파일 전체를 아래로 교체:

```tsx
// apps/finance/app/reports/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { generateMonthlyReport, generateAnnualBudgetReport } from '@/actions/report-actions'
import { ChartsTab } from './ChartsTab'

function DownloadButton({ label, onDownload }: { label: string; onDownload: () => Promise<{ buffer?: number[]; filename?: string; error?: string; success: boolean }> }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    const result = await onDownload()
    if (!result.success || !result.buffer) {
      setError(result.error ?? '다운로드 실패')
      setLoading(false)
      return
    }
    const blob = new Blob([new Uint8Array(result.buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = result.filename ?? 'report.xlsx'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setLoading(false)
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full bg-emerald-600 text-white px-4 py-2 rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? '생성 중...' : label}
      </button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

function ReportCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
      </div>
      {children}
    </div>
  )
}

type Tab = 'downloads' | 'charts'

export default function ReportsPage() {
  const now   = new Date()
  const [tab, setTab]     = useState<Tab>('downloads')
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const years  = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">리포트</h1>

      {/* Tab switcher */}
      <div className="flex gap-1 border-b">
        {(['downloads', 'charts'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {t === 'downloads' ? '리포트 출력' : '예산 현황'}
          </button>
        ))}
      </div>

      {tab === 'downloads' && (
        <>
          <div className="flex gap-3 items-center">
            <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="border rounded-md px-3 py-1.5 text-sm">
              {years.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
            <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="border rounded-md px-3 py-1.5 text-sm">
              {months.map(m => <option key={m} value={m}>{m}월</option>)}
            </select>
            <span className="text-sm text-gray-400">선택 기간 리포트에 적용됩니다</span>
          </div>

          <div className="grid gap-4">
            <ReportCard title="월간 지출 내역" desc={`${year}년 ${month}월 지출 내역 Excel 다운로드`}>
              <DownloadButton
                label="Excel 다운로드"
                onDownload={() => generateMonthlyReport({ year, month })}
              />
            </ReportCard>

            <ReportCard title="연간 예산 집계표" desc={`${year}년 카테고리별 예산/지출/잔액 Excel 다운로드`}>
              <DownloadButton
                label="Excel 다운로드"
                onDownload={() => generateAnnualBudgetReport({ year })}
              />
            </ReportCard>

            <ReportCard title="결산 보고서 인쇄" desc="인쇄 전용 레이아웃으로 이동 후 브라우저 인쇄">
              <Link
                href={`/reports/print?year=${year}`}
                target="_blank"
                className="block w-full text-center border px-4 py-2 rounded-md text-sm hover:bg-gray-50"
              >
                인쇄 페이지 열기
              </Link>
            </ReportCard>
          </div>
        </>
      )}

      {tab === 'charts' && <ChartsTab initialYear={now.getFullYear()} />}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript 타입 체크**

```bash
cd apps/finance && npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 전체 테스트 통과 확인**

```bash
pnpm test tests/finance/chart-utils.test.ts
```

Expected: PASS — 16 tests passed

- [ ] **Step 4: 커밋**

```bash
git add apps/finance/app/reports/page.tsx
git commit -m "feat(finance): reports 페이지에 예산 현황 탭 추가"
```
