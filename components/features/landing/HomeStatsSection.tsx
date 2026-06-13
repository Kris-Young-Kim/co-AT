'use client'

import React from 'react'
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
