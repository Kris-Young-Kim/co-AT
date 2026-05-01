import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "교육/홍보",
  description: "보조기기 활용 교육 및 홍보 활동을 진행합니다. 보조기기 사용법 교육과 홍보 캠페인 정보를 확인하세요.",
  openGraph: {
    title: "교육/홍보 | GWATC 보조기기센터",
    description: "보조기기 활용 교육 및 홍보 활동을 진행합니다. 보조기기 사용법 교육과 홍보 캠페인 정보를 확인하세요.",
    url: `${baseUrl}/services/education-promotion`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/services/education-promotion`,
  },
}

export default function EducationPromotionPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "주요사업", href: "/services" },
          { label: "교육/홍보", href: "/services/education-promotion" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        교육/홍보
      </h1>
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
        <div className="mt-8">
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-3">교육/홍보</h2>
            <p className="text-sm text-muted-foreground">
              보조기기 활용 교육 및 홍보 활동을 진행합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

