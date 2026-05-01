import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gwatc.cloud"

export const metadata: Metadata = {
  title: "교육/?�보",
  description: "보조기기 ?�용 교육 �??�보 ?�동??진행?�니?? 보조기기 ?�용�?교육�??�보 캠페???�보�??�인?�세??",
  openGraph: {
    title: "교육/?�보 | GWATC 보조기기?�터",
    description: "보조기기 ?�용 교육 �??�보 ?�동??진행?�니?? 보조기기 ?�용�?교육�??�보 캠페???�보�??�인?�세??",
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
          { label: "주요?�업", href: "/services" },
          { label: "교육/?�보", href: "/services/education-promotion" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        교육/?�보
      </h1>
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
        <div className="mt-8">
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-3">교육/?�보</h2>
            <p className="text-sm text-muted-foreground">
              보조기기 ?�용 교육 �??�보 ?�동??진행?�니??
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

