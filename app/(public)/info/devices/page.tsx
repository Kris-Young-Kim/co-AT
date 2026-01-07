import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "보유 보조기기",
  description: "강원특별자치도 보조기기센터에서 보유하고 있는 다양한 보조기기 목록을 확인하세요.",
  openGraph: {
    title: "보유 보조기기 | GWATC 보조기기센터",
    description: "강원특별자치도 보조기기센터에서 보유하고 있는 다양한 보조기기 목록을 확인하세요.",
    url: `${baseUrl}/info/devices`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/info/devices`,
  },
}

export default function DevicesPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "보조기기 정보", href: "/info" },
          { label: "보유 보조기기", href: "/info/devices" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        보유 보조기기
      </h1>
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
        <p className="text-muted-foreground">
          보유 보조기기 페이지입니다.
        </p>
      </div>
    </div>
  )
}

