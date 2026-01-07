import type { Metadata } from "next"
import { getNoticesByCategory } from "@/actions/notice-actions"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { NoticeList } from "@/components/features/notices/NoticeList"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "보조기기 서비스 사례",
  description: "실제 보조기기 서비스 사례를 확인하세요. 다양한 상황에서의 보조기기 활용 사례를 공유합니다.",
  openGraph: {
    title: "보조기기 서비스 사례 | GWATC 보조기기센터",
    description: "실제 보조기기 서비스 사례를 확인하세요. 다양한 상황에서의 보조기기 활용 사례를 공유합니다.",
    url: `${baseUrl}/community/cases`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/community/cases`,
  },
}

export default async function CasesPage() {
  // 서비스 사례만 조회
  const notices = await getNoticesByCategory("case", 50)
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "커뮤니티", href: "/community" },
          { label: "보조기기 서비스 사례", href: "/community/cases" },
        ]}
        className="mb-6"
      />
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          보조기기 서비스 사례
        </h1>
        <p className="text-muted-foreground">
          실제 보조기기 서비스 사례를 확인하실 수 있습니다
        </p>
      </div>

      <NoticeList notices={notices} emptyMessage="등록된 서비스 사례가 없습니다" />
    </div>
  )
}

