# PWA 제거 & 모바일 최적화 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 9개 앱 전체에서 PWA 코드를 완전히 제거하고, inventory 앱을 모바일에서도 불편 없이 쓸 수 있도록 반응형 레이아웃으로 전환한다.

**Architecture:** PWA(서비스 워커, manifest, 설치 배너) 일체 제거 → 일반 반응형 웹으로 전환. inventory 앱의 데스크톱 전용 사이드바를 모바일에서는 햄버거+Sheet(drawer)로 교체.

**Tech Stack:** Next.js 16, Tailwind CSS, shadcn/ui Sheet, pnpm workspace

---

## 파일 구조 (변경 대상)

### Phase 1 — PWA 제거

| 파일 | 작업 |
|------|------|
| `apps/*/package.json` (9개) | `@ducanh2912/next-pwa` 제거 |
| `apps/*/next.config.mjs` (9개) | `withPWAInit` 래퍼 제거 |
| `apps/*/app/manifest.ts` (9개) | 삭제 |
| `apps/*/app/layout.tsx` (9개) | `manifest`, `appleWebApp` 메타 제거, `PwaInstallBanner` 제거 |
| `packages/ui/ui/pwa-install-banner.tsx` | 삭제 |
| `apps/*/public/sw.js` (존재하는 앱) | 삭제 |
| `apps/*/public/workbox-*.js` (존재하는 앱) | 삭제 |
| `apps/admin/public/workbox-4b114094.js` | 삭제 |
| `apps/admin/public/workbox-4b114094.js.map` | 삭제 |
| `scripts/generate-pwa-icons.mjs` | 삭제 |
| `package.json` (root) | `gen:pwa-icons` 스크립트 제거 |

### Phase 2 — inventory 모바일 레이아웃

| 파일 | 작업 |
|------|------|
| `apps/inventory/components/layout/InventorySidebar.tsx` | 모바일 Sheet 드로어 모드 추가 |
| `apps/inventory/app/layout.tsx` | 모바일 헤더 추가 |

---

## Task 1: next.config.mjs에서 withPWA 제거 (9개 앱)

**Files:**
- Modify: `apps/web/next.config.mjs`
- Modify: `apps/inventory/next.config.mjs`
- Modify: `apps/admin/next.config.mjs`
- Modify: `apps/eval/next.config.mjs`
- Modify: `apps/stats/next.config.mjs`
- Modify: `apps/approval/next.config.mjs`
- Modify: `apps/automation/next.config.mjs`
- Modify: `apps/hr/next.config.mjs`
- Modify: `apps/finance/next.config.mjs`

- [x] **Step 1: inventory next.config.mjs — withPWA 제거**

`apps/inventory/next.config.mjs` 전체를:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
  },
  serverExternalPackages: ['exceljs', 'qrcode'],
  transpilePackages: ['@co-at/ui', '@co-at/lib', '@co-at/auth', '@co-at/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

export default nextConfig
```

- [x] **Step 2: 나머지 8개 앱 next.config.mjs — withPWA 제거**

각 앱의 `next.config.mjs`에서:
- `import withPWAInit from "@ducanh2912/next-pwa"` 줄 삭제
- `const withPWA = withPWAInit({...})` 블록 삭제
- `export default withPWA(nextConfig)` → `export default nextConfig` 로 변경

대상 파일:
- `apps/web/next.config.mjs`
- `apps/admin/next.config.mjs`
- `apps/eval/next.config.mjs`
- `apps/stats/next.config.mjs`
- `apps/approval/next.config.mjs`
- `apps/automation/next.config.mjs`
- `apps/hr/next.config.mjs`
- `apps/finance/next.config.mjs`

- [x] **Step 3: Commit**

```bash
git add apps/*/next.config.mjs
git commit -m "chore(pwa): remove withPWA wrapper from all app configs"
```

---

## Task 2: package.json에서 @ducanh2912/next-pwa 제거

**Files:**
- Modify: `apps/*/package.json` (9개)
- Modify: `package.json` (root — gen:pwa-icons 스크립트)

- [x] **Step 1: 9개 앱 package.json에서 패키지 제거**

각 `apps/*/package.json`의 `dependencies` 또는 `devDependencies`에서 아래 줄 삭제:
```json
"@ducanh2912/next-pwa": "^10.2.9",
```

대상: `apps/web`, `apps/admin`, `apps/eval`, `apps/inventory`, `apps/stats`, `apps/approval`, `apps/automation`, `apps/hr`, `apps/finance`

- [x] **Step 2: root package.json에서 gen:pwa-icons 스크립트 제거**

`package.json`의 `scripts`에서:
```json
"gen:pwa-icons": "node scripts/generate-pwa-icons.mjs",
```
줄 삭제.

- [x] **Step 3: pnpm install 실행**

```bash
pnpm install
```

Expected: lock file 업데이트, `@ducanh2912/next-pwa` 패키지 제거

- [ ] **Step 4: Commit**

```bash
git add apps/*/package.json package.json pnpm-lock.yaml
git commit -m "chore(pwa): remove @ducanh2912/next-pwa from all apps"
```

---

## Task 3: manifest.ts 파일 삭제 (9개 앱)

**Files:**
- Delete: `apps/*/app/manifest.ts` (9개)

- [x] **Step 1: manifest.ts 전체 삭제**

```bash
rm apps/web/app/manifest.ts
rm apps/admin/app/manifest.ts
rm apps/eval/app/manifest.ts
rm apps/inventory/app/manifest.ts
rm apps/stats/app/manifest.ts
rm apps/approval/app/manifest.ts
rm apps/automation/app/manifest.ts
rm apps/hr/app/manifest.ts
rm apps/finance/app/manifest.ts
```

PowerShell:
```powershell
$apps = @('web','admin','eval','inventory','stats','approval','automation','hr','finance')
foreach ($app in $apps) {
  Remove-Item "apps\$app\app\manifest.ts" -ErrorAction SilentlyContinue
}
```

- [x] **Step 2: Commit**

```bash
git add -A
git commit -m "chore(pwa): delete manifest.ts from all apps"
```

---

## Task 4: layout.tsx에서 PWA 메타 & PwaInstallBanner 제거

**Files:**
- Modify: `apps/*/app/layout.tsx` (9개)

각 `layout.tsx`에서 제거할 항목:
1. `import { PwaInstallBanner } from '@co-at/ui/pwa-install-banner'` 줄
2. `metadata` 객체에서 `manifest: '/manifest.webmanifest'` 줄
3. `metadata` 객체에서 `appleWebApp: { ... }` 블록
4. `metadata` 객체에서 `other: { 'mobile-web-app-capable': 'yes', ... }` 블록
5. `<head>` 태그 내 `<link rel="apple-touch-icon" ... />` 줄
6. JSX에서 `<PwaInstallBanner />` 줄

- [x] **Step 1: inventory layout.tsx 정리**

`apps/inventory/app/layout.tsx`를:

```tsx
import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { InventorySidebar } from '@/inventory/components/layout/InventorySidebar'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#15803d',
}

export const metadata: Metadata = {
  title: 'GWATC — 자산/재고 관리',
  description: '보조공학센터 자산 및 재고 관리 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? 'https://gwatc.cloud/sign-in'}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? 'https://gwatc.cloud/sign-up'}
    >
      <html lang="ko">
        <body className="bg-gray-50">
          <div className="flex min-h-screen">
            <InventorySidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}
```

- [x] **Step 2: 나머지 8개 앱 layout.tsx 정리**

각 앱 `layout.tsx`에서 위 항목 1~6 제거. 앱별로 구조가 다를 수 있으므로 파일을 읽고 수동으로 제거.

- [x] **Step 3: Commit**

```bash
git add apps/*/app/layout.tsx
git commit -m "chore(pwa): remove PWA metadata and PwaInstallBanner from all layouts"
```

---

## Task 5: PwaInstallBanner 컴포넌트 & 아이콘 스크립트 삭제

**Files:**
- Delete: `packages/ui/ui/pwa-install-banner.tsx`
- Delete: `scripts/generate-pwa-icons.mjs`

- [x] **Step 1: PwaInstallBanner 삭제**

```bash
rm packages/ui/ui/pwa-install-banner.tsx
```

`packages/ui/package.json`에서 export 항목 제거 (존재하는 경우):
```json
"./pwa-install-banner": "./ui/pwa-install-banner.tsx"
```

- [x] **Step 2: 아이콘 생성 스크립트 삭제**

```bash
rm scripts/generate-pwa-icons.mjs
```

- [x] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(pwa): delete PwaInstallBanner component and icon generation script"
```

---

## Task 6: 빌드 검증

- [x] **Step 1: inventory 앱 빌드 테스트**

```bash
pnpm --filter inventory build
```

Expected: 빌드 성공, `sw.js` 관련 경고 없음

- [x] **Step 2: web 앱 빌드 테스트**

```bash
pnpm --filter web build
```

Expected: 빌드 성공

- [x] **Step 3: public/ 폴더 잔여 SW 파일 삭제**

빌드 후 각 앱 public/에 남아있는 서비스 워커 파일 삭제:
```powershell
$apps = @('web','admin','eval','inventory','stats','approval','automation','hr','finance')
foreach ($app in $apps) {
  Remove-Item "apps\$app\public\sw.js" -ErrorAction SilentlyContinue
  Remove-Item "apps\$app\public\workbox-*.js" -ErrorAction SilentlyContinue
  Remove-Item "apps\$app\public\workbox-*.js.map" -ErrorAction SilentlyContinue
  Remove-Item "apps\$app\public\swe-worker-*.js" -ErrorAction SilentlyContinue
}
```

- [x] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(pwa): remove generated SW and workbox files from public/"
```

---

## Task 7: inventory 앱 — 모바일 반응형 레이아웃

**Files:**
- Modify: `apps/inventory/components/layout/InventorySidebar.tsx`
- Modify: `apps/inventory/app/layout.tsx`

**목표:** 데스크톱은 현재 사이드바 유지, 모바일(md 미만)에서는 상단 헤더 + 햄버거 → Sheet 드로어로 전환

- [x] **Step 1: InventorySidebar를 반응형으로 교체**

`apps/inventory/components/layout/InventorySidebar.tsx`를 전체 교체:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import {
  LayoutDashboard, Package, ArrowLeftRight, Wrench,
  RefreshCw, Cpu, Settings, FileBarChart, Map, Droplets, ScanLine, PackageCheck,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

type NavItem = {
  type: 'item'
  href: string
  label: string
  icon: React.ElementType
}

type NavSection = {
  type: 'section'
  label: string
}

type NavEntry = NavItem | NavSection

const NAV_ENTRIES: NavEntry[] = [
  { type: 'item', href: '/', label: '대시보드', icon: LayoutDashboard },

  { type: 'section', label: '기기 관리' },
  { type: 'item', href: '/devices', label: '기기 목록', icon: Package },
  { type: 'item', href: '/rentals', label: '대여 관리', icon: ArrowLeftRight },
  { type: 'item', href: '/scan/match', label: '스캔 대여', icon: ScanLine },
  { type: 'item', href: '/scan/return', label: '스캔 반납', icon: PackageCheck },
  { type: 'item', href: '/reuse', label: '재사용', icon: RefreshCw },

  { type: 'section', label: '제작' },
  { type: 'item', href: '/custom-orders', label: '맞춤제작', icon: Wrench },
  { type: 'item', href: '/fab-equipment', label: '제작 장비', icon: Cpu },

  { type: 'section', label: '사후관리' },
  { type: 'item', href: '/maintenance', label: '점검/수리', icon: Settings },
  { type: 'item', href: '/cleaning', label: '소독·세척', icon: Droplets },

  { type: 'section', label: '현황·분석' },
  { type: 'item', href: '/reports', label: '리포트', icon: FileBarChart },
  { type: 'item', href: '/map', label: '지역 현황 맵', icon: Map },
]

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 p-3 space-y-0.5">
      {NAV_ENTRIES.map((entry, idx) => {
        if (entry.type === 'section') {
          return (
            <p
              key={`section-${idx}`}
              className="px-3 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider"
            >
              {entry.label}
            </p>
          )
        }

        const { href, label, icon: Icon } = entry
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarHeader() {
  return (
    <div className="p-4 border-b">
      <h1 className="text-base font-bold text-gray-900">자산/재고 관리</h1>
      <p className="text-xs text-gray-500 mt-0.5">inventory.gwatc.cloud</p>
    </div>
  )
}

export function InventorySidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <aside className="hidden md:flex w-56 shrink-0 border-r bg-white h-screen sticky top-0 flex-col">
        <SidebarHeader />
        <NavList />
      </aside>

      {/* 모바일 상단 헤더 */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 bg-white border-b px-4 h-14">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">메뉴 열기</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 flex flex-col">
            <SidebarHeader />
            <NavList onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="font-bold text-gray-900 text-sm">자산/재고 관리</span>
      </header>
    </>
  )
}
```

- [x] **Step 2: inventory layout.tsx에 모바일 상단 여백 추가**

`apps/inventory/app/layout.tsx`의 `<main>` 태그를:

```tsx
<main className="flex-1 overflow-auto pt-14 md:pt-0">{children}</main>
```

으로 변경 (모바일에서 fixed 헤더 높이 14(56px)만큼 padding-top 추가).

- [x] **Step 3: shadcn Sheet 컴포넌트 확인**

```bash
ls apps/inventory/components/ui/sheet.tsx 2>/dev/null || echo "Sheet 없음"
```

Sheet 컴포넌트가 없으면:
```bash
cd apps/inventory && npx shadcn@latest add sheet
```

- [x] **Step 4: Commit**

```bash
git add apps/inventory/components/layout/InventorySidebar.tsx apps/inventory/app/layout.tsx
git commit -m "feat(inventory): responsive sidebar — desktop panel, mobile hamburger sheet"
```

---

## Task 8: 최종 검증 & push

- [x] **Step 1: 로컬 빌드 전체 확인**

```bash
pnpm build
```

Expected: 모든 앱 빌드 성공, PWA 관련 경고 없음

- [x] **Step 2: 모바일 레이아웃 시각 확인**

브라우저 DevTools에서 모바일 뷰(375px)로 inventory 앱 확인:
- 상단 헤더 + 햄버거 버튼 표시
- 햄버거 클릭 → Sheet 드로어 열림
- 메뉴 클릭 → 드로어 닫힘 + 페이지 이동

- [x] **Step 3: push**

```bash
git push origin main
```

---

## 완료 기준

- [x] 9개 앱 어디서도 `sw.js`, `workbox`, `next-pwa` 관련 파일/코드 없음
- [x] 빌드 시 PWA 관련 로그/경고 없음
- [x] inventory 앱 모바일(375px)에서 사이드바 대신 햄버거 + Sheet 드로어 동작
- [x] inventory 앱 데스크톱(1024px+)에서 기존 사이드바 레이아웃 동일 유지
