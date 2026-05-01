import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { LocationMapClient } from "@/components/features/location/LocationMapClient"
import { Train, Bus, Car, MapPin } from "lucide-react"

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

const directions = [
  {
    icon: Train,
    label: "경춘선",
    color: "bg-blue-500",
    steps: [
      "경춘선 춘천역 하차",
      "춘천역환승센터 정류장까지 81m 걷기",
      "마을 신북2(대체: 북산1), 지선11 승차",
      "강원특별자치도 재활병원 정류장 하차",
      "재활병원까지 약 440m 걷기 → 도착",
    ],
    note: "* 춘천역에서 택시 이용 시 약 10분 소요",
  },
  {
    icon: Bus,
    label: "시외버스",
    color: "bg-green-600",
    steps: [
      "【방법 1】 춘천시외버스터미널 → 춘천우체국 정류장까지 약 400m 걷기 → 지선11 승차 → 강원특별자치도 재활병원 정류장 하차 → 재활병원까지 약 440m 걷기 → 도착 (환승없이 약 56분 소요)",
      "【방법 2】 춘천시외버스터미널 → 길 건너 시외버스터미널 정류장 146m 걷기 → 지선 3·5·7 승차 → 춘천중학교 정류장 하차 → 지선13 승차 → 강원특별자치도 재활병원 하차 → 재활병원까지 약 440m 걷기 → 도착 (한 번 환승, 약 49분 소요)",
    ],
    note: "* 춘천시외버스터미널 또는 춘천고속버스터미널에서 택시 이용 시 약 20분 소요",
  },
  {
    icon: Car,
    label: "자가용",
    color: "bg-orange-500",
    steps: [
      "서울·홍천방면 → 공지천 → 소양1교·소양2교 → 소양댐 방면으로 1~1.5km 직진 → 도착",
    ],
    note: "* 서울에서 약 1시간 소요",
  },
]

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
      <h1 className="text-responsive-xl font-bold text-foreground mb-8">찾아오시는 길</h1>

      <div className="space-y-8 max-w-4xl">
        {/* 지도 */}
        <LocationMapClient />

        {/* 주소 */}
        <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl px-5 py-4">
          <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground text-sm sm:text-base">
              강원도 춘천시 충열로 142번길 24-16 (우두동 291-2)
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">강원특별자치도 재활병원 2층</p>
          </div>
          <a
            href="https://map.naver.com/v5/directions/-/127.741245,37.903616,%EA%B0%95%EC%9B%90%ED%8A%B9%EB%B3%84%EC%9E%90%EC%B9%98%EB%8F%84%EB%B3%B4%EC%A1%B0%EA%B8%B0%EA%B8%B0%EC%84%BC%ED%84%B0,,/walk"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto shrink-0 text-xs font-medium text-primary border border-primary/30 rounded-md px-3 py-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            길찾기
          </a>
        </div>

        {/* 교통편 안내 */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground">교통편 안내</h2>
          <div className="space-y-4">
            {directions.map((dir) => {
              const Icon = dir.icon
              return (
                <div key={dir.label} className="border rounded-xl overflow-hidden">
                  {/* 헤더 */}
                  <div className={`flex items-center gap-2.5 px-5 py-3 ${dir.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                    <span className="text-white font-semibold text-sm">{dir.label} 이용시</span>
                  </div>
                  {/* 내용 */}
                  <div className="bg-white px-5 py-4 space-y-2">
                    {dir.steps.map((step, i) => (
                      <p key={i} className="text-sm text-gray-700 leading-relaxed">
                        {step}
                      </p>
                    ))}
                    {dir.note && (
                      <p className="text-xs text-muted-foreground pt-1 border-t mt-2">
                        {dir.note}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
