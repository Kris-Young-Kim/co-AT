import { HomeHeroSection } from "@/components/features/landing/HomeHeroSection"
import { HomeQuickMenuGrid } from "@/components/features/landing/HomeQuickMenuGrid"
import { HomeCommunityNews } from "@/components/features/landing/HomeCommunityNews"
import { getRecentNotices, getNoticesByCategory } from "@/actions/notice-actions"
import { getPublicSchedules } from "@/actions/schedule-actions"
import { getPublicYouTubeVideos } from "@/actions/youtube-actions"
import dynamic from "next/dynamic"

// 코드 스플리팅: 큰 컴포넌트는 동적 임포트로 지연 로딩
const HomeGallerySlider = dynamic(
  () => import("@/components/features/landing/HomeGallerySlider").then((mod) => ({ default: mod.HomeGallerySlider })),
  {
    loading: () => <div className="py-12 text-center text-muted-foreground">영상 갤러리 로딩 중...</div>,
    ssr: true,
  }
)

const HomeCalendarCompact = dynamic(
  () => import("@/components/features/landing/HomeCalendarCompact").then((mod) => ({ default: mod.HomeCalendarCompact })),
  {
    loading: () => <div className="py-12 text-center text-muted-foreground">캘린더 로딩 중...</div>,
    ssr: true,
  }
)

export default async function Home() {
  // Server Component에서 데이터 페칭
  const now = new Date()
  const [notices, supportNotices, schedules, videos] = await Promise.all([
    getRecentNotices(5),
    getNoticesByCategory("support", 5),
    getPublicSchedules(now.getFullYear(), now.getMonth() + 1),
    getPublicYouTubeVideos(10),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <HomeHeroSection featuredVideo={videos[0] || null} />
      
      {/* 5대 핵심 사업 바로가기 */}
      <HomeQuickMenuGrid />

      {/* 공지사항 및 활동 소식 */}
      <section className="py-8 sm:py-12 bg-background" aria-label="공지사항 및 일정 정보">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 좌측: 공지사항, 활동 소식, 서비스 사례 */}
            <div className="lg:max-w-md">
              <HomeCommunityNews
                initialNotices={notices}
                initialSupportNotices={supportNotices}
              />
            </div>
            {/* 우측: 캘린더 */}
            <div className="lg:flex-1">
              <HomeCalendarCompact initialSchedules={schedules} />
            </div>
          </div>
        </div>
      </section>

      {/* 유튜브 영상 갤러리 */}
      {videos.length > 0 && <HomeGallerySlider videos={videos} />}
    </div>
  )
}
