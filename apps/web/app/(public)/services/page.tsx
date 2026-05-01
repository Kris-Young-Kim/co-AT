import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "주요사업",
  description: "강원특별자치도 보조기기센터의 5대 핵심 사업을 소개합니다. 상담 및 정보제공, 맞춤형 지원, 사후관리, 교육/홍보 서비스를 확인하세요.",
  openGraph: {
    title: "주요사업 | GWATC 보조기기센터",
    description: "강원특별자치도 보조기기센터의 5대 핵심 사업을 소개합니다. 상담 및 정보제공, 맞춤형 지원, 사후관리, 교육/홍보 서비스를 확인하세요.",
    url: `${baseUrl}/services`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/services`,
  },
}

export default function ServicesPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb items={[{ label: "주요사업", href: "/services" }]} className="mb-6" />
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        주요사업
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mt-8">
        <Link
          href="/services/consultation"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">상담 및 정보제공</h2>
          <p className="text-sm text-muted-foreground mb-2">
            상담 및 정보제공 서비스를 제공합니다.
          </p>
          <p className="text-xs text-muted-foreground/70">
            콜센터, 체험
          </p>
        </Link>
        <Link
          href="/services/custom-support"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">맞춤형 지원</h2>
          <p className="text-sm text-muted-foreground mb-2">
            개인에게 맞는 맞춤형 지원 서비스를 제공합니다.
          </p>
          <p className="text-xs text-muted-foreground/70">
            대여, 제작, 교부평가
          </p>
        </Link>
        <Link
          href="/services/aftercare"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">사후관리</h2>
          <p className="text-sm text-muted-foreground mb-2">
            보조기기의 지속적인 사후관리 서비스를 제공합니다.
          </p>
          <p className="text-xs text-muted-foreground/70">
            소독/세척, 점검/수리, 재사용
          </p>
        </Link>
        <Link
          href="/services/education-promotion"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">교육/홍보</h2>
          <p className="text-sm text-muted-foreground mb-2">
            보조기기 활용 교육 및 홍보 활동을 진행합니다.
          </p>
          <p className="text-xs text-muted-foreground/70">
            교육/홍보
          </p>
        </Link>
      </div>
    </div>
  )
}

