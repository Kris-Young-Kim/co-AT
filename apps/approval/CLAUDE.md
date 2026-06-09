# approval 앱 컨텍스트 (approval.gwatc.cloud)

## 경로 별칭
- `@/*` → `apps/approval/*` (로컬 전용)
- 루트 monorepo 접근 없음

## DB 패턴
```ts
import { createSupabaseAdmin } from '@/lib/supabase-admin'
const supabase = createSupabaseAdmin()
// 테이블 네임스페이스: approval_*
```

## 라우트 구조
- `new/` — 새 결재 작성
- `[id]/` — 결재 상세·처리
- `archive/` — 완료 결재 보관함
- `settings/` — 결재 양식·설정

## 주요 특징
- 로컬 액션: `actions/approval-actions.ts` (단일 파일)
- 결재 상태: `pending` → `approved` / `rejected`
- 기안자·결재자·참조자 역할 구분 필요
