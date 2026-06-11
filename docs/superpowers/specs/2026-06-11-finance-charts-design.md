# Finance 예산 시각화 차트 — 설계 스펙

**날짜**: 2026-06-11  
**범위**: finance 앱 — `/reports` 페이지  
**목표**: 예산 집행률·분기별 비교·국비도비 구분을 recharts 차트로 시각화

---

## 배경

현재 `/reports` 페이지는 Excel 다운로드·인쇄 기능만 제공하며 시각적 집행 현황을 볼 수 없다.
재무 담당자가 별도 페이지 이동 없이 연도별 예산 현황을 한눈에 파악할 수 있도록 차트 탭을 추가한다.

---

## 데이터 소스

기존 `getDashboardData(year): Promise<FinanceDashboardData>` 재사용:

```ts
interface FinanceDashboardData {
  year: number
  totalBudget: number
  totalSpent: number
  remaining: number
  executionRate: number           // 0–100
  categoryStats: FinanceCategoryStats[]
  monthlySpend: { month: number; amount: number }[]  // 1–12
}
```

국비·도비 분할은 DB 변경 없이 순수 계산:
- 국비 예산 = `totalBudget × 0.5`, 국비 집행 = `totalSpent × 0.5`
- 도비 예산 = `totalBudget × 0.5`, 도비 집행 = `totalSpent × 0.5`

분기별 집계: `monthlySpend[0..2]` = Q1, `[3..5]` = Q2, `[6..8]` = Q3, `[9..11]` = Q4

---

## 1. 탭 구조

`/reports/page.tsx` 상단에 탭 스위처 추가:

| 탭 | 내용 |
|----|------|
| 리포트 출력 | 기존 Excel 다운로드·인쇄 카드 (그대로 유지) |
| 예산 현황 | `<ChartsTab>` — 연도 선택 + 3개 차트 |

탭 상태(`'downloads' | 'charts'`)는 `page.tsx`의 `useState`로 관리.  
두 탭은 같은 `year` / `month` state를 공유하지 않음 (각자 독립 — 다운로드용 월·연도 vs 차트용 연도).

---

## 2. ChartsTab 컴포넌트

**파일**: `apps/finance/app/reports/ChartsTab.tsx`

```tsx
'use client'

interface Props {
  initialYear: number  // page.tsx가 new Date().getFullYear() 전달
}
```

- 자체 `year` state (연도 선택자)
- `useEffect([year])` → `getDashboardData(year)` 호출 → `data` state 세팅
- `loading` state: 스켈레톤(`animate-pulse`) 표시
- 에러 시: "데이터를 불러오지 못했습니다" 텍스트 표시

---

## 3. 차트 3종

### 3-1. 집행률 카드 (`RadialBarChart`)

- recharts `RadialBarChart` — 원형 게이지 (0–100%)
- 중앙에 `executionRate%` 큰 숫자 오버레이 (절대 위치)
- 카드 하단: 총예산 / 집행액 / 잔액 3개 수치 (포맷: `원` 단위 한국식)

색상 기준:
- `executionRate < 50` → 파란색 (`#3b82f6`)
- `50 ≤ executionRate < 80` → 노란색 (`#f59e0b`)
- `executionRate ≥ 80` → 초록색 (`#10b981`)

### 3-2. 국비·도비 구분 (`BarChart` grouped)

- X축: 국비 / 도비
- 각 그룹에 바 2개: 예산 (연한 색) / 집행액 (진한 색)
- 색상: 국비 = 파란 계열(`#93c5fd` / `#3b82f6`), 도비 = 보라 계열(`#c4b5fd` / `#7c3aed`)
- `Legend` 표시

### 3-3. 분기별 지출 (`BarChart` + `ReferenceLine`)

- 전체 너비
- X축: Q1 / Q2 / Q3 / Q4
- Y축: 집행액(원)
- 각 분기별 집행액 바 (색상: `#10b981`)
- `ReferenceLine` y=`totalBudget / 4` — 점선, 라벨 "균등 기준"

---

## 4. 레이아웃

```
[리포트 출력] [예산 현황]   ← 탭 스위처

예산 현황 탭:
  연도: [2026년 ▼]

  2열 그리드:
  ┌──────────────────────┐  ┌──────────────────────┐
  │ 집행률 RadialBar     │  │ 국비·도비 GroupedBar  │
  └──────────────────────┘  └──────────────────────┘

  1열 전체:
  ┌─────────────────────────────────────────────────┐
  │ 분기별 지출 BarChart + ReferenceLine             │
  └─────────────────────────────────────────────────┘
```

금액 포맷 헬퍼: `formatKRW(n: number): string` → `n.toLocaleString('ko-KR') + '원'`

---

## 5. 의존성

- `recharts` 추가: `apps/finance/package.json`
- 버전: 모노레포 루트 `recharts@3.6.0` 과 일치

---

## 파일 변경 목록

| 파일 | 변경 유형 |
|------|-----------|
| `apps/finance/app/reports/page.tsx` | 탭 스위처 추가, `ChartsTab` import |
| `apps/finance/app/reports/ChartsTab.tsx` | 신규 생성 |
| `apps/finance/package.json` | `recharts` 추가 |
