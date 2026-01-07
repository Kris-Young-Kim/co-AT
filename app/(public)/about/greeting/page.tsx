import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "인사말",
  description: "강원특별자치도 보조기기센터장의 인사말을 확인하세요. 센터의 비전과 목표를 소개합니다.",
  openGraph: {
    title: "인사말 | GWATC 보조기기센터",
    description: "강원특별자치도 보조기기센터장의 인사말을 확인하세요. 센터의 비전과 목표를 소개합니다.",
    url: `${baseUrl}/about/greeting`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/about/greeting`,
  },
}

export default function GreetingPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "센터소개", href: "/about" },
          { label: "인사말", href: "/about/greeting" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        인사말
      </h1>
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
        <p className="text-muted-foreground">
          인사말 페이지입니다.
        </p>
      </div>
    </div>
  )
}

