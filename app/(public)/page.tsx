import { HomeHeroSection } from "@/components/features/landing/HomeHeroSection"
import { HomeQuickMenuGrid } from "@/components/features/landing/HomeQuickMenuGrid"
import { HomeNoticeTabs } from "@/components/features/landing/HomeNoticeTabs"
import { HomeGallerySlider } from "@/components/features/landing/HomeGallerySlider"
import { HomePublicCalendar } from "@/components/features/landing/HomePublicCalendar"
import { getRecentNotices, getNoticesByCategory } from "@/actions/notice-actions"
import { getPublicSchedules } from "@/actions/schedule-actions"

export default async function Home() {
  // Server Component에서 데이터 페칭
  const [notices, supportNotices, schedules] = await Promise.all([
    getRecentNotices(5),
    getNoticesByCategory("support", 5),
    getPublicSchedules(),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <HomeHeroSection />
      <HomeQuickMenuGrid />
      <HomeNoticeTabs
        initialNotices={notices}
        initialSupportNotices={supportNotices}
      />
      <HomeGallerySlider />
      <HomePublicCalendar initialSchedules={schedules} />
    </div>
  )
}
