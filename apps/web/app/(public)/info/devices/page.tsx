import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { PublicDeviceList } from "@/components/features/inventory/PublicDeviceList"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "보유 보조기기",
  description: "강원특별자치도 보조기기센터에서 보유하고 있는 다양한 보조기기 목록을 확인하세요. 실시간으로 대여 가능 여부와 상태를 확인할 수 있습니다.",
  openGraph: {
    title: "보유 보조기기 | GWATC 보조기기센터",
    description: "강원특별자치도 보조기기센터에서 보유하고 있는 다양한 보조기기 목록을 확인하세요. 실시간으로 대여 가능 여부와 상태를 확인할 수 있습니다.",
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
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          보유 보조기기
        </h1>
        <p className="text-muted-foreground">
          센터에서 보유하고 있는 보조기기 목록입니다. 상태별로 필터링하여 대여 가능한 기기를 확인할 수 있습니다.
        </p>
      </div>
      <PublicDeviceList />
    </div>
  )
}

