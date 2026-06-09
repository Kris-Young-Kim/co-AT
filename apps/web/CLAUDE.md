# web 앱 컨텍스트 (gwatc.cloud)

## 경로 별칭
- `@/*` → 모노레포 루트 (`../../*`)
- `@/components/ui/*` → `packages/ui/ui/*`
- `@/lib/supabase/*` → `packages/lib/supabase/*`

## DB 패턴
```ts
import { createAdminClient } from '@/lib/supabase/admin'
const supabase = createAdminClient()
```

## 라우트 구조
- `(public)/` — 미인증 공개 페이지 (메인, 소개 등)
- `(portal)/` — 로그인 후 포털
- `(auth)/` — 로그인/회원가입
- `dashboard/` — 로그인 후 대시보드
- `api/` — 외부 연동 전용

## 주요 특징
- 공유 액션: 루트 `actions/` (client, assessment, application 등)
- Remotion 애니메이션: `remotion/compositions/` + `components/remotion/RemotionPlayer.tsx`
- Remotion Studio: `pnpm studio`
- 공개 포털 — SEO 최적화 필요 (sitemap.ts, opengraph-image.tsx 존재)
