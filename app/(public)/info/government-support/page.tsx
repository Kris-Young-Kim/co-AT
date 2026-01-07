import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "정부지원사업안내",
  description: "보조기기 관련 정부 지원사업 정보를 확인하세요. 각종 지원사업의 신청 방법과 자격 요건을 안내합니다.",
  openGraph: {
    title: "정부지원사업안내 | GWATC 보조기기센터",
    description: "보조기기 관련 정부 지원사업 정보를 확인하세요. 각종 지원사업의 신청 방법과 자격 요건을 안내합니다.",
    url: `${baseUrl}/info/government-support`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/info/government-support`,
  },
}

export default function GovernmentSupportPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "보조기기 정보", href: "/info" },
          { label: "정부지원사업안내", href: "/info/government-support" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        정부지원사업안내
      </h1>
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
        <p className="text-muted-foreground">
          정부지원사업안내 페이지입니다.
        </p>
      </div>
    </div>
  )
}

