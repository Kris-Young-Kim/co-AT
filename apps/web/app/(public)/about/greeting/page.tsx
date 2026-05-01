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

const pledges = [
  {
    number: "첫째",
    title: "전문적인 보조기기 서비스를 제공하겠습니다.",
    content:
      "강원특별자치도 보조기기센터 직원들은 적합한 서비스를 제공하기 위하여 역량강화를 위한 끊임없는 자기개발과 연구를 통하여 객관적이고 근거기반의 보조기기서비스를 제공하도록 최선을 다하겠습니다.",
  },
  {
    number: "둘째",
    title: "이용자 중심의 서비스를 제공하겠습니다.",
    content:
      "서비스 전 과정에 이용자의 참여를 독려하고 이용자의 욕구를 최우선에 두어 보조기기 서비스가 진행함으로 궁극적으로 이용자의 만족도를 높이기 위해 최선을 다하겠습니다.",
  },
  {
    number: "셋째",
    title: "강원특별자치도민 누구나 쉽고 편안하게 서비스를 제공 받을 수 있도록 노력하겠습니다.",
    content:
      "접근성 향상을 위한 지속적인 방안 마련과 지역 내 보조기기 관련 자원을 발굴하고 연계함으로 one-stop 서비스가 제공될 수 있도록 역할을 강화해 나가겠습니다.",
  },
  {
    number: "넷째",
    title: "보조기기 사용 사각 지대를 해소해 나가겠습니다.",
    content:
      "지속적인 홍보와 교육 및 적극적인 대상자 발굴을 통하여 강원특별자치도 내 장애인 노인 등을 위한 보조기기 사용 사각지대 ZERO를 만들어 가겠습니다.",
  },
]

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
      <h1 className="text-responsive-xl font-bold text-foreground mb-10">인사말</h1>

      <div className="max-w-3xl space-y-10">
        {/* 인트로 */}
        <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg px-6 py-6">
          <p className="text-base sm:text-lg font-semibold text-foreground leading-relaxed">
            안녕하십니까?<br />
            <span className="text-primary">강원특별자치도 보조기기센터</span> 입니다.
          </p>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            강원특별자치도 보조기기센터는 지역 보조기기서비스의 중추이자 전달체계 허브로서
            도내 장애인의 사회복귀와 삶의 질 향상에 중심적인 역할을 수행하겠습니다.
          </p>
        </div>

        {/* 다짐 목록 */}
        <div className="space-y-6">
          {pledges.map((pledge) => (
            <div key={pledge.number} className="flex gap-4">
              <div className="shrink-0 w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold text-center leading-tight">
                  {pledge.number}
                </span>
              </div>
              <div className="pt-1">
                <h2 className="text-sm sm:text-base font-bold text-foreground mb-1.5">
                  {pledge.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {pledge.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 서명 */}
        <div className="pt-4 border-t text-right">
          <p className="text-base font-bold text-foreground">
            강원특별자치도 보조기기센터 직원 일동
          </p>
        </div>
      </div>
    </div>
  )
}
