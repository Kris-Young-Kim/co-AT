# Finance 예산 시각화 차트 — 설계 스펙

**날짜**: 2026-06-11  
**범위**: finance 앱 — `/reports` 페이지 + DB 초기 카테고리 시딩  
**목표**: 예산 집행률·사업별 비교·국비도비 구분·분기별 지출을 recharts 차트로 시각화

---

## 배경

현재 `/reports` 페이지는 Excel 다운로드·인쇄 기능만 제공하며 시각적 집행 현황을 볼 수 없다.
`finance_budget_categories` 테이블에 초기 사업 계층 데이터도 없는 상태다.
카테고리 시딩 + 차트 탭 추가로 재무 담당자가 별도 페이지 이동 없이 연도별 예산 현황을 한눈에 파악할 수 있게 한다.

---

## 사업 계층 구조 (도메인)

| 사업 | 허용 보조유형 |
|------|--------------|
| 본사업 | 경상보조, 자본보조 |
| 특성화 사업 | 경상보조, 자본보조 |
| 기능보강 사업 | 자본보조만 |

---

## 0. DB 마이그레이션 — `084_seed_finance_categories.sql`

`finance_budget_categories` 테이블에 초기 카테고리 계층을 삽입한다.
`code` 컬럼이 UNIQUE이므로 `ON CONFLICT (code) DO NOTHING`으로 멱등 보장.

```sql
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

---

## 1. 탭 구조

`/reports/page.tsx` 상단에 탭 스위처 추가:

| 탭 | 내용 |
|----|------|
| 리포트 출력 | 기존 Excel 다운로드·인쇄 카드 (그대로 유지) |
| 예산 현황 | `<ChartsTab>` — 연도 선택 + 5개 차트 |

탭 상태(`'downloads' | 'charts'`)는 `page.tsx`의 `useState`로 관리.
두 탭은 같은 year/month state를 공유하지 않음 (각자 독립).

---

## 2. 데이터 소스

기존 `getDashboardData(year): Promise<FinanceDashboardData>` 재사용 — 액션 수정 불필요.

```ts
interface FinanceDashboardData {
  year: number
  totalBudget: number
  totalSpent: number
  remaining: number
  executionRate: number                               // 0–100
  categoryStats: FinanceCategoryStats[]              // roots = 사업, children = 보조유형
  monthlySpend: { month: number; amount: number }[]  // 1–12
}
```

파생 계산:
- 국비 예산/집행 = `totalBudget × 0.5` / `totalSpent × 0.5`
- 도비 예산/집행 = `totalBudget × 0.5` / `totalSpent × 0.5`
- 분기별: `monthlySpend[0..2]` = Q1, `[3..5]` = Q2, `[6..8]` = Q3, `[9..11]` = Q4

---

## 3. ChartsTab 컴포넌트

**파일**: `apps/finance/app/reports/ChartsTab.tsx`

```tsx
'use client'

interface Props {
  initialYear: number  // page.tsx가 new Date().getFullYear() 전달
}
```

- 자체 `year` state (연도 선택자, 범위: 현재연도 -2 ~ +2)
- `useEffect([year])` → `getDashboardData(year)` 호출 → `data` state 세팅
- `loading` state: `animate-pulse` 스켈레톤 표시
- 에러 시: "데이터를 불러오지 못했습니다" 텍스트 표시
- 금액 포맷 헬퍼: `formatKRW(n: number) = n.toLocaleString('ko-KR') + '원'`

---

## 4. 차트 5종

### 4-1. 전체 집행률 (`RadialBarChart`)

- recharts `RadialBarChart` — 원형 게이지 (0–100%)
- 중앙에 `executionRate%` 큰 숫자 오버레이 (절대 위치)
- 카드 하단: 총예산 / 집행액 / 잔액 3개 수치

색상 기준 (`fill` 속성):
- `executionRate < 50` → `#3b82f6` (파랑)
- `50 ≤ executionRate < 80` → `#f59e0b` (노랑)
- `executionRate ≥ 80` → `#10b981` (초록)

### 4-2. 국비·도비 구분 (`BarChart` grouped)

- X축: 국비 / 도비
- 각 그룹 2개 바: 예산(연한) / 집행액(진한)
- 국비: `#93c5fd` / `#3b82f6`, 도비: `#c4b5fd` / `#7c3aed`
- `Legend` 표시

### 4-3. 사업별 집행률 (`BarChart`)

- 데이터: `categoryStats` roots (parent_id 없는 항목)
- X축: 본사업 / 특성화 사업 / 기능보강 사업
- Y축: 집행률 (%)
- 바 색상: `#10b981`
- `ReferenceLine` y=100 — 점선 라벨 "100%"
- `LabelList` 각 바 위에 `{rate}%` 표시

### 4-4. 사업별 × 보조유형 (`BarChart` grouped)

- 데이터: `categoryStats` 전체 children 펼치기
  ```ts
  categoryStats.flatMap(s => s.children ?? [])
  // → 경상보조(본), 자본보조(본), 경상보조(특화), 자본보조(특화), 자본보조(기능)
  ```
- X축: `{parent명} {child명}` (예: "본사업 경상보조")
- 2개 바: 예산(`#a5b4fc`) / 집행액(`#6366f1`)
- `Legend` 표시

### 4-5. 분기별 지출 (`BarChart` + `ReferenceLine`)

- 전체 너비
- X축: Q1 / Q2 / Q3 / Q4
- Y축: 집행액(원)
- 바 색상: `#10b981`
- `ReferenceLine` y=`totalBudget / 4` — 점선, 라벨 "균등 기준"

---

## 5. 레이아웃

```
[리포트 출력] [예산 현황]   ← 탭 스위처

예산 현황 탭:
  연도: [2026년 ▼]

  2열 그리드:
  ┌──────────────────────┐  ┌──────────────────────┐
  │ 전체 집행률           │  │ 국비·도비 구분        │
  │ RadialBar + 수치     │  │ Grouped BarChart     │
  └──────────────────────┘  └──────────────────────┘

  2열 그리드:
  ┌──────────────────────┐  ┌──────────────────────┐
  │ 사업별 집행률         │  │ 사업별×보조유형        │
  │ BarChart (%)        │  │ Grouped BarChart     │
  └──────────────────────┘  └──────────────────────┘

  1열 전체:
  ┌─────────────────────────────────────────────────┐
  │ 분기별 지출 + 균등기준선                          │
  └─────────────────────────────────────────────────┘
```

---

## 6. 의존성

- `recharts` 추가: `apps/finance/package.json` (버전: `^3.6.0`, 모노레포 루트와 일치)

---

## 파일 변경 목록

| 파일 | 변경 유형 |
|------|-----------|
| `migrations/084_seed_finance_categories.sql` | 신규 생성 (초기 카테고리 시딩) |
| `apps/finance/app/reports/page.tsx` | 탭 스위처 추가, `ChartsTab` import |
| `apps/finance/app/reports/ChartsTab.tsx` | 신규 생성 |
| `apps/finance/package.json` | `recharts` 추가 |
