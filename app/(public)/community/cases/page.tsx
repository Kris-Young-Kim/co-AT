import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

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

export default function CasesPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "커뮤니티", href: "/community" },
          { label: "보조기기 서비스 사례", href: "/community/cases" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        보조기기 서비스 사례
      </h1>
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
        <p className="text-muted-foreground">
          보조기기 서비스 사례 페이지입니다.
        </p>
      </div>
    </div>
  )
}

