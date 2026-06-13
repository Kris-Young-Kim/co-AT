'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

// Load RemotionPlayer + StatsReveal together so Remotion receives a static component ref
const StatsAnimationPlayer = dynamic(
  async () => {
    const [{ RemotionPlayer }, { StatsReveal, STATS_REVEAL_FPS, STATS_REVEAL_DURATION_IN_FRAMES }] =
      await Promise.all([
        import('@/components/remotion/RemotionPlayer'),
        import('@/components/remotion/compositions/StatsReveal'),
      ])
    function StatsAnimationPlayerInner() {
      return (
        <RemotionPlayer
          component={StatsReveal}
          durationInFrames={STATS_REVEAL_DURATION_IN_FRAMES}
          fps={STATS_REVEAL_FPS}
          compositionWidth={1920}
          compositionHeight={300}
          autoPlay
          initiallyMuted
          numberOfSharedAudioTags={0}
          loop={false}
          freezeAtLastFrame
          style={{ width: '100%', height: '100%' }}
        />
      )
    }
    return { default: StatsAnimationPlayerInner }
  },
  { ssr: false }
)

export function HomeStatsSection() {
  const triggerRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = triggerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="stats" className="py-12 sm:py-16 bg-white scroll-mt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-responsive-lg font-bold text-center text-foreground mb-8">
          센터 현황
        </h2>
        <div ref={triggerRef} style={{ width: '100%', height: '160px' }}>
          {inView && <StatsAnimationPlayer />}
        </div>
      </div>
    </section>
  )
}
