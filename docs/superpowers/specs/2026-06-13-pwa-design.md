# PWA (Progressive Web App) 구성 설계

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모노레포 9개 앱 전체(web, admin, eval, inventory, stats, approval, automation, hr, finance)를 데스크톱·모바일에서 앱처럼 설치·실행할 수 있는 PWA로 구성한다.

**Architecture:** `@ducanh2912/next-pwa`로 각 앱에 Workbox service worker를 생성하고, `sharp` 기반 스크립트로 앱별 PNG 아이콘을 일괄 생성한다. 공유 설치 배너 컴포넌트(`PwaInstallBanner`)를 `packages/ui`에 두어 모든 앱 레이아웃에서 재사용한다.

**Tech Stack:** `@ducanh2912/next-pwa ^10`, `sharp`, Next.js App Router manifest API, Workbox, localStorage

---

## 범위

| 앱 | 포트 | short_name | theme_color |
|----|------|-----------|-------------|
| web | 3000 | GWATC | `#4338ca` |
| admin | 3001 | 어드민 | `#334155` |
| eval | 3002 | 상담/평가 | `#1d4ed8` |
| inventory | 3003 | 재고관리 | `#15803d` |
| stats | 3004 | 통계 | `#7c3aed` |
| approval | 3007 | 결재 | `#c2410c` |
| automation | 3005 | 자동화 | `#0f766e` |
| hr | 3006 | 인사 | `#be185d` |
| finance | 3008 | 재무 | `#047857` |

---

## 1. 아이콘 생성 스크립트

**파일:** `scripts/generate-pwa-icons.mjs`

- `sharp`를 사용해 각 앱마다 PNG 3종 생성
  - `icon-192.png` — 192×192 (Android 홈 화면)
  - `icon-512.png` — 512×512 (스플래시/고해상도)
  - `apple-touch-icon.png` — 180×180 (iOS 홈 화면)
- 각 아이콘: 앱 배경색 원형 + 흰색 이니셜 텍스트
- 출력 경로: `apps/{appName}/public/icons/`

**앱별 아이콘 정의:**

| 앱 | 배경색 | 이니셜 |
|----|--------|--------|
| web | `#4338ca` | G |
| admin | `#334155` | A |
| eval | `#1d4ed8` | E |
| inventory | `#15803d` | I |
| stats | `#7c3aed` | S |
| approval | `#c2410c` | P |
| automation | `#0f766e` | Au |
| hr | `#be185d` | H |
| finance | `#047857` | F |

**루트 `package.json`에 스크립트 추가:**
```json
"gen:pwa-icons": "node scripts/generate-pwa-icons.mjs"
```

---

## 2. 공유 설치 배너 컴포넌트

**파일:** `packages/ui/components/pwa/PwaInstallBanner.tsx`

- `'use client'` 컴포넌트
- 마운트 시 `localStorage.getItem('pwa-install-dismissed')` 확인 → `'true'`면 렌더링 안 함
- **Android/Desktop:** `beforeinstallprompt` 이벤트 감지 시 배너 표시
  - [설치] 클릭 → `prompt()` 호출 → 결과 무관하게 `dismissed` 저장
  - [✕] 클릭 → `dismissed` 저장, 배너 숨김
- **iOS Safari:** `navigator.standalone === false` + `userAgent`에 `iPhone|iPad` 포함 시 배너 표시
  - 텍스트: "Safari 하단 공유 버튼(⬆) → [홈 화면에 추가]를 탭하세요"
  - [✕] 클릭 → `dismissed` 저장, 배너 숨김
- **이미 설치된 경우:** `window.matchMedia('(display-mode: standalone)').matches === true` → 배너 숨김
- UI: 화면 하단 고정 카드(`fixed bottom-4`), 그림자, 앱 설명 텍스트

**파일 위치:** `packages/ui/ui/pwa-install-banner.tsx`

임포트 방식 (기존 패턴과 동일):
```ts
import { PwaInstallBanner } from '@co-at/ui/pwa-install-banner'
```

---

## 3. 앱별 PWA 설정

각 앱(web 제외 8개)에 동일하게 적용:

### 3-1. `next.config.mjs` — `withPWA()` 래핑

```js
import withPWAInit from "@ducanh2912/next-pwa"

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  workboxOptions: { disableDevLogs: true },
})

// Sentry를 사용하는 앱(admin)은 최외곽 래핑 유지:
export default withSentryConfig(withPWA(nextConfig), sentryOptions)

// Sentry 미사용 앱(eval, inventory, stats, approval, automation, hr, finance):
export default withPWA(nextConfig)
```

`web` 앱은 이미 설정 완료 — 아이콘 경로만 PNG로 업데이트.

### 3-2. `app/manifest.ts`

앱별 구체 값:

| 앱 | name | short_name | description | theme_color |
|----|------|-----------|-------------|-------------|
| admin | GWATC 어드민 | 어드민 | GWATC 통합 관리 시스템 | `#334155` |
| eval | GWATC 상담/평가 | 상담/평가 | 보조공학 상담 및 평가 | `#1d4ed8` |
| inventory | GWATC 재고관리 | 재고관리 | 보조기기 재고 및 현황 관리 | `#15803d` |
| stats | GWATC 통계 | 통계 | 센터 통계 및 현황 | `#7c3aed` |
| approval | GWATC 결재 | 결재 | 전자 결재 시스템 | `#c2410c` |
| automation | GWATC 자동화 | 자동화 | 업무 자동화 설정 | `#0f766e` |
| hr | GWATC 인사 | 인사 | 직원 인사 관리 | `#be185d` |
| finance | GWATC 재무 | 재무 | 재무 및 예산 관리 | `#047857` |

```ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GWATC 상담/평가',          // 앱별 고유값 (위 표 참조)
    short_name: '상담/평가',
    description: '보조공학 상담 및 평가',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1d4ed8',
    orientation: 'portrait-primary',
    lang: 'ko',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
```

### 3-3. `app/layout.tsx` — iOS 메타 태그 + 배너

```tsx
import type { Viewport } from 'next'
import { PwaInstallBanner } from '@co-at/ui'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '{theme_color}',
}

export const metadata: Metadata = {
  // 기존 metadata에 추가:
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '{short_name}',
  },
  other: { 'mobile-web-app-capable': 'yes' },
}

// layout JSX <head>에 추가:
// <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

// layout JSX <body> 안에 추가:
// <PwaInstallBanner />
```

---

## 4. 패키지 의존성

`@ducanh2912/next-pwa`를 아직 설치하지 않은 8개 앱에 추가:

```bash
pnpm add @ducanh2912/next-pwa \
  --filter admin \
  --filter @co-at/eval \
  --filter @co-at/inventory \
  --filter @co-at/stats \
  --filter @co-at/approval \
  --filter @co-at/automation \
  --filter @co-at/hr \
  --filter @co-at/finance
```

`sharp`는 스크립트 전용이므로 루트 `devDependencies`에 추가:
```bash
pnpm add -D sharp -w
```

---

## 5. web 앱 기존 설정 업데이트

`web` 앱은 이미 `next-pwa` 설정 완료이나 아래 항목 수정 필요:

- `manifest.ts`: `icons` 배열을 SVG → PNG 경로로 교체
- `layout.tsx`: `apple-touch-icon` href를 `/icons/apple-touch-icon.png`으로 교체
- `next.config.mjs`의 `runtimeCaching`은 현행 유지 (Supabase NetworkFirst 등)

---

## 6. 테스트 기준

- [ ] `pnpm gen:pwa-icons` 실행 시 9개 앱 `public/icons/`에 PNG 3종씩 생성
- [ ] 프로덕션 빌드(`pnpm build`) 후 각 앱 `public/`에 `sw.js`, `workbox-*.js` 생성
- [ ] Chrome DevTools → Application → Manifest: 이름·아이콘·theme_color 정상 표시
- [ ] Chrome DevTools → Application → Service Workers: Activated 상태
- [ ] Android Chrome: 주소창 "설치" 아이콘 또는 배너 표시
- [ ] iOS Safari: `PwaInstallBanner`의 홈 화면 추가 안내 표시
- [ ] 배너 [✕] 클릭 후 재방문 시 배너 미표시 (localStorage 확인)
- [ ] 설치 후 standalone 모드에서 배너 미표시

---

## 제약 사항

- `@ducanh2912/next-pwa`는 개발 모드(`NODE_ENV === 'development'`)에서 service worker 비활성화 — 프로덕션 빌드로만 PWA 검증 가능
- iOS Safari는 `beforeinstallprompt` 이벤트 미지원 — 수동 안내 배너로 대체
- Clerk 인증 페이지(`/sign-in`, `/sign-up`)는 캐싱 대상에서 제외 (보안)
