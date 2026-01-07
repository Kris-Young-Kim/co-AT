import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "보조기기 수리센터 안내",
  description: "보조기기 수리센터 이용 안내를 확인하세요. 수리 서비스 신청 방법과 절차를 안내합니다.",
  openGraph: {
    title: "보조기기 수리센터 안내 | GWATC 보조기기센터",
    description: "보조기기 수리센터 이용 안내를 확인하세요. 수리 서비스 신청 방법과 절차를 안내합니다.",
    url: `${baseUrl}/info/repair-center`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/info/repair-center`,
  },
}

export default function RepairCenterPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "보조기기 정보", href: "/info" },
          { label: "보조기기 수리센터 안내", href: "/info/repair-center" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        보조기기 수리센터 안내
      </h1>
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
        <p className="text-muted-foreground">
          보조기기 수리센터 안내 페이지입니다.
        </p>
      </div>
    </div>
  )
}

