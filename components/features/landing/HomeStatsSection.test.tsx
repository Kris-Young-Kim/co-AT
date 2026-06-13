import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { HomeStatsSection } from './HomeStatsSection'

// Dynamic import returns null in tests — real player behavior tested in RemotionPlayer.test.tsx
vi.mock('next/dynamic', () => ({
  default: (_fn: unknown) => function DynamicComp() { return null },
}))

describe('HomeStatsSection', () => {
  it('renders the section element', () => {
    const { container } = render(<HomeStatsSection />)
    expect(container.querySelector('section#stats')).toBeTruthy()
  })

  it('renders the 센터 현황 heading', () => {
    const { getByRole } = render(<HomeStatsSection />)
    expect(getByRole('heading', { name: /센터 현황/i })).toBeTruthy()
  })
})
