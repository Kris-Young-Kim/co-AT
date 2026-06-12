import React from 'react'
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
  default: (_fn: unknown) => {
    return function DynamicComp(_props: Record<string, unknown>) {
      return null
    }
  },
}))

describe('HomeStatsSection', () => {
  it('renders the section element', () => {
    const { container } = render(<HomeStatsSection />)
    expect(container.querySelector('section')).toBeTruthy()
  })

  it('renders the heading', () => {
    const { getByRole } = render(<HomeStatsSection />)
    expect(getByRole('heading', { name: /센터 현황/i })).toBeTruthy()
  })
})
