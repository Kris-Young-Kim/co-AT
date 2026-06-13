import { Composition } from 'remotion'
import {
  HeroAnimation,
  HERO_ANIMATION_FPS,
  HERO_ANIMATION_DURATION_IN_FRAMES,
} from '@/components/remotion/compositions/HeroAnimation'
import {
  StatsReveal,
  STATS_REVEAL_FPS,
  STATS_REVEAL_DURATION_IN_FRAMES,
} from '@/components/remotion/compositions/StatsReveal'

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="HeroAnimation"
        component={HeroAnimation}
        durationInFrames={HERO_ANIMATION_DURATION_IN_FRAMES}
        fps={HERO_ANIMATION_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="StatsReveal"
        component={StatsReveal}
        durationInFrames={STATS_REVEAL_DURATION_IN_FRAMES}
        fps={STATS_REVEAL_FPS}
        width={1920}
        height={300}
      />
    </>
  )
}
