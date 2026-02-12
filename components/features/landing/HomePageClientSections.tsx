"use client"

import dynamic from "next/dynamic"
import type { Notice } from "@/actions/notice-actions"
import type { PublicSchedule } from "@/actions/schedule-actions"
import type { YouTubeVideo } from "@/actions/youtube-actions"

const HomeCommunityNews = dynamic(
  () => import("@/components/features/landing/HomeCommunityNews").then((mod) => ({ default: mod.HomeCommunityNews })),
  {
    loading: () => (
      <div className="min-h-[200px] flex items-center justify-center text-muted-foreground text-sm">
        공지사항 로딩 중...
      </div>
    ),
    ssr: false,
  }
)

const HomeGallerySlider = dynamic(
  () => import("@/components/features/landing/HomeGallerySlider").then((mod) => ({ default: mod.HomeGallerySlider })),
  {
    loading: () => <div className="py-12 text-center text-muted-foreground">영상 갤러리 로딩 중...</div>,
    ssr: false,
  }
)

const HomeCalendarCompact = dynamic(
  () =>
    import("@/components/features/landing/HomeCalendarCompact").then((mod) => ({
      default: mod.HomeCalendarCompact,
    })),
  {
    loading: () => <div className="py-12 text-center text-muted-foreground">캘린더 로딩 중...</div>,
    ssr: false,
  }
)

interface HomePageClientSectionsProps {
  notices: Notice[]
  supportNotices: Notice[]
  schedules: PublicSchedule[]
  videos: YouTubeVideo[]
}

export function HomePageClientSections({
  notices,
  supportNotices,
  schedules,
  videos,
}: HomePageClientSectionsProps) {
  return (
    <>
      <section className="py-8 sm:py-12 bg-background" aria-label="공지사항 및 일정 정보">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="lg:max-w-md">
              <HomeCommunityNews initialNotices={notices} initialSupportNotices={supportNotices} />
            </div>
            <div className="lg:flex-1">
              <HomeCalendarCompact initialSchedules={schedules} />
            </div>
          </div>
        </div>
      </section>
      {videos.length > 0 && <HomeGallerySlider videos={videos} />}
    </>
  )
}
