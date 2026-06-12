# Homepage Remotion Animation — Design Spec

**Date**: 2026-06-13  
**Scope**: `apps/web` — public homepage (`gwatc.cloud`)  
**Status**: Approved

---

## Goal

Replace the static/YouTube-backed Hero section with a Remotion-powered cinematic animation, and add a scroll-triggered Stats counter section. The result should feel lively and premium while remaining appropriate for a public welfare organization.

---

## Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Color style | White + Blue accent | Clean, trustworthy, public-sector feel |
| Hero background | Remotion replaces YouTube iframe | Enables bright background; YouTube clips already appear in notice/gallery sections |
| Animation scope | Hero + Stats only | Best impact-to-effort ratio; other sections stay unchanged |
| Hero sequence | Classic stagger | Stable, readable, best use of Remotion spring/interpolate |
| Stats trigger | IntersectionObserver on scroll | Standard UX — plays once when section enters viewport |

---

## Section 1: Hero Animation

### Visual Style
- Background: `linear-gradient(160deg, #ffffff 0%, #eff6ff 60%, #dbeafe 100%)`
- Accent color: `#2563eb` (blue-600)
- Font: Pretendard (existing)

### Layer Architecture

Remotion Player는 **배경 레이어**만 담당합니다. 텍스트·버튼은 JSX 오버레이로 유지합니다.

**이유**: Remotion composition 내부에서는 Next.js `<Link>` 라우팅이 동작하지 않습니다. 텍스트·버튼을 composition 안에 넣으면 CTA 클릭이 불가능해집니다.

```
<section>
  <RemotionPlayer />          ← z-0: 파티클 + 그라데이션 배경 (Remotion)
  <div className="z-10">     ← z-10: 텍스트 + 버튼 (JSX + CSS 애니메이션)
    <h1>Co-AT</h1>
    <p>행정은 AI에게...</p>
    <Link>서비스 이용하기</Link>
  </div>
</section>
```

### Remotion Composition 애니메이션 (3s · 60fps · 180 frames)

Remotion이 담당하는 배경 요소만:

| Frame range | Element | Animation |
|---|---|---|
| 0–30 (0–0.5s) | 블루 파티클 dot 10개 | `interpolate` opacity 0→1, 고정 좌표 stagger |
| 0–180 (0–3s) | 그라데이션 오브 2개 | 느린 float drift (sin/cos 기반) |
| 0–180 (0–3s) | 얇은 연결선 3개 | opacity pulse |

**Particles**: 고정 좌표(seeded, 프레임마다 랜덤 아님), 크기 3–7px, `rgba(59,130,246,·)` · `rgba(99,102,241,·)`.

**Loop**: `loop={true}`.  
**Controls**: hidden.

### JSX 오버레이 텍스트 애니메이션

CSS `@keyframes` + `animation-delay`로 스태거 구현 (Tailwind `animate-` 커스텀 또는 인라인 style):

| Element | Delay | Effect |
|---|---|---|
| h1 "Co-AT" | 0.5s | `fadeInUp` 0.6s ease-out |
| p line 1 | 1.0s | `fadeInUp` 0.6s ease-out |
| p line 2 | 1.25s | `fadeInUp` 0.6s ease-out |
| CTA buttons | 1.75s | `fadeInScale` 0.5s spring-like |

### Composition config
```ts
id: "HeroAnimation"
width: 1920, height: 1080
fps: 60, durationInFrames: 180
```

### Integration — `HomeHeroSection.tsx`
- `<iframe>` YouTube embed 및 fallback `<Image>` 제거
- 다크 오버레이 div 제거 (흰 배경이므로 불필요)
- `<RemotionPlayer>` 삽입 (`absolute inset-0 z-0`, dynamic import `ssr: false`)
- 기존 텍스트·버튼 JSX 유지, CSS 애니메이션 클래스 추가
- `globals.css`에 `fadeInUp`, `fadeInScale` keyframes 추가

---

## Section 2: Stats Counter Section

### Visual Style
- Background: `#f8fafc` (slate-50) — contrasts with white hero above
- Numbers: `#2563eb`, label: `#64748b`

### Stats Data (4 items)
| Label | Value | Suffix |
|---|---|---|
| 등록 대상자 | 1,240 | 명 |
| 보조기기 보유 | 380 | 개 |
| 이달 상담 | 47 | 건 |
| 교부사업 진행 | 12 | 건 |

### Animation (2s · 60fps · 120 frames)
- Each stat staggered by 15 frames
- `interpolate` count 0 → final value (easeOut)
- `interpolate` opacity 0→1 + translateY 20→0 on entry

**Loop**: `loop={false}` — plays once, holds last frame.  
**Trigger**: `IntersectionObserver` in `RemotionPlayer` — sets `autoPlay` only when section enters viewport (threshold 0.3).

### Composition config
```ts
id: "StatsReveal"
width: 1920, height: 300
fps: 60, durationInFrames: 120
```

### Integration
- New component: `components/features/landing/HomeStatsSection.tsx`
- Inserted in `page.tsx` between `<HomeQuickMenuGrid />` and `<HomePageClientSections />`
- Renders `<RemotionPlayer>` with `intersectionTrigger={true}` prop

---

## Files to Create / Modify

| File | Action |
|---|---|
| `remotion/compositions/HeroAnimation.tsx` | Rewrite — white+blue style, particle system, 4-phase stagger |
| `remotion/compositions/StatsReveal.tsx` | Update — correct data, white style, match blue accent |
| `components/remotion/RemotionPlayer.tsx` | Add `intersectionTrigger` prop + IntersectionObserver logic |
| `components/features/landing/HomeHeroSection.tsx` | Remove YouTube/image bg, insert RemotionPlayer, remove text overlay |
| `components/features/landing/HomeStatsSection.tsx` | **New** — wraps StatsReveal RemotionPlayer with section layout |
| `apps/web/app/(public)/page.tsx` | Add `<HomeStatsSection />` between QuickMenu and ClientSections |

---

## Out of Scope

- Other homepage sections (notices, calendar, gallery, partner marquee) — unchanged
- Other apps (admin, eval, inventory, etc.)
- Mobile-specific breakpoint animations (standard responsive sizing only)
- Audio

---

## Constraints

- `@remotion/player` v4 already installed — no new packages needed
- Dynamic import required for RemotionPlayer (`next/dynamic`, `ssr: false`) — already in place
- All Remotion compositions must use inline styles (no Tailwind inside Remotion)
- No `any` types — strict TypeScript throughout
