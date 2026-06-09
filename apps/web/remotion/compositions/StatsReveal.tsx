import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

export const STATS_REVEAL_FPS = 60
export const STATS_REVEAL_DURATION_IN_FRAMES = 120 // 2 seconds

interface StatItem {
  label: string
  value: number
  suffix: string
}

const STATS: StatItem[] = [
  { label: '등록 대상자', value: 1240, suffix: '명' },
  { label: '보조기기 보유', value: 380, suffix: '개' },
  { label: '이번 달 상담', value: 47, suffix: '건' },
  { label: '교부사업 진행', value: 12, suffix: '건' },
]

export const StatsReveal: React.FC = () => {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill
      style={{
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 80,
        fontFamily: 'Pretendard, sans-serif',
      }}
    >
      {STATS.map((stat, i) => {
        const delay = i * 15
        const progress = interpolate(frame, [delay, delay + 60], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
        const displayValue = Math.round(stat.value * progress)
        const opacity = interpolate(frame, [delay, delay + 20], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
        const translateY = interpolate(frame, [delay, delay + 30], [20, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })

        return (
          <div
            key={stat.label}
            style={{
              opacity,
              transform: `translateY(${translateY}px)`,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: '#2563eb',
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              {displayValue.toLocaleString()}
              <span style={{ fontSize: 32 }}>{stat.suffix}</span>
            </div>
            <div
              style={{
                fontSize: 20,
                color: '#64748b',
                fontWeight: 500,
              }}
            >
              {stat.label}
            </div>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}
