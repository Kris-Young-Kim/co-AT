'use client'

import React, { useEffect, useLayoutEffect, useRef } from 'react'
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
  initiallyMuted?: boolean
  numberOfSharedAudioTags?: number
  style?: React.CSSProperties
  className?: string
  intersectionTrigger?: boolean
  freezeAtLastFrame?: boolean
}

export function RemotionPlayer({
  intersectionTrigger = false,
  autoPlay = true,
  freezeAtLastFrame = false,
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
          requestAnimationFrame(() => {
            playerRef.current?.seekTo(0)
            playerRef.current?.play()
          })
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [intersectionTrigger])

  // When the animation ends (loop=false), Remotion resets to frame 0 via
  // moveToBeginningWhenEnded. freezeAtLastFrame counters this by seeking
  // back to the last frame so the final values stay visible.
  // seekTo must be deferred via setTimeout to avoid recursive dispatchEvent
  // when called synchronously inside the 'ended' handler.
  useEffect(() => {
    if (!freezeAtLastFrame) return
    const player = playerRef.current
    if (!player) return
    let tid: ReturnType<typeof setTimeout>
    const handler = () => {
      tid = setTimeout(() => player.seekTo(playerProps.durationInFrames - 1), 0)
    }
    player.addEventListener('ended', handler)
    return () => {
      player.removeEventListener('ended', handler)
      clearTimeout(tid)
    }
  }, [freezeAtLastFrame, playerProps.durationInFrames])

  // Remotion's internal autoPlay useEffect fails under React 19 StrictMode:
  // shouldAutoplay is set to false on the first invocation, so the second
  // invocation (after StrictMode cleanup) never calls play(). We own the call
  // instead. useLayoutEffect fires synchronously during commit so setPlaying(true)
  // is flushed before the concurrent scheduler can defer it. On the StrictMode
  // second invocation, imperativePlaying.current is already true so play() is
  // a no-op — playing state from cycle 1 is preserved.
  useLayoutEffect(() => {
    if (!autoPlay || intersectionTrigger) return
    playerRef.current?.play()
  }, [autoPlay, intersectionTrigger])

  return (
    <div ref={wrapperRef} style={style} className={className}>
      <Player
        ref={playerRef}
        autoPlay={false}
        style={{ width: '100%', height: '100%' }}
        {...playerProps}
      />
    </div>
  )
}
