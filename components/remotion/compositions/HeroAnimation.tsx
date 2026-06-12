import React from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

export const HERO_ANIMATION_FPS = 60
export const HERO_ANIMATION_DURATION_IN_FRAMES = 180 // 3s

interface Particle {
  x: number
  y: number
  size: number
  opacity: number
  delay: number
  blue: boolean
}

const PARTICLES: Particle[] = [
  { x: 12, y: 18, size: 5, opacity: 0.5, delay: 0,  blue: true  },
  { x: 28, y: 62, size: 3, opacity: 0.4, delay: 8,  blue: false },
  { x: 45, y: 32, size: 6, opacity: 0.35, delay: 4, blue: true  },
  { x: 67, y: 75, size: 4, opacity: 0.45, delay: 12, blue: false },
  { x: 82, y: 28, size: 3, opacity: 0.5, delay: 6,  blue: true  },
  { x: 55, y: 85, size: 7, opacity: 0.3, delay: 16, blue: false },
  { x: 20, y: 88, size: 4, opacity: 0.4, delay: 10, blue: true  },
  { x: 75, y: 55, size: 5, opacity: 0.35, delay: 2, blue: false },
  { x: 38, y: 15, size: 3, opacity: 0.45, delay: 14, blue: true },
  { x: 90, y: 72, size: 6, opacity: 0.3, delay: 18, blue: false },
]

export const HeroAnimation: React.FC = () => {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(160deg, #ffffff 0%, #eff6ff 60%, #dbeafe 100%)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          top: `${-80 + 12 * Math.sin(frame / 60)}px`,
          right: `${80 + 12 * Math.cos(frame / 60 * 0.8)}px`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)',
          bottom: `${-60 + 10 * Math.cos(frame / 60 * 0.6)}px`,
          left: `${60 + 10 * Math.sin(frame / 60 * 0.9)}px`,
        }}
      />

      {[
        { top: '38%', left: '8%', width: '22%', delay: 10 },
        { top: '52%', left: '60%', width: '18%', delay: 20 },
        { top: '25%', left: '40%', width: '15%', delay: 30 },
      ].map((line, i) => {
        const lineOpacity = interpolate(
          frame,
          [line.delay, line.delay + 20, 90, 180],
          [0, 0.25, 0.15, 0.25],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        )
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: line.top,
              left: line.left,
              width: line.width,
              height: 1,
              background: `linear-gradient(90deg, transparent, rgba(59,130,246,${lineOpacity}), transparent)`,
            }}
          />
        )
      })}

      {PARTICLES.map((p, i) => {
        const particleOpacity = interpolate(
          frame,
          [p.delay, p.delay + 20],
          [0, p.opacity],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        )
        const floatY = 4 * Math.sin(frame / 60 + i * 0.8)
        const color = p.blue
          ? `rgba(59,130,246,${particleOpacity})`
          : `rgba(99,102,241,${particleOpacity})`

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: color,
              transform: `translateY(${floatY}px)`,
            }}
          />
        )
      })}
    </AbsoluteFill>
  )
}
