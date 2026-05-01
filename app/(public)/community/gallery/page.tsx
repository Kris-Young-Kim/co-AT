import type { Metadata } from "next"
import { getNoticesByCategory } from "@/actions/notice-actions"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { NoticeListWithCrud } from "@/components/features/notices/NoticeListWithCrud"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gwatc.cloud"

export const revalidate = 300

export const metadata: Metadata = {
  title: "?œë™ê°¤ëŸ¬ë¦?,
  description: "ê°•ì›?¹ë³„?ì¹˜??ë³´ì¡°ê¸°ê¸°?¼í„°???¤ì–‘???œë™ ?Œì‹???•ì¸?˜ì„¸?? êµìœ¡, ?ë³´, ?œë¹„???œê³µ ?œë™??ë§Œë‚˜ë³´ì„¸??",
  openGraph: {
    title: "?œë™ê°¤ëŸ¬ë¦?| GWATC ë³´ì¡°ê¸°ê¸°?¼í„°",
    description: "ê°•ì›?¹ë³„?ì¹˜??ë³´ì¡°ê¸°ê¸°?¼í„°???¤ì–‘???œë™ ?Œì‹???•ì¸?˜ì„¸?? êµìœ¡, ?ë³´, ?œë¹„???œê³µ ?œë™??ë§Œë‚˜ë³´ì„¸??",
    url: `${baseUrl}/community/gallery`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/community/gallery`,
  },
}

export default async function GalleryPage() {
  const [notices, isStaff] = await Promise.all([
    getNoticesByCategory("activity", 50),
    hasAdminOrStaffPermission(),
  ])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "ì»¤ë??ˆí‹°", href: "/community" },
          { label: "?œë™ê°¤ëŸ¬ë¦?, href: "/community/gallery" },
        ]}
        className="mb-6"
      />
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">?œë™ê°¤ëŸ¬ë¦?/h1>
        <p className="text-muted-foreground">?¼í„°???¤ì–‘???œë™ ?Œì‹???•ì¸?˜ì‹¤ ???ˆìŠµ?ˆë‹¤</p>
      </div>
      <NoticeListWithCrud notices={notices} isStaff={isStaff} emptyMessage="?±ë¡???œë™ ?Œì‹???†ìŠµ?ˆë‹¤" />
    </div>
  )
}
