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
  floatSpeed: number
  floatAmp: number
}

const PARTICLES: Particle[] = [
  { x: 12, y: 18, size: 14, opacity: 0.85, delay: 0,  blue: true,  floatSpeed: 0.9, floatAmp: 22 },
  { x: 28, y: 62, size: 10, opacity: 0.75, delay: 8,  blue: false, floatSpeed: 1.1, floatAmp: 18 },
  { x: 45, y: 32, size: 18, opacity: 0.80, delay: 4,  blue: true,  floatSpeed: 0.7, floatAmp: 28 },
  { x: 67, y: 75, size: 12, opacity: 0.70, delay: 12, blue: false, floatSpeed: 1.3, floatAmp: 20 },
  { x: 82, y: 28, size: 10, opacity: 0.85, delay: 6,  blue: true,  floatSpeed: 0.8, floatAmp: 24 },
  { x: 55, y: 85, size: 20, opacity: 0.65, delay: 16, blue: false, floatSpeed: 1.0, floatAmp: 16 },
  { x: 20, y: 88, size: 12, opacity: 0.72, delay: 10, blue: true,  floatSpeed: 1.2, floatAmp: 20 },
  { x: 75, y: 55, size: 16, opacity: 0.78, delay: 2,  blue: false, floatSpeed: 0.9, floatAmp: 26 },
  { x: 38, y: 15, size: 8,  opacity: 0.80, delay: 14, blue: true,  floatSpeed: 1.1, floatAmp: 18 },
  { x: 90, y: 72, size: 18, opacity: 0.60, delay: 18, blue: false, floatSpeed: 0.7, floatAmp: 22 },
  { x: 5,  y: 50, size: 10, opacity: 0.70, delay: 5,  blue: true,  floatSpeed: 1.4, floatAmp: 16 },
  { x: 60, y: 10, size: 14, opacity: 0.75, delay: 9,  blue: false, floatSpeed: 0.8, floatAmp: 24 },
  { x: 35, y: 78, size: 8,  opacity: 0.65, delay: 13, blue: true,  floatSpeed: 1.2, floatAmp: 20 },
  { x: 85, y: 45, size: 12, opacity: 0.80, delay: 3,  blue: false, floatSpeed: 1.0, floatAmp: 18 },
]

const LINES = [
  { top: '30%', left: '5%',  width: '28%', delay: 0  },
  { top: '50%', left: '55%', width: '30%', delay: 15 },
  { top: '20%', left: '35%', width: '22%', delay: 25 },
  { top: '68%', left: '15%', width: '25%', delay: 10 },
  { top: '75%', left: '60%', width: '20%', delay: 20 },
]

export const HeroAnimation: React.FC = () => {
  const frame = useCurrentFrame()

  // background pulse between two gradient stops
  const bgShift = interpolate(Math.sin(frame / 90), [-1, 1], [0, 15])

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, #ffffff 0%, #eff6ff ${55 + bgShift}%, #bfdbfe 100%)`,
        overflow: 'hidden',
      }}
    >
      {/* large orb top-right — big movement, high opacity */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.40) 0%, transparent 65%)',
          top: `${-120 + 70 * Math.sin(frame / 80)}px`,
          right: `${60 + 60 * Math.cos(frame / 80 * 0.8)}px`,
        }}
      />
      {/* large orb bottom-left */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.38) 0%, transparent 65%)',
          bottom: `${-100 + 60 * Math.cos(frame / 70 * 0.7)}px`,
          left: `${40 + 55 * Math.sin(frame / 70 * 0.9)}px`,
        }}
      />
      {/* mid orb center — drifts across */}
      <div
        style={{
          position: 'absolute',
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(147,197,253,0.30) 0%, transparent 65%)',
          top: `${30 + 50 * Math.sin(frame / 100 + 1)}%`,
          left: `${35 + 20 * Math.cos(frame / 100 * 0.6)}%`,
        }}
      />

      {/* pulsing rings */}
      {[0, 40, 80].map((offset, i) => {
        const pulse = (frame + offset) % 120
        const ringScale = interpolate(pulse, [0, 120], [0.4, 2.2])
        const ringOpacity = interpolate(pulse, [0, 60, 120], [0.6, 0.3, 0])
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 180,
              height: 180,
              borderRadius: '50%',
              border: `2px solid rgba(59,130,246,${ringOpacity})`,
              top: '38%',
              left: '70%',
              transform: `translate(-50%, -50%) scale(${ringScale})`,
            }}
          />
        )
      })}

      {/* lines */}
      {LINES.map((line, i) => {
        const lo = interpolate(
          frame,
          [line.delay, line.delay + 15, 90, 180],
          [0, 0.75, 0.55, 0.75],
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
              height: 2,
              background: `linear-gradient(90deg, transparent, rgba(59,130,246,${lo}), transparent)`,
            }}
          />
        )
      })}

      {/* particles */}
      {PARTICLES.map((p, i) => {
        const po = interpolate(
          frame,
          [p.delay, p.delay + 15],
          [0, p.opacity],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        )
        const floatY = p.floatAmp * Math.sin(frame / 60 * p.floatSpeed + i * 0.8)
        const floatX = (p.floatAmp * 0.4) * Math.cos(frame / 60 * p.floatSpeed * 0.7 + i)
        const color = p.blue
          ? `rgba(59,130,246,${po})`
          : `rgba(99,102,241,${po})`

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
              boxShadow: `0 0 ${p.size * 2}px ${color}`,
              transform: `translate(${floatX}px, ${floatY}px)`,
            }}
          />
        )
      })}
    </AbsoluteFill>
  )
}
