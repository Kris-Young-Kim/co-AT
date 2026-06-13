'use client'

import React, { useEffect, useRef } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import type { ComponentType } from 'react'

interface RemotionPlayerProps {
  component: ComponentType
  durationInFrames: number
  fps: number
  compositionWidth: number
  compositionHeight: number
  autoPlay?: boolean
  loop?: boolean
  controls?: boolean
  style?: React.CSSProperties
  className?: string
  intersectionTrigger?: boolean
}

export function RemotionPlayer({
  intersectionTrigger = false,
  autoPlay = true,
  style,
  className,
  ...playerProps
}: RemotionPlayerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<PlayerRef>(null)

  useEffect(() => {
    if (!intersectionTrigger) return
    const el = wrapperRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          playerRef.current?.seekTo(0)
          playerRef.current?.play()
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [intersectionTrigger])

  return (
    <div ref={wrapperRef} style={style} className={className}>
      <Player
        ref={playerRef}
        autoPlay={intersectionTrigger ? false : autoPlay}
        style={{ width: '100%', height: '100%' }}
        {...playerProps}
      />
    </div>
  )
}
