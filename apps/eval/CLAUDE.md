# eval 앱 컨텍스트

## 경로 별칭 (tsconfig)
- `@/eval/*` → `apps/eval/*` (로컬 파일)
- `@/*` → 모노레포 루트 (`../../*`)
- `@/components/ui/*` → `packages/ui/ui/*`
- `@/lib/supabase/*` → `packages/lib/supabase/*`
- `@/types/*` → `packages/lib/types/*`

## DB 패턴
```ts
// 항상 createAdminClient() 사용 (동기), 타입 캐스트 필요 시 as any
import { createAdminClient } from '@/lib/supabase/admin'
const supabase = createAdminClient()
const { data, error } = await supabase.from('eval_clients').select('*')
```

## 인증 패턴
```ts
import { auth } from '@clerk/nextjs/server'
import { hasAdminOrStaffPermission } from '@/packages/auth/permissions'
const { userId } = await auth()
if (!userId || !hasAdminOrStaffPermission(userId)) return { success: false, error: 'Unauthorized' }
```

## 테스트 패턴 (Vitest)
```ts
import { createAdminClient } from '@/lib/supabase/admin'
vi.mock('@/lib/supabase/admin')
// makeChain: thenable mock으로 체인 끝에 .then 필요
const makeChain = (overrides) => ({ from: () => ({ select: () => ({ ...overrides, then: (r) => r({ data:[], error:null }) }) }) })
vi.mocked(createAdminClient).mockReturnValueOnce(makeChain({ ... }) as any)
```

## 주요 액션 파일 (actions/)
- `grant-assessment-actions.ts` — 교부사업 평가
- `checklist-template-actions.ts` — 체크리스트 템플릿
- `client-actions.ts` — 대상자 CRUD
- `call-log-actions.ts` — 콜로그

## 주요 앱 라우트
- `app/grant-eval/` — 교부사업 평가 (Phase F)
- `app/call-log/` — 상담 콜로그
- `app/print/grant-eval/[id]/` — 교부평가 인쇄
