# GWATC AX PLATFORM — Claude Code 가이드

## 스택
Next.js 16 · React 19 · TypeScript · Tailwind + shadcn/ui · Clerk · Supabase · Turborepo · Vercel · Cloudflare · Sentry

## 모노레포 구조
```
apps/  web · admin · eval · inventory · stats · automation · hr · approval · finance
packages/  ui(@co-at/ui) · lib(@co-at/lib) · auth(@co-at/auth) · types(@co-at/types)
actions/   서버 액션 (모든 앱 공유)
migrations/ NNN_<desc>.sql
```

## 코딩 규칙
- 코드·주석 **영어**, UI 텍스트·docs는 한국어 허용
- TypeScript strict — `any` 금지, `@co-at/types` 또는 명시적 타입 사용
- Server Actions 우선, API Route는 외부 연동 시에만
- Supabase client → `@co-at/lib`에서만 import
- DB 테이블명 네임스페이스: `eval_*` `inventory_*` `hr_*` `approval_*` `finance_*`
- 모든 테이블 RLS 필수
- Clerk 역할: `ADMIN` / `MANAGER` / `STAFF` (`publicMetadata.role`, `.apps[]`)
- 신규 UI → `packages/ui`, 앱 전용 → `apps/<name>/components/`
- shadcn/ui 직접 수정 금지

## 작업 규칙
- 모든 작업 전 PLAN 수립 → `docs/TODO.md` 기록 → 완료 후 체크
- 신규 앱: `/new-app` 스킬
- DB 마이그레이션: `/db-migrate` 스킬

## 주요 커맨드
```bash
pnpm dev        # 전체 개발 서버
pnpm build      # 전체 빌드
pnpm test       # 전체 테스트
pnpm gen:types  # Supabase 타입 재생성
```

## 환경변수
`.env.example` 참고 — `NEXT_PUBLIC_SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY` · `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` · `CLERK_SECRET_KEY`
