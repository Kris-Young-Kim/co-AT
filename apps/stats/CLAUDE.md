# stats 앱 컨텍스트 (stats.gwatc.cloud)

## 경로 별칭
- `@/stats/*` → `apps/stats/*` (로컬)
- `@/actions/*` → `apps/stats/actions/*` (로컬 액션)
- `@/*` → 모노레포 루트 (`../../*`)
- `@/components/ui/*` → `packages/ui/ui/*`
- `@/lib/supabase/*` → `packages/lib/supabase/*`
- `@/lib/utils/permissions` → `packages/auth/src/permissions.ts`

## DB 패턴
```ts
import { createAdminClient } from '@/lib/supabase/admin'
const supabase = createAdminClient()
// 주요 테이블: eval_service_records, eval_clients, stats_targets 등
```

## 라우트 구조
- `monthly/` — 월별 실적
- `yearly/` — 연간 통계
- `business/` — 사업 현황
- `programs/` — 프로그램별 통계
- `targets/` — 목표 대비 실적
- `promotion/` — 홍보·보급 통계
- `export/` — 엑셀·리포트 내보내기

## 주요 특징
- 로컬 액션: `actions/stats-actions.ts`, `annual-target-actions.ts`, `excel-export-actions.ts` 등
- 차트: `recharts` 사용
- 엑셀 내보내기: `exceljs` 사용
- 주로 read-only 집계 쿼리 — RLS는 STAFF 이상 읽기 허용
