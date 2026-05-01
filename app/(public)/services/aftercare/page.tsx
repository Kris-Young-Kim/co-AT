import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "사후관리",
  description: "보조기기의 지속적인 사후관리 서비스를 제공합니다. 소독/세척, 점검/수리, 재사용 서비스를 확인하세요.",
  openGraph: {
    title: "사후관리 | GWATC 보조기기센터",
    description: "보조기기의 지속적인 사후관리 서비스를 제공합니다. 소독/세척, 점검/수리, 재사용 서비스를 확인하세요.",
    url: `${baseUrl}/services/aftercare`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/services/aftercare`,
  },
}

export default function AftercarePage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "주요사업", href: "/services" },
          { label: "사후관리", href: "/services/aftercare" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        사후관리
      </h1>
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
        <div className="grid gap-6 md:grid-cols-3 mt-8">
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-3">소독/세척</h2>
            <p className="text-sm text-muted-foreground">
              보조기기의 위생 관리를 위한 소독 및 세척 서비스입니다.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-3">점검/수리</h2>
            <p className="text-sm text-muted-foreground">
              보조기기의 정기 점검 및 수리 서비스를 제공합니다.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-3">재사용</h2>
            <p className="text-sm text-muted-foreground">
              사용하지 않는 보조기기를 재사용할 수 있도록 지원합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

