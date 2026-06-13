# Homepage Remotion Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the YouTube-background Hero with a Remotion-powered cinematic particle animation, and add a scroll-triggered stats counter section to the gwatc.cloud homepage.

**Architecture:** Remotion compositions move to the monorepo root (`components/remotion/compositions/`) so landing components (also at monorepo root) can import them via the `@/` path alias. RemotionPlayer gains an `intersectionTrigger` prop backed by IntersectionObserver + PlayerRef. Hero text/buttons stay in JSX overlay with CSS keyframe animations; Remotion handles the animated background only.

**Tech Stack:** Remotion v4 · @remotion/player v4 · Next.js 16 (dynamic import, ssr:false) · React 19 · TypeScript strict · Tailwind CSS · Vitest + @testing-library/react

---

## File Map

| Action | Path |
|---|---|
| **CREATE** | `components/remotion/compositions/HeroAnimation.tsx` |
| **CREATE** | `components/remotion/compositions/StatsReveal.tsx` |
| **CREATE** | `components/remotion/RemotionPlayer.tsx` |
| **CREATE** | `components/features/landing/HomeStatsSection.tsx` |
| **MODIFY** | `components/features/landing/HomeHeroSection.tsx` |
| **MODIFY** | `apps/web/app/globals.css` |
| **MODIFY** | `apps/web/app/(public)/page.tsx` |
| **MODIFY** | `apps/web/remotion/Root.tsx` |
| **DELETE** | `apps/web/remotion/compositions/HeroAnimation.tsx` |
| **DELETE** | `apps/web/remotion/compositions/StatsReveal.tsx` |
| **DELETE** | `apps/web/components/remotion/RemotionPlayer.tsx` |

---

## Task 1: CSS 애니메이션 키프레임 추가

**Files:**
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: globals.css 끝부분에 키프레임 추가**

`apps/web/app/globals.css` 파일 맨 끝에 추가:

```css
/* Hero text entrance animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/web/app/globals.css
git commit -m "style: add fadeInUp and fadeInScale keyframes for hero animations"
```

---

## Task 2: HeroAnimation Remotion 컴포지션 생성

**Files:**
- Create: `components/remotion/compositions/HeroAnimation.tsx`
- Create: `components/remotion/compositions/HeroAnimation.test.tsx`

- [ ] **Step 1: 테스트 파일 작성**

`components/remotion/compositions/HeroAnimation.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render } from '@testing-library/react'
import { HeroAnimation, HERO_ANIMATION_FPS, HERO_ANIMATION_DURATION_IN_FRAMES } from './HeroAnimation'

vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={style}>{children}</div>
  ),
  useCurrentFrame: () => 0,
  useVideoConfig: () => ({ fps: 60, durationInFrames: 180, width: 1920, height: 1080 }),
  interpolate: (_v: number, _i: number[], o: number[]) => o[1],
}))

describe('HeroAnimation', () => {
  it('exports correct fps and duration', () => {
    expect(HERO_ANIMATION_FPS).toBe(60)
    expect(HERO_ANIMATION_DURATION_IN_FRAMES).toBe(180)
  })

  it('renders without crashing', () => {
    const { container } = render(<HeroAnimation />)
    expect(container.firstChild).toBeTruthy()
  })
})
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
cd apps/web && pnpm test HeroAnimation
```

Expected: `Cannot find module './HeroAnimation'`

- [ ] **Step 3: 컴포지션 파일 작성**

`components/remotion/compositions/HeroAnimation.tsx`:

```tsx
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

export const HERO_ANIMATION_FPS = 60
export const HERO_ANIMATION_DURATION_IN_FRAMES = 180 // 3s

interface Particle {
  x: number
  y: number
  size: number
  opacity: number
  delay: number
  blue: boolean // true = blue-500, false = indigo-500
}

const PARTICLES: Particle[] = [
  { x: 12, y: 18, size: 5, opacity: 0.5, delay: 0,  blue: true  },
  { x: 28, y: 62, size: 3, opacity: 0.4, delay: 8,  blue: false },
  { x: 45, y: 32, size: 6, opacity: 0.35, delay: 4, blue: true  },
  { x: 67, y: 75, size: 4, opacity: 0.45, delay: 12, blue: false },
  { x: 82, y: 28, size: 3, opacity: 0.5, delay: 6,  blue: true  },
  { x: 55, y: 85, size: 7, opacity: 0.3, delay: 16, blue: false },
  { x: 20, y: 88, size: 4, opacity: 0.4, delay: 10, blue: true  },
  { x: 75, y: 55, size: 5, opacity: 0.35, delay: 2, blue: false },
  { x: 38, y: 15, size: 3, opacity: 0.45, delay: 14, blue: true },
  { x: 90, y: 72, size: 6, opacity: 0.3, delay: 18, blue: false },
]

export const HeroAnimation: React.FC = () => {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(160deg, #ffffff 0%, #eff6ff 60%, #dbeafe 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Gradient orbs — slow sinusoidal drift */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          top: `${-80 + 12 * Math.sin(frame / 60)}px`,
          right: `${80 + 12 * Math.cos(frame / 60 * 0.8)}px`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)',
          bottom: `${-60 + 10 * Math.cos(frame / 60 * 0.6)}px`,
          left: `${60 + 10 * Math.sin(frame / 60 * 0.9)}px`,
        }}
      />

      {/* Thin accent lines */}
      {[
        { top: '38%', left: '8%', width: '22%', delay: 10 },
        { top: '52%', left: '60%', width: '18%', delay: 20 },
        { top: '25%', left: '40%', width: '15%', delay: 30 },
      ].map((line, i) => {
        const lineOpacity = interpolate(
          frame,
          [line.delay, line.delay + 20, 90, 180],
          [0, 0.25, 0.15, 0.25],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        )
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: line.top,
              left: line.left,
              width: line.width,
              height: 1,
              background: `linear-gradient(90deg, transparent, rgba(59,130,246,${lineOpacity}), transparent)`,
            }}
          />
        )
      })}

      {/* Particles */}
      {PARTICLES.map((p, i) => {
        const particleOpacity = interpolate(
          frame,
          [p.delay, p.delay + 20],
          [0, p.opacity],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        )
        const floatY = 4 * Math.sin(frame / 60 + i * 0.8)
        const color = p.blue
          ? `rgba(59,130,246,${particleOpacity})`
          : `rgba(99,102,241,${particleOpacity})`

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: color,
              transform: `translateY(${floatY}px)`,
            }}
          />
        )
      })}
    </AbsoluteFill>
  )
}
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

```bash
cd apps/web && pnpm test HeroAnimation
```

Expected: `2 passed`

- [ ] **Step 5: 커밋**

```bash
git add components/remotion/compositions/HeroAnimation.tsx components/remotion/compositions/HeroAnimation.test.tsx
git commit -m "feat(remotion): add HeroAnimation composition — white/blue particle background"
```

---

## Task 3: StatsReveal Remotion 컴포지션 생성

**Files:**
- Create: `components/remotion/compositions/StatsReveal.tsx`
- Create: `components/remotion/compositions/StatsReveal.test.tsx`

- [ ] **Step 1: 테스트 파일 작성**

`components/remotion/compositions/StatsReveal.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { StatsReveal, STATS_REVEAL_FPS, STATS_REVEAL_DURATION_IN_FRAMES } from './StatsReveal'

vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={style}>{children}</div>
  ),
  useCurrentFrame: () => 60,
  interpolate: (_v: number, _i: number[], o: number[]) => o[1],
}))

describe('StatsReveal', () => {
  it('exports correct fps and duration', () => {
    expect(STATS_REVEAL_FPS).toBe(60)
    expect(STATS_REVEAL_DURATION_IN_FRAMES).toBe(120)
  })

  it('renders all 4 stat labels', () => {
    const { getByText } = render(<StatsReveal />)
    expect(getByText('등록 대상자')).toBeTruthy()
    expect(getByText('보조기기 보유')).toBeTruthy()
    expect(getByText('이달 상담')).toBeTruthy()
    expect(getByText('교부사업 진행')).toBeTruthy()
  })
})
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
cd apps/web && pnpm test StatsReveal
```

Expected: `Cannot find module './StatsReveal'`

- [ ] **Step 3: 컴포지션 파일 작성**

`components/remotion/compositions/StatsReveal.tsx`:

```tsx
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

export const STATS_REVEAL_FPS = 60
export const STATS_REVEAL_DURATION_IN_FRAMES = 120 // 2s

interface StatItem {
  label: string
  value: number
  suffix: string
}

const STATS: StatItem[] = [
  { label: '등록 대상자', value: 1240, suffix: '명' },
  { label: '보조기기 보유', value: 380,  suffix: '개' },
  { label: '이달 상담',    value: 47,   suffix: '건' },
  { label: '교부사업 진행', value: 12,   suffix: '건' },
]

export const StatsReveal: React.FC = () => {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill
      style={{
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 80,
        fontFamily: 'Pretendard, sans-serif',
      }}
    >
      {STATS.map((stat, i) => {
        const delay = i * 15
        const progress = interpolate(frame, [delay, delay + 60], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
        const displayValue = Math.round(stat.value * progress)
        const opacity = interpolate(frame, [delay, delay + 20], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
        const translateY = interpolate(frame, [delay, delay + 30], [20, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })

        return (
          <div
            key={stat.label}
            style={{ opacity, transform: `translateY(${translateY}px)`, textAlign: 'center' }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: '#2563eb',
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              {displayValue.toLocaleString()}
              <span style={{ fontSize: 32 }}>{stat.suffix}</span>
            </div>
            <div style={{ fontSize: 20, color: '#64748b', fontWeight: 500 }}>
              {stat.label}
            </div>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

```bash
cd apps/web && pnpm test StatsReveal
```

Expected: `3 passed`

- [ ] **Step 5: 커밋**

```bash
git add components/remotion/compositions/StatsReveal.tsx components/remotion/compositions/StatsReveal.test.tsx
git commit -m "feat(remotion): add StatsReveal composition — white/blue count-up animation"
```

---

## Task 4: RemotionPlayer — intersectionTrigger 지원 추가

**Files:**
- Create: `components/remotion/RemotionPlayer.tsx`
- Create: `components/remotion/RemotionPlayer.test.tsx`

- [ ] **Step 1: 테스트 파일 작성**

`components/remotion/RemotionPlayer.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { RemotionPlayer } from './RemotionPlayer'

// Mock @remotion/player — forwardRef 필수 (RemotionPlayer가 ref를 전달하기 때문)
vi.mock('@remotion/player', () => ({
  Player: React.forwardRef(
    ({ style }: { style?: React.CSSProperties }, _ref: React.Ref<unknown>) => (
      <div data-testid="remotion-player" style={style} />
    )
  ),
}))

// Mock IntersectionObserver
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()
beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn(() => ({ observe: mockObserve, disconnect: mockDisconnect }))
  )
  mockObserve.mockClear()
  mockDisconnect.mockClear()
})

const DummyComp = () => <div />

describe('RemotionPlayer', () => {
  it('renders Player without crashing', () => {
    const { getByTestId } = render(
      <RemotionPlayer
        component={DummyComp}
        durationInFrames={60}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
      />
    )
    expect(getByTestId('remotion-player')).toBeTruthy()
  })

  it('does not set up IntersectionObserver when intersectionTrigger is false', () => {
    render(
      <RemotionPlayer
        component={DummyComp}
        durationInFrames={60}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        intersectionTrigger={false}
      />
    )
    expect(mockObserve).not.toHaveBeenCalled()
  })

  it('sets up IntersectionObserver when intersectionTrigger is true', () => {
    render(
      <RemotionPlayer
        component={DummyComp}
        durationInFrames={60}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        intersectionTrigger={true}
      />
    )
    expect(mockObserve).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
cd apps/web && pnpm test RemotionPlayer
```

Expected: `Cannot find module './RemotionPlayer'`

- [ ] **Step 3: RemotionPlayer 파일 작성**

`components/remotion/RemotionPlayer.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import type { ComponentType } from 'react'

interface RemotionPlayerProps {
  component: ComponentType
  durationInFrames: number
  fps: number
  compositionWidth: number
  compositionHeight: number
  autoPlay?: boolean
  loop?: boolean
  controls?: boolean
  style?: React.CSSProperties
  className?: string
  intersectionTrigger?: boolean
}

export function RemotionPlayer({
  intersectionTrigger = false,
  autoPlay = true,
  style,
  className,
  ...playerProps
}: RemotionPlayerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<PlayerRef>(null)

  useEffect(() => {
    if (!intersectionTrigger) return
    const el = wrapperRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          playerRef.current?.seekTo(0)
          playerRef.current?.play()
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [intersectionTrigger])

  return (
    <div ref={wrapperRef} style={style} className={className}>
      <Player
        ref={playerRef}
        autoPlay={intersectionTrigger ? false : autoPlay}
        style={{ width: '100%', height: '100%' }}
        {...playerProps}
      />
    </div>
  )
}
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

```bash
cd apps/web && pnpm test RemotionPlayer
```

Expected: `3 passed`

- [ ] **Step 5: 커밋**

```bash
git add components/remotion/RemotionPlayer.tsx components/remotion/RemotionPlayer.test.tsx
git commit -m "feat(remotion): create RemotionPlayer with intersectionTrigger support"
```

---

## Task 5: HomeHeroSection 재작성

**Files:**
- Modify: `components/features/landing/HomeHeroSection.tsx`
- Create: `components/features/landing/HomeHeroSection.test.tsx`

- [ ] **Step 1: 테스트 파일 작성**

`components/features/landing/HomeHeroSection.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { HomeHeroSection } from './HomeHeroSection'

vi.mock('@/components/remotion/RemotionPlayer', () => ({
  RemotionPlayer: () => <div data-testid="remotion-player" />,
}))

vi.mock('@/components/remotion/compositions/HeroAnimation', () => ({
  HeroAnimation: () => null,
  HERO_ANIMATION_FPS: 60,
  HERO_ANIMATION_DURATION_IN_FRAMES: 180,
}))

vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<{ default: React.ComponentType }>) => {
    let Comp: React.ComponentType | null = null
    fn().then((m) => { Comp = m.default })
    return function DynamicComp(props: Record<string, unknown>) {
      return Comp ? <Comp {...props} /> : null
    }
  },
}))

describe('HomeHeroSection', () => {
  it('renders without YouTube iframe', () => {
    const { container } = render(<HomeHeroSection />)
    expect(container.querySelector('iframe')).toBeNull()
  })

  it('renders the main heading', () => {
    const { getByRole } = render(<HomeHeroSection />)
    expect(getByRole('heading', { name: /co-at/i })).toBeTruthy()
  })

  it('renders service link button', () => {
    const { getByRole } = render(<HomeHeroSection />)
    expect(getByRole('link', { name: /서비스 이용하기/i })).toBeTruthy()
  })
})
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
cd apps/web && pnpm test HomeHeroSection
```

Expected: 테스트 실패 (현재 HomeHeroSection에 iframe 존재)

- [ ] **Step 3: HomeHeroSection 재작성**

`components/features/landing/HomeHeroSection.tsx` 전체를 아래로 교체:

```tsx
'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import {
  HERO_ANIMATION_FPS,
  HERO_ANIMATION_DURATION_IN_FRAMES,
} from '@/components/remotion/compositions/HeroAnimation'

const RemotionPlayerDynamic = dynamic(
  () => import('@/components/remotion/RemotionPlayer').then((m) => ({ default: m.RemotionPlayer })),
  { ssr: false }
)

const HeroAnimationDynamic = dynamic(
  () => import('@/components/remotion/compositions/HeroAnimation').then((m) => ({ default: m.HeroAnimation })),
  { ssr: false }
)

export function HomeHeroSection() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[70vh] sm:min-h-[80vh] items-center justify-center overflow-hidden"
    >
      {/* Remotion animated background */}
      <div className="absolute inset-0 z-0">
        <RemotionPlayerDynamic
          component={HeroAnimationDynamic as React.ComponentType}
          durationInFrames={HERO_ANIMATION_DURATION_IN_FRAMES}
          fps={HERO_ANIMATION_FPS}
          compositionWidth={1920}
          compositionHeight={1080}
          loop
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Text overlay — CSS stagger animations */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h1
          className="text-responsive-xl font-bold text-foreground mb-4 sm:mb-6"
          style={{ animation: 'fadeInUp 0.6s ease-out 0.5s both' }}
        >
          Co-AT
        </h1>
        <p
          className="text-responsive-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto"
          style={{ animation: 'fadeInUp 0.6s ease-out 1.0s both' }}
        >
          행정은 AI에게, 사람은 클라이언트에게
        </p>
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          style={{ animation: 'fadeInScale 0.5s ease-out 1.6s both' }}
        >
          <Button asChild size="lg" className="text-base sm:text-lg px-6 sm:px-8">
            <Link href="/mypage" aria-label="서비스 이용하기 페이지로 이동">
              서비스 이용하기
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="text-base sm:text-lg px-6 sm:px-8 border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Link href="/notices" aria-label="공지사항 페이지로 이동">
              공지사항 보기
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

```bash
cd apps/web && pnpm test HomeHeroSection
```

Expected: `3 passed`

- [ ] **Step 5: 커밋**

```bash
git add components/features/landing/HomeHeroSection.tsx components/features/landing/HomeHeroSection.test.tsx
git commit -m "feat(web): replace YouTube hero background with Remotion animation"
```

---

## Task 6: HomeStatsSection 컴포넌트 생성

**Files:**
- Create: `components/features/landing/HomeStatsSection.tsx`
- Create: `components/features/landing/HomeStatsSection.test.tsx`

- [ ] **Step 1: 테스트 파일 작성**

`components/features/landing/HomeStatsSection.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { HomeStatsSection } from './HomeStatsSection'

vi.mock('@/components/remotion/RemotionPlayer', () => ({
  RemotionPlayer: ({ intersectionTrigger }: { intersectionTrigger?: boolean }) => (
    <div data-testid="remotion-player" data-intersection={String(intersectionTrigger)} />
  ),
}))

vi.mock('@/components/remotion/compositions/StatsReveal', () => ({
  StatsReveal: () => null,
  STATS_REVEAL_FPS: 60,
  STATS_REVEAL_DURATION_IN_FRAMES: 120,
}))

vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<{ default: React.ComponentType }>) => {
    let Comp: React.ComponentType | null = null
    fn().then((m) => { Comp = m.default })
    return function DynamicComp(props: Record<string, unknown>) {
      return Comp ? <Comp {...props} /> : null
    }
  },
}))

describe('HomeStatsSection', () => {
  it('renders the section', () => {
    const { container } = render(<HomeStatsSection />)
    expect(container.querySelector('section')).toBeTruthy()
  })

  it('passes intersectionTrigger=true to RemotionPlayer', () => {
    const { getByTestId } = render(<HomeStatsSection />)
    expect(getByTestId('remotion-player').dataset.intersection).toBe('true')
  })
})
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
cd apps/web && pnpm test HomeStatsSection
```

Expected: `Cannot find module './HomeStatsSection'`

- [ ] **Step 3: HomeStatsSection 파일 작성**

`components/features/landing/HomeStatsSection.tsx`:

```tsx
'use client'

import dynamic from 'next/dynamic'
import {
  STATS_REVEAL_FPS,
  STATS_REVEAL_DURATION_IN_FRAMES,
} from '@/components/remotion/compositions/StatsReveal'

const RemotionPlayerDynamic = dynamic(
  () => import('@/components/remotion/RemotionPlayer').then((m) => ({ default: m.RemotionPlayer })),
  { ssr: false }
)

const StatsRevealDynamic = dynamic(
  () => import('@/components/remotion/compositions/StatsReveal').then((m) => ({ default: m.StatsReveal })),
  { ssr: false }
)

export function HomeStatsSection() {
  return (
    <section id="stats" className="py-12 sm:py-16 bg-white scroll-mt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-responsive-lg font-bold text-center text-foreground mb-8">
          센터 현황
        </h2>
        <RemotionPlayerDynamic
          component={StatsRevealDynamic as React.ComponentType}
          durationInFrames={STATS_REVEAL_DURATION_IN_FRAMES}
          fps={STATS_REVEAL_FPS}
          compositionWidth={1920}
          compositionHeight={300}
          intersectionTrigger
          loop={false}
          style={{ width: '100%', height: '160px' }}
        />
      </div>
    </section>
  )
}
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

```bash
cd apps/web && pnpm test HomeStatsSection
```

Expected: `2 passed`

- [ ] **Step 5: 커밋**

```bash
git add components/features/landing/HomeStatsSection.tsx components/features/landing/HomeStatsSection.test.tsx
git commit -m "feat(web): add HomeStatsSection with scroll-triggered Remotion count-up"
```

---

## Task 7: page.tsx에 HomeStatsSection 연결

**Files:**
- Modify: `apps/web/app/(public)/page.tsx`

- [ ] **Step 1: import 추가 및 JSX 수정**

`apps/web/app/(public)/page.tsx`에서 두 가지 변경:

**① import 추가** (기존 import 아래):
```tsx
import { HomeStatsSection } from "@/components/features/landing/HomeStatsSection"
```

**② HomeHeroSection에서 featuredVideo prop 제거 + HomeStatsSection 삽입**

`HomeHeroSection`은 더 이상 `featuredVideo`를 받지 않으므로 prop을 제거한다.
YouTube 영상은 `HomePageClientSections`의 갤러리 섹션에서 계속 사용되므로 `videos` fetch는 유지한다.

```tsx
{/* featuredVideo prop 제거 */}
<HomeHeroSection />

{/* 5대 핵심 사업 바로가기 */}
<HomeQuickMenuGrid />

{/* 센터 현황 카운터 */}
<HomeStatsSection />

{/* 공지사항, 캘린더, 갤러리 (Client Component에서 ssr: false) */}
<HomePageClientSections
  notices={notices}
  supportNotices={supportNotices}
  schedules={schedules}
  videos={videos}
/>
```

- [ ] **Step 2: TypeScript 타입 오류 없는지 확인**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add apps/web/app/\(public\)/page.tsx
git commit -m "feat(web): wire HomeStatsSection into homepage"
```

---

## Task 8: Remotion Studio 경로 업데이트 및 구 파일 삭제

**Files:**
- Modify: `apps/web/remotion/Root.tsx`
- Delete: `apps/web/remotion/compositions/HeroAnimation.tsx`
- Delete: `apps/web/remotion/compositions/StatsReveal.tsx`
- Delete: `apps/web/components/remotion/RemotionPlayer.tsx`

- [ ] **Step 1: Root.tsx 임포트 경로 업데이트**

`apps/web/remotion/Root.tsx` 전체를 아래로 교체:

```tsx
import { Composition } from 'remotion'
import {
  HeroAnimation,
  HERO_ANIMATION_FPS,
  HERO_ANIMATION_DURATION_IN_FRAMES,
} from '../../components/remotion/compositions/HeroAnimation'
import {
  StatsReveal,
  STATS_REVEAL_FPS,
  STATS_REVEAL_DURATION_IN_FRAMES,
} from '../../components/remotion/compositions/StatsReveal'

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="HeroAnimation"
        component={HeroAnimation}
        durationInFrames={HERO_ANIMATION_DURATION_IN_FRAMES}
        fps={HERO_ANIMATION_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="StatsReveal"
        component={StatsReveal}
        durationInFrames={STATS_REVEAL_DURATION_IN_FRAMES}
        fps={STATS_REVEAL_FPS}
        width={1920}
        height={300}
      />
    </>
  )
}
```

- [ ] **Step 2: 구 파일 삭제**

```bash
rm apps/web/remotion/compositions/HeroAnimation.tsx
rm apps/web/remotion/compositions/StatsReveal.tsx
rm apps/web/components/remotion/RemotionPlayer.tsx
```

- [ ] **Step 3: TypeScript 오류 없는지 확인**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: Remotion Studio 정상 동작 확인**

```bash
cd apps/web && pnpm studio
```

Expected: http://localhost:3001 에서 HeroAnimation, StatsReveal 컴포지션이 보임

- [ ] **Step 5: 커밋**

```bash
git add apps/web/remotion/Root.tsx
git rm apps/web/remotion/compositions/HeroAnimation.tsx
git rm apps/web/remotion/compositions/StatsReveal.tsx
git rm apps/web/components/remotion/RemotionPlayer.tsx
git commit -m "refactor(remotion): move compositions to monorepo root, update studio imports"
```

---

## Task 9: 전체 빌드 및 UI 검증

- [ ] **Step 1: 전체 테스트 실행**

```bash
cd apps/web && pnpm test
```

Expected: 모든 테스트 pass

- [ ] **Step 2: 개발 서버 실행**

```bash
pnpm dev
```

Expected: http://localhost:3000 에서 web 앱 구동

- [ ] **Step 3: 홈페이지 UI 확인 체크리스트**

브라우저에서 http://localhost:3000 접속 후 확인:

- [ ] Hero 섹션: 흰 배경 + 파란 파티클 애니메이션 보임
- [ ] Hero 섹션: "Co-AT" h1 텍스트가 0.5초 딜레이 후 아래에서 올라오며 나타남
- [ ] Hero 섹션: 부제목 1.0초 딜레이 후 나타남
- [ ] Hero 섹션: 버튼들 1.6초 딜레이 후 스케일 팝인
- [ ] Hero 섹션: YouTube iframe 없음 (DevTools Network 탭에서 youtube.com 요청 없음)
- [ ] 5대 핵심사업 카드 아래: "센터 현황" 섹션 존재
- [ ] Stats 섹션: 스크롤하면 숫자가 0에서 카운트업 (1,240명 / 380개 / 47건 / 12건)
- [ ] Stats 섹션: 재생 후 마지막 숫자에서 멈춤 (loop 없음)
- [ ] 나머지 섹션(공지사항, 캘린더, 파트너 마퀴) 정상 동작

- [ ] **Step 4: 최종 커밋**

```bash
git add -A
git commit -m "feat(web): homepage Remotion animation — cinematic hero + stats counter"
```
