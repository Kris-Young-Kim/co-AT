import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "맞춤형 지원",
  description: "개인에게 맞는 맞춤형 보조기기 지원 서비스를 제공합니다. 대여, 제작, 교부평가 서비스를 확인하세요.",
  openGraph: {
    title: "맞춤형 지원 | GWATC 보조기기센터",
    description: "개인에게 맞는 맞춤형 보조기기 지원 서비스를 제공합니다. 대여, 제작, 교부평가 서비스를 확인하세요.",
    url: `${baseUrl}/services/custom-support`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/services/custom-support`,
  },
}

export default function CustomSupportPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "주요사업", href: "/services" },
          { label: "맞춤형 지원", href: "/services/custom-support" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        맞춤형 지원
      </h1>
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
        <div className="grid gap-6 md:grid-cols-3 mt-8">
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-3">대여</h2>
            <p className="text-sm text-muted-foreground">
              일시적으로 보조기기를 대여할 수 있는 서비스입니다.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-3">제작</h2>
            <p className="text-sm text-muted-foreground">
              개인에게 맞는 맞춤형 보조기기를 제작해드립니다.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-3">교부평가</h2>
            <p className="text-sm text-muted-foreground">
              보조기기 교부를 위한 평가 서비스를 제공합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

