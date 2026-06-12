import React from 'react'
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
