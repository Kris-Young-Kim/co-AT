# 예산·재무 관리 시스템 설계 (Phase 7)

**작성일:** 2026-05-08
**앱:** `apps/finance` → `finance.gwatc.cloud`
**사용자:** 관리자(ADMIN), 재무담당(MANAGER), 일반직원(STAFF)

---

## 1. 목표

보조공학센터의 예산 편성 및 지출 내역을 통합 관리한다.
- 연간 예산을 계층형 카테고리(대분류 > 소분류)로 편성
- 지출 결의서 승인(approval 연동) 시 자동으로 지출 내역 생성
- 담당자가 수동 지출 입력 및 보완 가능
- 예산 vs 실적 비교 대시보드, Excel/PDF 리포트 출력

---

## 2. 아키텍처

```
approval_documents (approved + expenditure)
        │ Server Action 트리거
        ▼
finance_expenditures
  (source_approval_id FK, is_manual=false)
        │
        ├── 담당자 보완 (category, note 등 수정)
        └── 수동 입력 (is_manual=true, source_approval_id=null)

finance_budgets ──────────────────────────────────────────
  (year × category_id)                                    │
        │                                                 │
finance_budget_categories (대분류 > 소분류 계층)          │
        │                                                 │
        └── 대시보드: 예산 vs 지출 집계 ─────────────────┘
```

**Tech Stack:** Next.js 16 App Router, Supabase (service role), Clerk (`@co-at/auth`), ExcelJS, `window.print()` + `@media print`

---

## 3. 데이터 모델

### `finance_budget_categories`

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| parent_id | uuid FK self-ref nullable | null이면 대분류 |
| name | text NOT NULL | 카테고리명 |
| code | text UNIQUE | 식별 코드 (예: `BUSINESS_RENTAL`) |
| order_no | integer DEFAULT 0 | 정렬 순서 |
| created_at | timestamptz | |

### `finance_budgets`

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| year | integer NOT NULL | 예산 연도 |
| category_id | uuid FK | finance_budget_categories.id |
| amount | bigint NOT NULL | 예산액 (원 단위) |
| note | text | 비고 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

UNIQUE(year, category_id)

### `finance_expenditures`

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| category_id | uuid FK nullable | finance_budget_categories.id |
| spend_date | date NOT NULL | 지출일 |
| amount | bigint NOT NULL | 지출액 (원 단위) |
| description | text NOT NULL | 지출 내용 |
| source_approval_id | uuid FK nullable | approval_documents.id (approval 연동 시) |
| is_manual | boolean DEFAULT false | 수동 입력 여부 |
| receipt_url | text | 영수증 첨부 URL |
| note | text | 담당자 메모 |
| created_by | text NOT NULL | Clerk user ID |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `finance_budget_adjustments` (예산 변경 이력)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| budget_id | uuid FK | finance_budgets.id |
| before_amount | bigint | 변경 전 금액 |
| after_amount | bigint | 변경 후 금액 |
| reason | text | 변경 사유 |
| adjusted_by | text | Clerk user ID |
| adjusted_at | timestamptz | |

---

## 4. 페이지 구성

### `/` — 예산 대시보드
- **요약 카드 4개:** 연간 총예산 / 총지출 / 잔액 / 집행률(%)
- **카테고리별 잔액 현황 테이블:** 대분류 > 소분류 계층, 예산/지출/잔액/집행률 컬럼
- **월별 지출 추이 차트:** Bar chart, 해당 연도 1~12월
- **연도 selector:** 상단 우측, 기본값 현재 연도

### `/budget` — 예산 관리
- 연도별 예산 편성 테이블 (카테고리 트리 구조 표시)
- 인라인 금액 편집 (ADMIN 전용)
- 변경 이력 토글 (버튼 클릭 시 조정 이력 표시)
- 신규 예산 연도 복사 기능 (전년도 금액 그대로 복사)

### `/expenditures` — 지출 내역 목록
- 필터: 기간(월별), 카테고리, 유형(전체/approval연동/수동입력)
- 테이블 컬럼: 지출일, 카테고리, 내용, 금액, 유형 뱃지, 결재연동 링크
- approval 연동 건: 뱃지 "결재" + 클릭 시 해당 approval 문서 링크
- 수동 입력 버튼 (ADMIN/MANAGER)

### `/expenditures/new` — 지출 수동 입력
- 폼 필드: 지출일, 카테고리(계층 선택), 금액, 내용, 영수증 업로드, 메모
- 제출 후 `/expenditures` 리다이렉트

### `/reports` — 리포트 출력
- **기간 선택:** 월 picker + 연도 selector
- **출력 유형 카드 3개:**
  - 월간 지출 내역 (Excel 다운로드)
  - 연간 예산 집계표 (Excel 다운로드)
  - 결산 보고서 인쇄 (별도 `/reports/print` 라우트로 이동)
- 다운로드 버튼: Phase 13 `DownloadReportButton` 패턴 재사용
- `/reports/print` — `@media print` CSS, 인쇄 전용 레이아웃 (실제 양식은 추후 확정)

### `/categories` — 카테고리 관리 (ADMIN 전용)
- 대분류/소분류 트리 뷰
- 카테고리 추가/수정/삭제 (소분류가 있는 대분류 삭제 불가)
- 정렬 순서 조정

---

## 5. approval 연동 상세

`apps/approval/actions/approval-actions.ts`의 `processApproval()` 내부:

```
if (newStatus === 'approved' && document.type === 'expenditure') {
  → finance_expenditures INSERT
    {
      category_id: null,  // 담당자가 나중에 분류
      spend_date: content.spend_date,
      amount: content.amount,
      description: content.item_name,
      source_approval_id: document.id,
      is_manual: false,
      created_by: actedBy,
    }
}
```

finance 앱 Server Action(`createExpenditureFromApproval`)을 approval 앱에서 직접 import하지 않고, **동일 Supabase DB에 insert**하는 방식으로 결합도 최소화.

---

## 6. 권한

| 기능 | ADMIN | MANAGER | STAFF |
|---|---|---|---|
| 대시보드 조회 | ✅ | ✅ | ✅ |
| 예산 편성/수정 | ✅ | ❌ | ❌ |
| 지출 수동 입력 | ✅ | ✅ | ❌ |
| 지출 내역 조회 | ✅ | ✅ | ✅ |
| 리포트 출력 | ✅ | ✅ | ❌ |
| 카테고리 관리 | ✅ | ❌ | ❌ |

---

## 7. RLS 정책

모든 테이블에 RLS 활성화. service_role이 모든 writes 처리.
anon/authenticated role은 읽기만 허용 (row-level 필터는 Server Action에서 Clerk 역할로 처리).

---

## 8. 마이그레이션 번호 주의사항

Phase 13(`feat/phase13-migration-report`)에서 041~044를 사용함.
`feature/approval-phase6` 브랜치의 플랜은 `041_create_approval_tables.sql`로 작성되어 있으나
main 병합 전 **`045_create_approval_tables.sql`로 리네임 필요**.
finance는 `046`번 사용.

---

## 9. 파일 맵

| 파일 | 역할 |
|---|---|
| `migrations/046_create_finance_tables.sql` | 4개 테이블 + RLS + 인덱스 |
| `packages/types/src/finance.types.ts` | 재무 TypeScript 타입 |
| `packages/types/src/index.ts` | finance.types export 추가 |
| `apps/finance/lib/supabase-admin.ts` | Supabase service role client |
| `apps/finance/actions/finance-actions.ts` | 모든 Server Actions |
| `apps/finance/actions/report-actions.ts` | Excel/PDF 생성 Server Actions |
| `apps/finance/components/FinanceSidebar.tsx` | 네비게이션 사이드바 |
| `apps/finance/app/layout.tsx` | FinanceSidebar 추가 |
| `apps/finance/app/page.tsx` | 예산 대시보드 |
| `apps/finance/app/budget/page.tsx` | 예산 관리 |
| `apps/finance/app/expenditures/page.tsx` | 지출 내역 목록 |
| `apps/finance/app/expenditures/new/page.tsx` | 지출 수동 입력 |
| `apps/finance/app/reports/page.tsx` | 리포트 출력 UI |
| `apps/finance/app/reports/print/page.tsx` | 인쇄 전용 레이아웃 |
| `apps/finance/app/categories/page.tsx` | 카테고리 관리 |
| `apps/approval/actions/approval-actions.ts` | processApproval에 finance insert 추가 |
