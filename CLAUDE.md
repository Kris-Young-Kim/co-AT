# GWATC 보조공학센터 — Claude Code 프로젝트 가이드

## 프로젝트 개요
보조공학센터(gwatc.cloud) 업무 전반을 관리하는 Turborepo 모노레포.
설계 스펙: `docs/superpowers/specs/2026-05-01-gwatc-monorepo-design.md`

## 스택
- **런타임:** Next.js 16, React 19, TypeScript
- **스타일:** Tailwind CSS + shadcn/ui (`packages/ui`)
- **인증:** Clerk (`packages/auth` 공유)
- **DB:** Supabase 단일 프로젝트 (`packages/lib` 공유)
- **빌드:** Turborepo + pnpm workspaces
- **배포:** Vercel (앱별 독립 프로젝트)
- **보안/DNS:** Cloudflare (WAF · DDoS · Bot 차단 · DNS · SSL Full Strict)
- **에러 추적:** Sentry

## 네트워크 흐름
```
사용자 → Cloudflare (WAF·캐시·Bot차단) → Vercel → Next.js (Clerk·Supabase)
```
- Cloudflare Proxy(주황 구름) 항상 ON
- TLS: Cloudflare Full(strict) 모드 유지
- 내부 앱은 Cloudflare Zero Trust Access로 추가 보호 가능 (무료 50명)

## 모노레포 구조
```
apps/
  web/         gwatc.cloud          공개 포털
  admin/       admin.gwatc.cloud    권한 관리
  eval/        eval.gwatc.cloud     상담/평가 (Phase 1)
  inventory/   inventory.gwatc.cloud 자산/재고 (Phase 2)
  stats/       stats.gwatc.cloud    성과 대시보드 (Phase 3)
  automation/  automation.gwatc.cloud 자동화/알림 (Phase 4)
  hr/          hr.gwatc.cloud       인사관리 (Phase 5)
  approval/    approval.gwatc.cloud 전자결재 (Phase 6)
  finance/     finance.gwatc.cloud  예산·재무 관리 (Phase 7) ← 기존 dashboard/budget/ 마이그레이션

packages/
  ui/      @co-at/ui    shadcn 공유 컴포넌트
  lib/     @co-at/lib   Supabase client, 유틸
  auth/    @co-at/auth  Clerk 미들웨어, 역할 상수 (신설 예정)
  types/   @co-at/types DB 타입, 공통 인터페이스 (신설 예정)
```

## 코딩 규칙

### 공통
- 모든 코드와 주석은 **영어**로 작성 (UI 텍스트/문서는 한국어 허용)
- TypeScript strict mode 준수
- Server Actions 우선, API Route는 외부 연동 시에만 사용
- `any` 타입 금지 — `@co-at/types` 또는 명시적 타입 사용

### 컴포넌트
- 신규 UI 컴포넌트는 `packages/ui`에 추가 후 앱에서 import
- 앱 전용 컴포넌트는 `apps/<name>/components/`에
- shadcn/ui 컴포넌트를 직접 수정하지 말 것

### DB / Supabase
- 마이그레이션 파일: `migrations/NNN_<description>.sql`
- 테이블명 네임스페이스: `eval_*`, `inventory_*`, `hr_*`, `approval_*`, `finance_*`
- 모든 테이블에 RLS 활성화 필수
- Supabase client는 `@co-at/lib`에서만 import

### 인증
- 역할: `ADMIN` / `MANAGER` / `STAFF`
- Clerk `publicMetadata.role`, `publicMetadata.apps[]` 사용
- 각 앱 미들웨어는 `@co-at/auth` 패키지에서 가져올 것

### 신규 앱 생성
`/new-app` 스킬 사용 — 표준 보일러플레이트 자동 생성

### DB 마이그레이션
`/db-migrate` 스킬 사용 — 파일 생성 + RLS 검증

## 환경변수
`.env.example` 참고. 공통 키:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`

## 테스트
```bash
pnpm test          # 전체
pnpm test:watch    # 워치 모드
pnpm test:coverage # 커버리지
```

## 빌드
```bash
pnpm dev    # Turbo 전체 개발 서버
pnpm build  # Turbo 전체 빌드
pnpm lint   # 전체 린트
```

## 타입 생성
```bash
pnpm gen:types  # Supabase DB 타입 재생성 → types/database.types.ts
```
