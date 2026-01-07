import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "서비스 이용 안내",
  description: "강원특별자치도 보조기기센터 서비스 이용 방법과 신청 절차를 안내합니다. 온라인 신청 방법을 확인하세요.",
  openGraph: {
    title: "서비스 이용 안내 | GWATC 보조기기센터",
    description: "강원특별자치도 보조기기센터 서비스 이용 방법과 신청 절차를 안내합니다. 온라인 신청 방법을 확인하세요.",
    url: `${baseUrl}/apply/guide`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/apply/guide`,
  },
}

export default function ApplyGuidePage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "서비스 신청", href: "/apply" },
          { label: "서비스 이용 안내", href: "/apply/guide" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        서비스 이용 안내
      </h1>
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
        <p className="text-muted-foreground">
          서비스 이용 안내 페이지입니다.
        </p>
      </div>
    </div>
  )
}

