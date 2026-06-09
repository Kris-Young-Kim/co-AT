# finance 앱 컨텍스트 (finance.gwatc.cloud)

## 경로 별칭
- `@/*` → `apps/finance/*` (로컬 전용)
- 루트 monorepo 접근 없음

## DB 패턴
```ts
import { createSupabaseAdmin } from '@/lib/supabase-admin'
const supabase = createSupabaseAdmin()
// 테이블 네임스페이스: finance_*
```

## 라우트 구조
- `budget/` — 예산 계획·배정
- `categories/` — 예산 항목·분류
- `expenditures/` — 지출 내역
- `reports/` — 재무 보고서

## 주요 특징
- 로컬 액션: `actions/finance-actions.ts`, `actions/report-actions.ts`
- 기존 `apps/web` dashboard/budget/ 에서 마이그레이션된 앱
- 예산 집행률·잔액 계산은 DB 집계 쿼리 우선 (서버 계산)
- 보고서 엑셀 내보내기: `exceljs` 사용
