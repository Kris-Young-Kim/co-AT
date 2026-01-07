import type { Metadata } from "next"
import { getNoticesByCategory } from "@/actions/notice-actions"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { NoticeList } from "@/components/features/notices/NoticeList"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "활동갤러리",
  description: "강원특별자치도 보조기기센터의 다양한 활동 소식을 확인하세요. 교육, 홍보, 서비스 제공 활동을 만나보세요.",
  openGraph: {
    title: "활동갤러리 | GWATC 보조기기센터",
    description: "강원특별자치도 보조기기센터의 다양한 활동 소식을 확인하세요. 교육, 홍보, 서비스 제공 활동을 만나보세요.",
    url: `${baseUrl}/community/gallery`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/community/gallery`,
  },
}

export default async function GalleryPage() {
  // 활동 소식만 조회
  const notices = await getNoticesByCategory("activity", 50)
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "커뮤니티", href: "/community" },
          { label: "활동갤러리", href: "/community/gallery" },
        ]}
        className="mb-6"
      />
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          활동갤러리
        </h1>
        <p className="text-muted-foreground">
          센터의 다양한 활동 소식을 확인하실 수 있습니다
        </p>
      </div>

      <NoticeList notices={notices} emptyMessage="등록된 활동 소식이 없습니다" />
    </div>
  )
}

