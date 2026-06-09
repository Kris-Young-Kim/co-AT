import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

export const HERO_ANIMATION_FPS = 60
export const HERO_ANIMATION_DURATION_IN_FRAMES = 180 // 3 seconds

export const HeroAnimation: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' })
  const titleY = interpolate(frame, [0, 30], [40, 0], { extrapolateRight: 'clamp' })

  const subtitleOpacity = interpolate(frame, [20, 50], [0, 1], { extrapolateRight: 'clamp' })
  const subtitleY = interpolate(frame, [20, 50], [30, 0], { extrapolateRight: 'clamp' })

  const buttonScale = spring({
    fps,
    frame: frame - 50,
    config: { damping: 14, stiffness: 200 },
  })

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Pretendard, sans-serif',
      }}
    >
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          color: '#ffffff',
          fontSize: 72,
          fontWeight: 700,
          textAlign: 'center',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          marginBottom: 24,
        }}
      >
        보조공학센터
        <br />
        통합 업무 시스템
      </div>

      <div
        style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          color: 'rgba(255,255,255,0.8)',
          fontSize: 28,
          textAlign: 'center',
          marginBottom: 48,
        }}
      >
        상담·평가·보조기기 신청부터 통계까지
        <br />
        하나의 플랫폼에서
      </div>

      <div
        style={{
          transform: `scale(${buttonScale})`,
          background: '#ffffff',
          color: '#1e3a5f',
          padding: '16px 48px',
          borderRadius: 12,
          fontSize: 20,
          fontWeight: 600,
        }}
      >
        시작하기
      </div>
    </AbsoluteFill>
  )
}
