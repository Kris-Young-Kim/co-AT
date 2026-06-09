'use client'

import { Player } from '@remotion/player'
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
}

export function RemotionPlayer({
  component,
  durationInFrames,
  fps,
  compositionWidth,
  compositionHeight,
  autoPlay = true,
  loop = false,
  controls = false,
  style,
}: RemotionPlayerProps) {
  return (
    <Player
      component={component}
      durationInFrames={durationInFrames}
      fps={fps}
      compositionWidth={compositionWidth}
      compositionHeight={compositionHeight}
      autoPlay={autoPlay}
      loop={loop}
      controls={controls}
      style={style}
    />
  )
}
