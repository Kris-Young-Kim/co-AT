import type { Metadata } from "next"
import { HomeHeroSection } from "@/components/features/landing/HomeHeroSection"
import { HomeQuickMenuGrid } from "@/components/features/landing/HomeQuickMenuGrid"
import { getRecentNotices, getNoticesByCategory } from "@/actions/notice-actions"
import { getPublicSchedules } from "@/actions/schedule-actions"
import { getPublicYouTubeVideos } from "@/actions/youtube-actions"
import dynamic from "next/dynamic"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "홈",
  description: "강원특별자치도 보조기기센터 홈페이지입니다. 상담, 체험, 맞춤형 지원, 사후관리, 교육홍보 등 5대 핵심 서비스를 확인하고 신청하실 수 있습니다.",
  openGraph: {
    title: "GWATC 보조기기센터 | 강원특별자치도 통합 케어 플랫폼",
    description: "강원특별자치도 보조기기센터에서 제공하는 상담, 체험, 맞춤형 지원, 사후관리, 교육홍보 등 5대 핵심 서비스를 신청하고 관리할 수 있는 통합 플랫폼입니다.",
    url: baseUrl,
    type: "website",
  },
  alternates: {
    canonical: baseUrl,
  },
}

// Hydration 불일치 방지: 클라이언트 전용 렌더 (ssr: false)
const HomeCommunityNews = dynamic(
  () => import("@/components/features/landing/HomeCommunityNews").then((mod) => ({ default: mod.HomeCommunityNews })),
  { loading: () => <div className="min-h-[200px] flex items-center justify-center text-muted-foreground text-sm">공지사항 로딩 중...</div>, ssr: false }
)

const HomeGallerySlider = dynamic(
  () => import("@/components/features/landing/HomeGallerySlider").then((mod) => ({ default: mod.HomeGallerySlider })),
  {
    loading: () => <div className="py-12 text-center text-muted-foreground">영상 갤러리 로딩 중...</div>,
    ssr: false,
  }
)

const HomeCalendarCompact = dynamic(
  () => import("@/components/features/landing/HomeCalendarCompact").then((mod) => ({ default: mod.HomeCalendarCompact })),
  {
    loading: () => <div className="py-12 text-center text-muted-foreground">캘린더 로딩 중...</div>,
    ssr: false,
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

  // 구조화된 데이터 (JSON-LD) - Organization
  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "GWATC 보조기기센터",
    url: baseUrl,
    description: "강원특별자치도 보조기기센터에서 제공하는 상담, 체험, 맞춤형 지원, 사후관리, 교육홍보 등 5대 핵심 서비스",
    address: {
      "@type": "PostalAddress",
      addressCountry: "KR",
      addressRegion: "강원특별자치도",
    },
  }

  return (
    <>
      {/* 구조화된 데이터 (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
      />

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
    </>
  )
}
