# admin 앱 컨텍스트 (admin.gwatc.cloud)

## 경로 별칭
- `@/*` → 모노레포 루트 (`../../*`)
- `@/components/ui/*` → `packages/ui/ui/*`
- `@/lib/supabase/*` → `packages/lib/supabase/*`

## DB 패턴
```ts
import { createAdminClient } from '@/lib/supabase/admin'
const supabase = createAdminClient()
```

## 라우트 구조 (`app/(app)/`)
- `users/` — 사용자·역할 관리
- `settings/` — 시스템 설정
- `notices-management/` — 공지 관리
- `schedule/` — 일정 관리
- `messenger/` — 내부 메신저
- `work-tasks/` — 업무 태스크
- `agent-chat/` — AI 에이전트 채팅

## 주요 특징
- ADMIN 역할 전용 앱 — 모든 라우트 `hasAdminPermission()` 검증 필수
- 공유 액션: 루트 `actions/` (chat-actions, audit-actions 등)
- `lib/backup.ts` — 데이터 백업 유틸
