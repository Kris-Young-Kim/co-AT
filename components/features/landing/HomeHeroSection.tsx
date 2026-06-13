'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

// Load RemotionPlayer + HeroAnimation together so Remotion receives a static component ref
const HeroAnimationPlayer = dynamic(
  async () => {
    const [{ RemotionPlayer }, { HeroAnimation, HERO_ANIMATION_FPS, HERO_ANIMATION_DURATION_IN_FRAMES }] =
      await Promise.all([
        import('@/components/remotion/RemotionPlayer'),
        import('@/components/remotion/compositions/HeroAnimation'),
      ])
    function HeroAnimationPlayerInner() {
      return (
        <RemotionPlayer
          component={HeroAnimation}
          durationInFrames={HERO_ANIMATION_DURATION_IN_FRAMES}
          fps={HERO_ANIMATION_FPS}
          compositionWidth={1920}
          compositionHeight={1080}
          initiallyMuted
          numberOfSharedAudioTags={0}
          loop
          style={{ width: '100%', height: '100%' }}
        />
      )
    }
    return { default: HeroAnimationPlayerInner }
  },
  { ssr: false }
)

export function HomeHeroSection() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[70vh] sm:min-h-[80vh] items-center justify-center overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100"
    >
      {/* Remotion animated background — CSS gradient shows until Remotion loads */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: 'linear-gradient(160deg, #ffffff 0%, #eff6ff 60%, #dbeafe 100%)' }}
      >
        <HeroAnimationPlayer />
      </div>

      {/* Text overlay — CSS stagger animations */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h1
          className="text-responsive-xl font-bold text-foreground mb-4 sm:mb-6"
          style={{ animation: 'fadeInUp 0.6s ease-out 0.5s both' }}
        >
          Co-AT
        </h1>
        <p
          className="text-responsive-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto"
          style={{ animation: 'fadeInUp 0.6s ease-out 1.0s both' }}
        >
          행정은 AI에게, 사람은 클라이언트에게
        </p>
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          style={{ animation: 'fadeInScale 0.5s ease-out 1.6s both' }}
        >
          <Button asChild size="lg" className="text-base sm:text-lg px-6 sm:px-8">
            <Link href="/mypage" aria-label="서비스 이용하기 페이지로 이동">
              서비스 이용하기
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="text-base sm:text-lg px-6 sm:px-8 border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Link href="/notices" aria-label="공지사항 페이지로 이동">
              공지사항 보기
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
