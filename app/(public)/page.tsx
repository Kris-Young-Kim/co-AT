import type { Metadata } from "next"
import { HomeHeroSection } from "@/components/features/landing/HomeHeroSection"
import { HomeQuickMenuGrid } from "@/components/features/landing/HomeQuickMenuGrid"
import { HomePageClientSections } from "@/components/features/landing/HomePageClientSections"
import { getRecentNotices, getNoticesByCategory } from "@/actions/notice-actions"
import { getPublicSchedules } from "@/actions/schedule-actions"
import { getPublicYouTubeVideos } from "@/actions/youtube-actions"

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

      {/* 공지사항, 캘린더, 갤러리 (Client Component에서 ssr: false) */}
      <HomePageClientSections
        notices={notices}
        supportNotices={supportNotices}
        schedules={schedules}
        videos={videos}
      />
    </div>
    </>
  )
}
