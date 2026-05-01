import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "보조기기 서비스",
  description: "서비스 대상자에게 맞는 적합한 보조기기를 확보하고 보조기기 사용 효율성을 높이기 위해 상담에서 사후관리까지 one-stop으로 진행하는 보조기기 종합 서비스입니다.",
  openGraph: {
    title: "보조기기 서비스 | GWATC 보조기기센터",
    description: "서비스 대상자에게 맞는 적합한 보조기기를 확보하고 보조기기 사용 효율성을 높이기 위해 상담에서 사후관리까지 one-stop으로 진행하는 보조기기 종합 서비스입니다.",
    url: `${baseUrl}/services/device-service`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/services/device-service`,
  },
}

const steps = [
  {
    step: "Step 1",
    title: "의뢰 및 접수",
    items: ["홈페이지 온라인 신청", "콜센터", "이메일/팩스", "직접방문"],
    color: "bg-blue-500",
  },
  {
    step: "Step 2",
    title: "상담 및 평가",
    items: ["정보수집", "주요 욕구 파악", "기능적, 신체적, 환경적 평가"],
    color: "bg-blue-600",
  },
  {
    step: "Step 3",
    title: "적용 및 훈련",
    items: ["시험적용", "단기대여", "보조기기 정보제공", "교육 및 훈련", "개조 / 제작"],
    color: "bg-blue-700",
  },
  {
    step: "Step 4",
    title: "재원 확보",
    items: ["공적급여", "민간자원"],
    color: "bg-blue-800",
  },
  {
    step: "Step 5",
    title: "사후 관리",
    items: ["보조기기 사용현황 조사", "만족도 조사"],
    color: "bg-blue-900",
  },
]

const serviceAreas = [
  {
    img: "/images/service-img-2.png",
    label: "시청각",
    desc: "시청각 장애인 및 노인의 사회활동과 정보 접근 지원, 위기 상황에 대처 할 수 있도록 돕는 보조기기",
  },
  {
    img: "/images/service-img-3.png",
    label: "자세유지",
    desc: "일정한 자세를 유지시켜 바른 자세를 취할 수 있도록 돕는 보조기기",
  },
  {
    img: "/images/service-img-4.png",
    label: "이동",
    desc: "지역사회의 접근성 향상 및 다양한 활동을 할 수 있도록 이동권을 확보해 주는 보조기기",
  },
  {
    img: "/images/service-img-5.png",
    label: "일상생활",
    desc: "식사, 착탈의, 목욕 등 기본적 일상생활 동작 수행을 가능하게 돕는 보조기기",
  },
  {
    img: "/images/service-img-6.png",
    label: "차량개조",
    desc: "장애의 유형과 대상자의 특성에 맞게 차량을 개조하여 탑승과 운전을 지원하는 보조기기",
  },
  {
    img: "/images/service-img-7.png",
    label: "학습/정보",
    desc: "학습 및 전자 정보 접근을 향상시킴으로써 장애인 및 노인의 적극적인 사회참여를 돕는 보조기기",
  },
  {
    img: "/images/service-img-8.png",
    label: "의사소통",
    desc: "독립적인 의사 전달과 표현의 어려움이 있는 장애인 및 노인의 의사소통을 돕는 보조기기",
  },
  {
    img: "/images/service-img-9.png",
    label: "여가/스포츠",
    desc: "여가 활동 및 레저와 스포츠 활동 등에 제약이 있는 장애인 및 노인의 활동을 돕는 보조기기",
  },
  {
    img: "/images/service-img-10.png",
    label: "주거환경",
    desc: "물리적 장벽의 최소화 및 주택의 동선 확보 등 접근성의 향상과 생활의 편리함을 제공하는 보조기기",
  },
]

export default function DeviceServicePage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "주요사업", href: "/services" },
          { label: "보조기기 서비스", href: "/services/device-service" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-2">
        보조기기 서비스
      </h1>

      {/* ONE-STOP Service */}
      <section className="mt-8 mb-12">
        <div className="mb-2 text-sm font-semibold text-primary uppercase tracking-widest">
          ONE-STOP Service
        </div>
        <p className="text-muted-foreground mb-8 text-sm sm:text-base">
          서비스 대상자에게 맞는 적합한 보조기기를 확보하고 보조기기 사용 효율성을 높이기 위해
          상담에서 사후관리까지 one-stop으로 진행하는 보조기기 종합 서비스입니다.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {steps.map((s, i) => (
            <div
              key={i}
              className="relative rounded-lg border bg-card p-5 flex flex-col gap-2"
            >
              <div className={`inline-flex w-fit px-2 py-0.5 rounded text-xs font-bold text-white ${s.color} mb-1`}>
                {s.step}
              </div>
              <h2 className="text-base font-semibold text-foreground">{s.title}</h2>
              <ul className="mt-1 space-y-1">
                {s.items.map((item, j) => (
                  <li key={j} className="text-sm text-muted-foreground flex items-start gap-1">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                    {item}
                  </li>
                ))}
              </ul>
              {i < steps.length - 1 && (
                <span className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg z-10">
                  ▶
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 보조기기 서비스 영역 */}
      <section>
        <h2 className="text-lg font-bold text-foreground mb-6 border-b pb-2">
          보조기기 서비스 영역
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviceAreas.map((area, i) => (
            <div key={i} className="flex gap-4 rounded-lg border bg-card p-4 items-start">
              <div className="shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted">
                <img
                  src={area.img}
                  alt={area.label}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-primary mb-1">{area.label}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{area.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
