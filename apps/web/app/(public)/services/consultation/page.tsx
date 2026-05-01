import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "상담 및 정보제공",
  description: "전화를 통한 보조기기 상담 및 정보 제공 서비스와 다양한 보조기기를 직접 체험해볼 수 있는 체험 서비스를 제공합니다.",
  openGraph: {
    title: "상담 및 정보제공 | GWATC 보조기기센터",
    description: "전화를 통한 보조기기 상담 및 정보 제공 서비스와 다양한 보조기기를 직접 체험해볼 수 있는 체험 서비스를 제공합니다.",
    url: `${baseUrl}/services/consultation`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/services/consultation`,
  },
}

export default function ConsultationPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "주요사업", href: "/services" },
          { label: "상담 및 정보제공", href: "/services/consultation" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        상담 및 정보제공
      </h1>
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
        <div className="grid gap-6 md:grid-cols-2 mt-8">
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-3">콜센터</h2>
            <p className="text-sm text-muted-foreground">
              전화를 통한 보조기기 상담 및 정보 제공 서비스입니다.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-3">체험</h2>
            <p className="text-sm text-muted-foreground">
              다양한 보조기기를 직접 체험해볼 수 있는 서비스입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

