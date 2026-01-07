import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "조직도",
  description: "강원특별자치도 보조기기센터의 조직 구조와 부서별 역할을 확인하세요.",
  openGraph: {
    title: "조직도 | GWATC 보조기기센터",
    description: "강원특별자치도 보조기기센터의 조직 구조와 부서별 역할을 확인하세요.",
    url: `${baseUrl}/about/organization`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/about/organization`,
  },
}

export default function OrganizationPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "센터소개", href: "/about" },
          { label: "조직도", href: "/about/organization" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        조직도
      </h1>
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
        <p className="text-muted-foreground">
          조직도 페이지입니다.
        </p>
      </div>
    </div>
  )
}

