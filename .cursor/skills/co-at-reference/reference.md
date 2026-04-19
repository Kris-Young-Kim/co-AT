# Co-AT 상세 레퍼런스

## 디렉터리 트리 (핵심)

```
app/
├── (auth)/          # sign-in, sign-up
├── (public)/        # /, notices, community, about, info, services
├── (portal)/        # portal/mypage, portal/apply, portal/settings
├── (admin)/         # dashboard, clients, inventory, schedule, stats, users, settings
├── agent-chat/      # AI 에이전트 채팅
└── api/             # webhooks/clerk, agents/chat, health 등

components/
├── ui/              # shadcn
├── common/          # logo, loading-spinner, status-badge, file-uploader
├── layout/          # admin-sidebar, admin-mobile-*, public-header/footer
└── features/        # auth, landing, application, dashboard, crm, inventory, chat

lib/
├── supabase/         # client.ts, server.ts
├── agents/           # orchestrator, domains (client, schedule, inventory 등)
├── gemini/           # AI 클라이언트
└── utils.ts, validators.ts

actions/             # auth, application, client, inventory, schedule, ai
hooks/               # use-sidebar, use-wizard-store, use-current-user
types/               # database.types.ts (Supabase), index.ts, soap.ts
```

## 주요 npm 스크립트

| 명령어 | 용도 |
|--------|------|
| `pnpm dev` | 개발 서버 (Webpack 모드) |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm gen:types` | Supabase 스키마 → TypeScript 타입 생성 |

## 환경 변수 (.env.local)

- `NEXT_PUBLIC_CLERK_*` — Clerk 인증
- `NEXT_PUBLIC_SUPABASE_*` — Supabase
- `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini API

## 코딩 컨벤션

- **서버 컴포넌트 우선**, 클라이언트는 `'use client'` 최소화
- **타입**: TypeScript 필수, `types/database.types.ts`가 DB 소스
- **폼 검증**: Zod 스키마는 `lib/validators.ts`에 정의
- **날짜**: date-fns 사용, Asia/Seoul 기준
