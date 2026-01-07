import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "재사용 보조기기",
  description: "재사용 가능한 보조기기 목록을 확인하세요. 환경을 생각하는 재사용 보조기기 서비스를 제공합니다.",
  openGraph: {
    title: "재사용 보조기기 | GWATC 보조기기센터",
    description: "재사용 가능한 보조기기 목록을 확인하세요. 환경을 생각하는 재사용 보조기기 서비스를 제공합니다.",
    url: `${baseUrl}/info/reusable-devices`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/info/reusable-devices`,
  },
}

export default function ReusableDevicesPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "보조기기 정보", href: "/info" },
          { label: "재사용 보조기기", href: "/info/reusable-devices" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        재사용 보조기기
      </h1>
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
        <p className="text-muted-foreground">
          재사용 보조기기 페이지입니다.
        </p>
      </div>
    </div>
  )
}

