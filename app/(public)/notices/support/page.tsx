import type { Metadata } from "next"
import { getNoticesByCategory } from "@/actions/notice-actions"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { NoticeList } from "@/components/features/notices/NoticeList"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "지원사업",
  description: "강원특별자치도 보조기기센터의 지원사업 정보를 확인하실 수 있습니다.",
  openGraph: {
    title: "지원사업 | GWATC 보조기기센터",
    description: "강원특별자치도 보조기기센터의 지원사업 정보를 확인하실 수 있습니다.",
    url: `${baseUrl}/notices/support`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/notices/support`,
  },
}

export default async function SupportPage() {
  // 지원사업만 조회
  const notices = await getNoticesByCategory("support", 50)
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "공지사항", href: "/notices" },
          { label: "지원사업", href: "/notices/support" },
        ]}
        className="mb-6"
      />
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          지원사업
        </h1>
        <p className="text-muted-foreground">
          센터의 지원사업 정보를 확인하실 수 있습니다
        </p>
      </div>

      <NoticeList notices={notices} emptyMessage="등록된 지원사업이 없습니다" />
    </div>
  )
}
