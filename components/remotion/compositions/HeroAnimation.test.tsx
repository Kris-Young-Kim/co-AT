import React from 'react'
import { describe, it, expect, vi } from 'vitest'
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
