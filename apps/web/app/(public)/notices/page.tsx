import type { Metadata } from "next"
import { getNoticesByCategory } from "@/actions/notice-actions"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { NoticeListWithCrud } from "@/components/features/notices/NoticeListWithCrud"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gwatc.cloud"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "ê³µì??¬í•­",
  description: "ê°•ì›?¹ë³„?ì¹˜??ë³´ì¡°ê¸°ê¸°?¼í„°??ê³µì??¬í•­???•ì¸?˜ì‹¤ ???ˆìŠµ?ˆë‹¤.",
  openGraph: {
    title: "ê³µì??¬í•­ | GWATC ë³´ì¡°ê¸°ê¸°?¼í„°",
    description: "ê°•ì›?¹ë³„?ì¹˜??ë³´ì¡°ê¸°ê¸°?¼í„°??ê³µì??¬í•­???•ì¸?˜ì‹¤ ???ˆìŠµ?ˆë‹¤.",
    url: `${baseUrl}/notices`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/notices`,
  },
}

export default async function NoticesPage() {
  const [notices, isStaff] = await Promise.all([
    getNoticesByCategory("notice", 50),
    hasAdminOrStaffPermission(),
  ])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb items={[{ label: "ê³µì??¬í•­", href: "/notices" }]} className="mb-6" />
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">ê³µì??¬í•­</h1>
        <p className="text-muted-foreground">?¼í„°??ì£¼ìš” ê³µì??¬í•­???•ì¸?˜ì‹¤ ???ˆìŠµ?ˆë‹¤</p>
      </div>
      <NoticeListWithCrud notices={notices} isStaff={isStaff} emptyMessage="?±ë¡??ê³µì??¬í•­???†ìŠµ?ˆë‹¤" />
    </div>
  )
}
