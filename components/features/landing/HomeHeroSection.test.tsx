import React from 'react'
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
  default: (_fn: unknown) => {
    return function DynamicComp(_props: Record<string, unknown>) {
      return null
    }
  },
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, ...props }: { children: React.ReactNode; asChild?: boolean; [key: string]: unknown }) => (
    <button {...props}>{children}</button>
  ),
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
    const { getByText } = render(<HomeHeroSection />)
    expect(getByText(/서비스 이용하기/i)).toBeTruthy()
  })
})
