import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "자료실",
  description: "보조기기 관련 자료를 다운로드하세요. 이용 안내서, 신청 양식, 교육 자료 등을 제공합니다.",
  openGraph: {
    title: "자료실 | GWATC 보조기기센터",
    description: "보조기기 관련 자료를 다운로드하세요. 이용 안내서, 신청 양식, 교육 자료 등을 제공합니다.",
    url: `${baseUrl}/info/resources`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/info/resources`,
  },
}

export default function ResourcesPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "보조기기 정보", href: "/info" },
          { label: "자료실", href: "/info/resources" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        자료실
      </h1>
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
        <p className="text-muted-foreground">
          자료실 페이지입니다.
        </p>
      </div>
    </div>
  )
}

