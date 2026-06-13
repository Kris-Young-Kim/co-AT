import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { HomeStatsSection } from './HomeStatsSection'

vi.mock('@/components/remotion/compositions/StatsReveal', () => ({
  StatsReveal: () => null,
  STATS_REVEAL_FPS: 60,
  STATS_REVEAL_DURATION_IN_FRAMES: 120,
}))

vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<{ default: React.ComponentType }>) => {
    const fnStr = fn.toString()
    if (fnStr.includes('RemotionPlayer')) {
      return ({ intersectionTrigger, ...rest }: Record<string, unknown>) => (
        <div data-testid="remotion-player" data-intersection={String(intersectionTrigger)} />
      )
    }
    return () => null
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
