import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "찾아오시는 길",
  description: "강원특별자치도 보조기기센터 위치와 오시는 길을 안내합니다. 대중교통 및 자가용 이용 방법을 확인하세요.",
  openGraph: {
    title: "찾아오시는 길 | GWATC 보조기기센터",
    description: "강원특별자치도 보조기기센터 위치와 오시는 길을 안내합니다. 대중교통 및 자가용 이용 방법을 확인하세요.",
    url: `${baseUrl}/about/location`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/about/location`,
  },
}

export default function LocationPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "센터소개", href: "/about" },
          { label: "찾아오시는 길", href: "/about/location" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        찾아오시는 길
      </h1>
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
        <p className="text-muted-foreground">
          찾아오시는 길 페이지입니다.
        </p>
      </div>
    </div>
  )
}

