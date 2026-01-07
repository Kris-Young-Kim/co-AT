import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "활동갤러리",
  description: "강원특별자치도 보조기기센터의 다양한 활동 사진을 확인하세요. 교육, 홍보, 서비스 제공 활동을 갤러리로 만나보세요.",
  openGraph: {
    title: "활동갤러리 | GWATC 보조기기센터",
    description: "강원특별자치도 보조기기센터의 다양한 활동 사진을 확인하세요. 교육, 홍보, 서비스 제공 활동을 갤러리로 만나보세요.",
    url: `${baseUrl}/community/gallery`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/community/gallery`,
  },
}

export default function GalleryPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "커뮤니티", href: "/community" },
          { label: "활동갤러리", href: "/community/gallery" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        활동갤러리
      </h1>
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
        <p className="text-muted-foreground">
          활동갤러리 페이지입니다.
        </p>
      </div>
    </div>
  )
}

