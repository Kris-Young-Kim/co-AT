# Phase 0: Monorepo Boilerplate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `packages/auth`, `packages/types`, and 7 new app boilerplates (eval, inventory, stats, automation, hr, approval, finance) so every Phase 1–7 plan has a working foundation to build on.

**Architecture:** Two new shared packages (`@co-at/auth`, `@co-at/types`) extract Clerk middleware and DB types from the root app into workspace packages. Seven lean Next.js apps are scaffolded — each imports from `@co-at/*` packages and has no business logic yet, just a working dev server with auth protection.

**Tech Stack:** Next.js 16, React 19, TypeScript, Clerk v6, Supabase, Tailwind CSS, pnpm workspaces, Turborepo

---

## File Map

```
packages/
  auth/
    package.json
    tsconfig.json
    src/
      index.ts          ← public exports
      roles.ts          ← role constants + types
      middleware.ts     ← clerkMiddleware wrapper for apps
      permissions.ts    ← server-side permission helpers

  types/
    package.json
    tsconfig.json
    src/
      index.ts          ← public exports
      database.types.ts ← symlink target (copy from packages/lib/types/)
      common.ts         ← shared interfaces: Client, Equipment, etc.

apps/
  eval/               ← Phase 1 target
  inventory/          ← Phase 2 target
  stats/              ← Phase 3 target
  automation/         ← Phase 4 target
  hr/                 ← Phase 5 target
  approval/           ← Phase 6 target
  finance/            ← Phase 7 target

  Each app contains:
    package.json
    tsconfig.json
    next.config.mjs
    tailwind.config.ts
    postcss.config.mjs
    middleware.ts
    app/
      layout.tsx
      page.tsx
      globals.css

turbo.json            ← add NEXT_PUBLIC_APP_URL env var
```

---

## Task 1: Create `packages/types`

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/roles.ts`
- Create: `packages/types/src/common.ts`
- Create: `packages/types/src/index.ts`

- [ ] **Step 1: Create package.json**

```json
// packages/types/package.json
{
  "name": "@co-at/types",
  "version": "0.1.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts"
  },
  "peerDependencies": {
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
// packages/types/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create src/roles.ts**

```typescript
// packages/types/src/roles.ts
export const ROLES = {
  USER: 'user',
  STAFF: 'staff',
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  staff: 1,
  manager: 2,
  admin: 3,
}

/** Returns true if userRole meets the required minimum role */
export function hasMinimumRole(userRole: UserRole, required: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required]
}

/** App access keys stored in Clerk publicMetadata.apps[] */
export const APP_KEYS = {
  EVAL: 'eval',
  INVENTORY: 'inventory',
  STATS: 'stats',
  AUTOMATION: 'automation',
  HR: 'hr',
  APPROVAL: 'approval',
  FINANCE: 'finance',
} as const

export type AppKey = typeof APP_KEYS[keyof typeof APP_KEYS]
```

- [ ] **Step 4: Create src/common.ts**

```typescript
// packages/types/src/common.ts

/** Shared pagination params for all list queries */
export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

/** Standard audit fields present on all tables */
export interface AuditFields {
  created_at: string
  updated_at: string
}

/** Clerk user metadata shape */
export interface ClerkPublicMetadata {
  role?: string
  apps?: string[]
}
```

- [ ] **Step 5: Create src/index.ts**

```typescript
// packages/types/src/index.ts
export * from './roles'
export * from './common'
```

- [ ] **Step 6: Commit**

```bash
git add packages/types/
git commit -m "feat: add @co-at/types package with role constants and shared interfaces"
```

---

## Task 2: Create `packages/auth`

**Files:**
- Create: `packages/auth/package.json`
- Create: `packages/auth/tsconfig.json`
- Create: `packages/auth/src/middleware.ts`
- Create: `packages/auth/src/permissions.ts`
- Create: `packages/auth/src/index.ts`

- [ ] **Step 1: Create package.json**

```json
// packages/auth/package.json
{
  "name": "@co-at/auth",
  "version": "0.1.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@co-at/types": "workspace:*"
  },
  "peerDependencies": {
    "@clerk/nextjs": "^6",
    "next": "^16"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
// packages/auth/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create src/middleware.ts**

```typescript
// packages/auth/src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import type { AppKey } from '@co-at/types'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
])

/**
 * Creates a Clerk middleware that:
 * 1. Allows public routes through
 * 2. Redirects unauthenticated users to sign-in
 * 3. Optionally checks app-level access via Clerk publicMetadata.apps[]
 */
export function createAppMiddleware(appKey?: AppKey) {
  return clerkMiddleware(async (auth, req) => {
    if (isPublicRoute(req)) return

    const { userId, sessionClaims, redirectToSignIn } = await auth()

    if (!userId) {
      return redirectToSignIn({ returnBackUrl: req.url })
    }

    if (appKey) {
      const meta = sessionClaims?.metadata as { apps?: string[] } | undefined
      const allowedApps = meta?.apps ?? []
      const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role

      // ADMIN bypasses app-level access checks
      if (role !== 'admin' && !allowedApps.includes(appKey)) {
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.gwatc.cloud'
        return Response.redirect(new URL('/unauthorized', adminUrl))
      }
    }
  })
}

export const middlewareConfig = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 4: Create src/permissions.ts**

```typescript
// packages/auth/src/permissions.ts
'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import type { UserRole, AppKey } from '@co-at/types'
import { ROLE_HIERARCHY, ROLES } from '@co-at/types'

function isValidRole(r: unknown): r is UserRole {
  return r === ROLES.USER || r === ROLES.STAFF || r === ROLES.MANAGER || r === ROLES.ADMIN
}

/** Get current user's role from Clerk session claims */
export async function getCurrentRole(): Promise<UserRole | null> {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role
  return isValidRole(role) ? role : null
}

/** Returns true if current user has at least the required role */
export async function requireRole(required: UserRole): Promise<boolean> {
  const role = await getCurrentRole()
  if (!role) return false
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[required]
}

/** Returns true if current user has access to the given app */
export async function hasAppAccess(appKey: AppKey): Promise<boolean> {
  const { sessionClaims } = await auth()
  const meta = sessionClaims?.metadata as { role?: string; apps?: string[] } | undefined
  if (meta?.role === ROLES.ADMIN) return true
  return (meta?.apps ?? []).includes(appKey)
}

/** Throws redirect if user doesn't have required role */
export async function assertRole(required: UserRole): Promise<void> {
  const ok = await requireRole(required)
  if (!ok) {
    throw new Error(`Requires role: ${required}`)
  }
}
```

- [ ] **Step 5: Create src/index.ts**

```typescript
// packages/auth/src/index.ts
export { createAppMiddleware, middlewareConfig } from './middleware'
export { getCurrentRole, requireRole, hasAppAccess, assertRole } from './permissions'
```

- [ ] **Step 6: Commit**

```bash
git add packages/auth/
git commit -m "feat: add @co-at/auth package with Clerk middleware and permission helpers"
```

---

## Task 3: Create `apps/eval` boilerplate

**Files:**
- Create: `apps/eval/package.json`
- Create: `apps/eval/tsconfig.json`
- Create: `apps/eval/next.config.mjs`
- Create: `apps/eval/tailwind.config.ts`
- Create: `apps/eval/postcss.config.mjs`
- Create: `apps/eval/middleware.ts`
- Create: `apps/eval/app/layout.tsx`
- Create: `apps/eval/app/page.tsx`
- Create: `apps/eval/app/globals.css`

- [ ] **Step 1: Create package.json**

```json
// apps/eval/package.json
{
  "name": "@co-at/eval",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3002",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@clerk/nextjs": "^6.36.3",
    "@co-at/auth": "workspace:*",
    "@co-at/types": "workspace:*",
    "@co-at/ui": "workspace:*",
    "@co-at/lib": "workspace:*",
    "next": "^16.1.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^2.2.1",
    "clsx": "^2.1.0",
    "lucide-react": "^0.344.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "autoprefixer": "^10.0.1",
    "eslint": "^9",
    "eslint-config-next": "^16.1.1",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
// apps/eval/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create next.config.mjs**

```javascript
// apps/eval/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@co-at/ui', '@co-at/lib', '@co-at/auth', '@co-at/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 4: Create postcss.config.mjs**

```javascript
// apps/eval/postcss.config.mjs
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
export default config
```

- [ ] **Step 5: Create tailwind.config.ts**

```typescript
// apps/eval/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/ui/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
```

- [ ] **Step 6: Create middleware.ts**

```typescript
// apps/eval/middleware.ts
import { createAppMiddleware, middlewareConfig } from '@co-at/auth'

export const middleware = createAppMiddleware('eval')
export const config = middlewareConfig
```

- [ ] **Step 7: Create app/globals.css**

```css
/* apps/eval/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: Create app/layout.tsx**

```typescript
// apps/eval/app/layout.tsx
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'GWATC — 상담/평가',
  description: '보조공학 전문가 상담 및 평가 툴',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 9: Create app/page.tsx**

```typescript
// apps/eval/app/page.tsx
export default function EvalDashboard() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">상담/평가 대시보드</h1>
      <p className="text-gray-500 mt-2">Phase 1 구현 예정</p>
    </main>
  )
}
```

- [ ] **Step 10: Commit**

```bash
git add apps/eval/
git commit -m "feat: scaffold apps/eval boilerplate (Phase 1 target)"
```

---

## Task 4: Create remaining 6 app boilerplates

`apps/inventory`, `apps/stats`, `apps/automation`, `apps/hr`, `apps/approval`, `apps/finance` 는 `apps/eval`과 동일한 구조. 아래 차이점만 적용.

| 앱 | 포트 | appKey | 제목 | 설명 |
|---|---|---|---|---|
| inventory | 3003 | `'inventory'` | `GWATC — 자산/재고` | 자산 재고 및 대여 관리 |
| stats | 3004 | `'stats'` | `GWATC — 성과 대시보드` | 성과 지표 및 KPI 대시보드 |
| automation | 3005 | `'automation'` | `GWATC — 업무 자동화` | 업무 자동화 및 알림 센터 |
| hr | 3006 | `'hr'` | `GWATC — 인사관리` | 직원 인사 관리 시스템 |
| approval | 3007 | `'approval'` | `GWATC — 전자결재` | 지능형 전자결재 시스템 |
| finance | 3008 | `'finance'` | `GWATC — 예산/재무` | 예산 편성 및 재무 관리 |

- [ ] **Step 1: Create apps/inventory** — copy eval 구조, 포트 3003, appKey `'inventory'`, 제목/설명 위 표 참고

- [ ] **Step 2: Create apps/stats** — 포트 3004, appKey `'stats'`

- [ ] **Step 3: Create apps/automation** — 포트 3005, appKey `'automation'`

- [ ] **Step 4: Create apps/hr** — 포트 3006, appKey `'hr'`

- [ ] **Step 5: Create apps/approval** — 포트 3007, appKey `'approval'`

- [ ] **Step 6: Create apps/finance** — 포트 3008, appKey `'finance'`

- [ ] **Step 7: Commit all at once**

```bash
git add apps/inventory/ apps/stats/ apps/automation/ apps/hr/ apps/approval/ apps/finance/
git commit -m "feat: scaffold 6 app boilerplates (inventory/stats/automation/hr/approval/finance)"
```

---

## Task 5: Update `turbo.json`

**Files:**
- Modify: `turbo.json`

- [ ] **Step 1: Add NEXT_PUBLIC_APP_URL to build env**

`turbo.json` `tasks.build.env` 배열에 추가:

```json
"NEXT_PUBLIC_APP_URL",
"NEXT_PUBLIC_ADMIN_URL"
```

최종 env 배열 (기존 항목 유지 + 추가):
```json
"env": [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GOOGLE_AI_API_KEY",
  "WEBHOOK_SECRET",
  "NEXT_PUBLIC_NAVER_MAP_CLIENT_ID",
  "SENTRY_AUTH_TOKEN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_ADMIN_URL",
  "NEXT_PUBLIC_APP_URL",
  "STORAGE_BUCKET",
  "SUPABASE_ACCESS_TOKEN",
  "Client_ID",
  "Client_Secret",
  "KAKAO_CLIENT_ID",
  "KAKAO_CLIENT_SECRET",
  "VERCEL_ENV"
]
```

- [ ] **Step 2: Commit**

```bash
git add turbo.json
git commit -m "chore: add NEXT_PUBLIC_APP_URL to turbo build env"
```

---

## Task 6: Install & Verify

- [ ] **Step 1: Install workspace dependencies from repo root**

```bash
cd D:/AILeader1/project/valuewith/co-AT
pnpm install
```

Expected: No errors. New packages resolved under `node_modules/@co-at/`.

- [ ] **Step 2: Verify TypeScript compiles across all packages**

```bash
cd D:/AILeader1/project/valuewith/co-AT
npx tsc --noEmit --skipLibCheck
```

Expected: No type errors in `packages/auth` or `packages/types`.

- [ ] **Step 3: Start apps/eval dev server**

```bash
cd D:/AILeader1/project/valuewith/co-AT/apps/eval
pnpm dev
```

Expected: Server starts on `http://localhost:3002`. Browser shows "상담/평가 대시보드". Unauthenticated → redirects to Clerk sign-in.

- [ ] **Step 4: Verify middleware protects the route**

브라우저 시크릿 탭에서 `http://localhost:3002` 접속.
Expected: Clerk sign-in 페이지로 리다이렉트.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: phase 0 complete — all 7 app boilerplates + shared packages ready"
```

---

## Checklist — Spec Coverage

| 스펙 항목 | 커버된 태스크 |
|---|---|
| packages/auth 신설 | Task 2 |
| packages/types 신설 | Task 1 |
| 7개 앱 뼈대 생성 | Task 3, 4 |
| 역할 상수 (staff/manager/admin) | Task 1 step 3 |
| 앱별 접근 제어 | Task 2 step 3 |
| turbo build env 업데이트 | Task 5 |
| 설치 및 동작 검증 | Task 6 |
