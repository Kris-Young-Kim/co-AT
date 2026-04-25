import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { FileText } from "lucide-react"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "정부지원사업안내",
  description: "보조기기 관련 정부 지원사업 정보를 확인하세요. 각종 지원사업의 신청 방법과 자격 요건을 안내합니다.",
  openGraph: {
    title: "정부지원사업안내 | GWATC 보조기기센터",
    description: "보조기기 관련 정부 지원사업 정보를 확인하세요. 각종 지원사업의 신청 방법과 자격 요건을 안내합니다.",
    url: `${baseUrl}/info/government-support`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/info/government-support`,
  },
}

const programs = [
  {
    id: 1,
    title: "2025 장애인보조기기교부사업",
    date: "2025-05-09",
    href: "/info/government-support/disability-device-grant",
  },
  {
    id: 2,
    title: "2025 산재보험요양급여 재활보조기기 지원",
    date: "2025-05-26",
    href: "/info/government-support/industrial-accident-rehab",
  },
  {
    id: 3,
    title: "2025 국가유공자 보철구 지급사업",
    date: "2025-05-26",
    href: "/info/government-support/veterans-prosthetics",
  },
  {
    id: 4,
    title: "2025 정보통신보조기기 보급사업",
    date: "2025-05-20",
    href: "/info/government-support/ict-assistive-devices",
  },
  {
    id: 5,
    title: "2025 장애인 보조기기 급여제도",
    date: "2025-05-20",
    href: "/info/government-support/disability-device-benefit",
  },
  {
    id: 6,
    title: "2025 노인장기요양보험 복지용구 급여사업",
    date: "2025-05-20",
    href: "/info/government-support/elderly-care-welfare",
  },
  {
    id: 7,
    title: "2025 장애인보조공학기기 지원사업",
    date: "2025-05-20",
    href: "/info/government-support/assistive-tech-support",
  },
]

export default function GovernmentSupportPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "보조기기 정보", href: "/info" },
          { label: "정부지원사업안내", href: "/info/government-support" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-8">
        정부지원사업안내
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {programs.map((program) => {
          const card = (
            <div className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white h-full">
              {/* 이미지 영역 */}
              <div
                className="bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center"
                style={{ height: "160px" }}
              >
                <FileText className="h-12 w-12 text-blue-300" />
              </div>
              {/* 정보 */}
              <div className="p-3">
                <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 mb-1.5">
                  {program.title}
                </p>
                <p className="text-xs text-muted-foreground">{program.date}</p>
              </div>
            </div>
          )

          if (program.href) {
            return (
              <Link key={program.id} href={program.href}>
                {card}
              </Link>
            )
          }
          return <div key={program.id}>{card}</div>
        })}
      </div>
    </div>
  )
}
