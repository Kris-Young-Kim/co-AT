import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "나에게 맞는 보조기기",
  description: "개인에게 맞는 보조기기를 추천받으세요. 전문가 상담을 통해 최적의 보조기기를 찾을 수 있습니다.",
  openGraph: {
    title: "나에게 맞는 보조기기 | GWATC 보조기기센터",
    description: "개인에게 맞는 보조기기를 추천받으세요. 전문가 상담을 통해 최적의 보조기기를 찾을 수 있습니다.",
    url: `${baseUrl}/info/recommendation`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/info/recommendation`,
  },
}

export default function RecommendationPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "보조기기 정보", href: "/info" },
          { label: "나에게 맞는 보조기기", href: "/info/recommendation" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        나에게 맞는 보조기기
      </h1>
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
        <p className="text-muted-foreground">
          나에게 맞는 보조기기 페이지입니다.
        </p>
      </div>
    </div>
  )
}

