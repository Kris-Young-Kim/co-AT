import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { RemotionPlayer } from './RemotionPlayer'

// forwardRef is required because RemotionPlayer passes ref to Player
vi.mock('@remotion/player', () => ({
  Player: React.forwardRef(
    ({ style }: { style?: React.CSSProperties }, _ref: React.Ref<unknown>) => (
      <div data-testid="remotion-player" style={style} />
    )
  ),
}))

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
