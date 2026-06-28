export const dynamic = 'force-dynamic'

import type { Metadata } from "next"
import { getNoticesByCategory } from "@/actions/notice-actions"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { NoticeListWithCrud } from "@/components/features/notices/NoticeListWithCrud"
import Link from "next/link"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "공지사항",
  description: "강원특별자치도 보조기기센터의 공지사항을 확인하실 수 있습니다.",
  openGraph: {
    title: "공지사항 | GWATC AX PLATFORM",
    description: "강원특별자치도 보조기기센터의 공지사항을 확인하실 수 있습니다.",
    url: `${baseUrl}/notices`,
    type: "website",
  },
  alternates: { canonical: `${baseUrl}/notices` },
}

const CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "notice", label: "공지사항" },
  { value: "activity", label: "활동 소식" },
  { value: "support", label: "지원사업" },
  { value: "case", label: "서비스 사례" },
] as const

type CategoryValue = typeof CATEGORIES[number]["value"]

interface NoticesPageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function NoticesPage({ searchParams }: NoticesPageProps) {
  const params = await searchParams
  const category = (params.category ?? "all") as CategoryValue

  const [noticeItems, activityItems, supportItems, caseItems, isStaff] = await Promise.all([
    getNoticesByCategory("notice", 50),
    getNoticesByCategory("activity", 50),
    getNoticesByCategory("support", 50),
    getNoticesByCategory("case", 50),
    hasAdminOrStaffPermission(),
  ])

  const allNotices = [...noticeItems, ...activityItems, ...supportItems, ...caseItems]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const displayedNotices =
    category === "all" ? allNotices :
    category === "notice" ? noticeItems :
    category === "activity" ? activityItems :
    category === "support" ? supportItems :
    category === "case" ? caseItems :
    allNotices

  const emptyMessages: Record<CategoryValue, string> = {
    all: "등록된 게시글이 없습니다",
    notice: "등록된 공지사항이 없습니다",
    activity: "등록된 활동 소식이 없습니다",
    support: "등록된 지원사업 안내가 없습니다",
    case: "등록된 서비스 사례가 없습니다",
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb items={[{ label: "공지사항", href: "/notices" }]} className="mb-6" />
      <div className="mb-6">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">공지사항</h1>
        <p className="text-muted-foreground">센터의 공지사항과 활동 소식을 확인하실 수 있습니다</p>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-1.5 flex-wrap mb-6 border-b pb-4">
        {CATEGORIES.map(cat => (
          <Link
            key={cat.value}
            href={cat.value === "all" ? "/notices" : `/notices?category=${cat.value}`}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === cat.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {cat.label}
            {cat.value !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({cat.value === "notice" ? noticeItems.length :
                  cat.value === "activity" ? activityItems.length :
                  cat.value === "support" ? supportItems.length :
                  caseItems.length})
              </span>
            )}
          </Link>
        ))}
      </div>

      <NoticeListWithCrud
        notices={displayedNotices}
        isStaff={isStaff}
        emptyMessage={emptyMessages[category]}
        showSearch
      />
    </div>
  )
}
