# automation 앱 컨텍스트 (automation.gwatc.cloud)

## 경로 별칭
- `@/*` → `apps/automation/*` (로컬 전용)
- 루트 monorepo 접근 없음

## DB 패턴
```ts
import { createSupabaseAdmin } from '@/lib/supabase-admin'
const supabase = createSupabaseAdmin()
```

## 라우트 구조
- `channels/` — 알림 채널 설정 (이메일, SMS 등)
- `send/` — 수동 알림 발송
- `logs/` — 발송 이력
- `api/` — Webhook·Cron 수신 전용

## 주요 특징
- 로컬 액션: `actions/channel-actions.ts`, `log-actions.ts`, `notify-actions.ts`
- `lib/resend.ts` — Resend 이메일 클라이언트
- `lib/cron-auth.ts` — Cron 작업 인증 (Bearer 토큰 검증)
- `lib/utils.ts` — 알림 유틸
- Cron API 엔드포인트는 `CRON_SECRET` 헤더로 인증
