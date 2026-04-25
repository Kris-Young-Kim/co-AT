import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "연혁",
  description: "강원특별자치도 보조기기센터의 역사와 주요 연혁을 확인하세요.",
  openGraph: {
    title: "연혁 | GWATC 보조기기센터",
    description: "강원특별자치도 보조기기센터의 역사와 주요 연혁을 확인하세요.",
    url: `${baseUrl}/about/history`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/about/history`,
  },
}

const historyData = [
  {
    year: "2024",
    events: [
      { date: "05.08", items: ["서울시동남보조기기센터 「코스콤, 장애인 맞춤형 IT 보조기기 지원사업」 업무협약 체결"] },
      { date: "03.11", items: ["서울시동남보조기기센터 「월드비전, 저소득 희귀질환아동 맞춤형 보조기기 지원사업」 업무협약 체결"] },
    ],
  },
  {
    year: "2023",
    events: [
      { date: "11.23", items: ["보조기기 열린플랫폼 공모전 최우수상, 우수상 수상"] },
      { date: "11.10", items: ["보건복지부장관 최우수기관상 수상"] },
      { date: "06.28", items: ["강원대학교 장애학생지원센터 업무협약 체결"] },
      { date: "06.26", items: ["2023년 중증장애인을 위한 IoT 리모컨 도어락 지원사업 수행"] },
    ],
  },
  {
    year: "2022",
    events: [
      { date: "12.23", items: ["강원정보문화산업진흥원 업무협약 체결"] },
      { date: "12.14", items: ["강원도 - 강원도재활병원 재 위·수탁 계약 체결"] },
      { date: "12.06", items: ["[나눔과 꿈] 3D프린터 및 신소재를 활용한 맞춤 보조기기 제작 플랫폼 구축·지원사업 우수 협력 기관 선정"] },
      { date: "05.10", items: ["강릉장애인자립생활센터 업무협약 체결"] },
      { date: "04.20", items: ["강원광역자활센터 업무협약 체결"] },
    ],
  },
  {
    year: "2021",
    events: [
      { date: "11.15", items: ["원주장애인자립생활센터 업무협약 체결"] },
      { date: "09.30", items: ["한국지능정보사회진흥원, 강원도 「정보통신보조기기임대사업」 업무협약 체결"] },
      { date: "09.27", items: ["강원명진학교 업무협약 체결"] },
      { date: "08.20", items: ["원주시장애인종합복지관 업무협약 체결", "보조기기 분야 협력 네트워크 다자간 업무협약 체결"] },
      { date: "05.18", items: ["경기도재활공학서비스연구지원센터 「에쓰오일, 전국 장애 청소년 학습용 맞춤 보조기기 지원사업」 수행 참여"] },
      { date: "04.02", items: ["강원도특수교육지원센터 업무협약 체결"] },
      { date: "03.12", items: ["서울시동남보조기기센터 「코스콤, 장애인 맞춤형 IT 보조기기 지원사업」 업무협약 체결"] },
      { date: "02.26", items: ["서울시동남보조기기센터 「월드비전과 함께하는 저소득 희귀질환아동 맞춤형 보조기기 지원사업」 업무협약 체결"] },
      { date: "02.24", items: ["홍천군장애인복지관 업무협약 체결"] },
    ],
  },
  {
    year: "2020",
    events: [
      { date: "11.04", items: ["강원도장애인종합복지관 업무협약 체결"] },
      { date: "10.16", items: ["고성군보건소, 양구군보건소 업무협약 체결"] },
      { date: "09.21", items: ["「장애 아동·청소년 이동 및 자세유지 보조기기 렌탈사업」을 위해 ㈜에이블디자인스와 업무 협약 체결"] },
      { date: "09.18", items: ["「장애인 지역사회 통합돌봄」선도 사업 수행을 위해 춘천시와 업무 협약 체결"] },
      { date: "09.04", items: ["횡성군 보건소 업무 협약 체결"] },
      { date: "08.25", items: ["[나눔과 꿈] 3D프린터 및 신소재 활용 맞춤 보조기기 제작 플랫폼 구축·지원사업 업무협약 체결"] },
      { date: "08.07", items: ["[나눔과 꿈] 3D프린터 및 신소재 활용 맞춤 보조기기 제작 플랫폼 구축·지원사업 강원 지역 협력 기관 선정"] },
      { date: "06.03", items: ["춘천시 보건소 업무협약 체결"] },
    ],
  },
  {
    year: "2019",
    events: [
      { date: "10.26", items: ["보조기기센터 준공"] },
      { date: "07.25", items: ["강원도 - 강원도재활병원 위·수탁 계약 체결"] },
      { date: "07.10", items: ["강원도보조기기센터 수행기관 선정 결과 공고", "(수행기관 - 강원도재활병원)"] },
      { date: "06.07", items: ["강원도 공모사업 신청"] },
      { date: "05.09", items: ["2019년 강원도보조기기센터 공모"] },
    ],
  },
]

export default function HistoryPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "센터소개", href: "/about" },
          { label: "연혁", href: "/about/history" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-2">연혁</h1>

      {/* 헤더 배너 */}
      <div className="bg-primary rounded-xl px-6 py-8 mb-12 text-primary-foreground">
        <p className="text-lg font-bold tracking-wide opacity-60 mb-1">History</p>
        <p className="text-xl sm:text-2xl font-bold mb-2">강원특별자치도보조기기센터 발자취</p>
        <p className="text-sm opacity-75">당신의 꿈, 가장 가까이에서 응원하겠습니다.</p>
      </div>

      {/* 타임라인 */}
      <div className="relative max-w-3xl">
        {/* 세로선 */}
        <div className="absolute left-16 sm:left-20 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-12">
          {historyData.map((yearGroup) => (
            <div key={yearGroup.year} className="relative">
              {/* 연도 */}
              <div className="flex items-start gap-6 sm:gap-8">
                <div className="relative shrink-0 w-16 sm:w-20 text-right">
                  <span className="text-xl sm:text-2xl font-black text-primary">
                    {yearGroup.year}
                  </span>
                  {/* 연도 점 */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+0.75rem)] sm:translate-x-[calc(100%+1rem)] w-3 h-3 rounded-full bg-primary border-2 border-background ring-2 ring-primary" />
                </div>

                {/* 이벤트 목록 */}
                <div className="flex-1 pl-6 sm:pl-8 space-y-4 pb-2">
                  {yearGroup.events.map((event, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <span className="shrink-0 text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded mt-0.5 tabular-nums">
                        {event.date}
                      </span>
                      <div className="space-y-0.5">
                        {event.items.map((item, j) => (
                          <p key={j} className="text-sm text-foreground leading-relaxed">
                            {item}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
