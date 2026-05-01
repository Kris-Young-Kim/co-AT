import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "보조기기 수리센터 안내",
  description: "보조기기 수리센터 이용 안내를 확인하세요. 수리 서비스 신청 방법과 절차를 안내합니다.",
  openGraph: {
    title: "보조기기 수리센터 안내 | GWATC 보조기기센터",
    description: "보조기기 수리센터 이용 안내를 확인하세요. 수리 서비스 신청 방법과 절차를 안내합니다.",
    url: `${baseUrl}/info/repair-center`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/info/repair-center`,
  },
}

const repairCenters = [
  {
    region: "춘천",
    type: "직접",
    org: "강원특별자치도 재활병원",
    recipient: "20만원",
    nearPoverty: "20만원",
    general: "10만원",
    note: "",
    contact: "033-248-7756",
  },
  {
    region: "원주",
    type: "위탁",
    org: "지정업체",
    recipient: "20만원",
    nearPoverty: "20만원",
    general: "10만원",
    note: "",
    contact: "읍면동사무소\n(보장구 수리사업)",
  },
  {
    region: "속초",
    type: "직접",
    org: "강원특별자치도 신체장애복지회 속초시지부",
    recipient: "20만원",
    nearPoverty: "20만원",
    general: "자부담",
    note: "",
    contact: "033-636-6901",
  },
  {
    region: "동해",
    type: "직접",
    org: "한국신체장애인복지회 동해시지부",
    recipient: "20만원",
    nearPoverty: "20만원",
    general: "자부담",
    note: "소모품만가능\n모터,배터리 제외",
    contact: "033-532-6688",
  },
  {
    region: "횡성",
    type: "직접",
    org: "횡성군장애인종합복지관",
    recipient: "40만원",
    nearPoverty: "40만원",
    general: "15만원",
    note: "65세 이상 : 10만원",
    contact: "070-4612-9750",
  },
  {
    region: "영월",
    type: "직접",
    org: "사단법인 영월군장애인협회",
    recipient: "20만원",
    nearPoverty: "10만원",
    general: "자부담",
    note: "배터리 제외",
    contact: "033-372-0822",
  },
]

export default function RepairCenterPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "보조기기 정보", href: "/info" },
          { label: "보조기기 수리센터 안내", href: "/info/repair-center" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-8">
        보조기기 수리센터 안내
      </h1>

      <div className="max-w-4xl space-y-8">
        {/* 이용 안내 */}
        <ul className="space-y-4">
          <li className="flex gap-3 text-sm sm:text-base text-gray-600 leading-relaxed">
            <span className="shrink-0 w-1 h-1 rounded-full bg-gray-400 mt-2.5" />
            <div>
              <span className="text-base sm:text-lg font-medium text-gray-800 block mb-0.5">이용대상</span>
              수리센터 소재지에 거주하고 있는 시·군 지역주민(주민등록상 주소)
            </div>
          </li>
          <li className="flex gap-3 text-sm sm:text-base text-gray-600 leading-relaxed">
            <span className="shrink-0 w-1 h-1 rounded-full bg-gray-400 mt-2.5" />
            <div>
              <span className="text-base sm:text-lg font-medium text-gray-800 block mb-0.5">주요사업</span>
              이동 보조기기(전동휠체어, 전동스쿠터 등) 수리<br />
              <span className="text-xs sm:text-sm text-muted-foreground">
                (* 상세한 내용은 가까운 지역에 소재하고 있는 수리센터에 직접 문의하셔서 확인하시기 바랍니다.)
              </span>
            </div>
          </li>
        </ul>

        {/* 테이블 */}
        <div>
          <p className="text-right text-xs text-muted-foreground mb-2">2023년 10월 기준</p>
          <div className="overflow-x-auto rounded-xl border relative">
            {/* 상단 그라디언트 라인 */}
            <div className="h-0.5 w-full bg-gradient-to-r from-[#2765c8] to-[#1cbabb]" />
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th rowSpan={2} className="px-3 py-3 text-center font-medium text-gray-700 border-r text-xs sm:text-sm">지역</th>
                  <th rowSpan={2} className="px-3 py-3 text-center font-medium text-gray-700 border-r text-xs sm:text-sm">운영방식</th>
                  <th rowSpan={2} className="px-3 py-3 text-center font-medium text-gray-700 border-r text-xs sm:text-sm">운영기관</th>
                  <th colSpan={4} className="px-3 py-2 text-center font-medium text-gray-700 border-r text-xs sm:text-sm border-b">지원기준(연간)</th>
                  <th rowSpan={2} className="px-3 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm">연락처</th>
                </tr>
                <tr className="bg-gray-50 border-b">
                  <th className="px-3 py-2 text-center font-medium text-gray-700 border-r text-xs sm:text-sm">수급자</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700 border-r text-xs sm:text-sm">차상위</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700 border-r text-xs sm:text-sm">일반</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700 border-r text-xs sm:text-sm">기타</th>
                </tr>
              </thead>
              <tbody>
                {repairCenters.map((center, i) => (
                  <tr key={center.region} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-3 py-4 text-center border-r text-xs sm:text-sm font-medium">{center.region}</td>
                    <td className="px-3 py-4 text-center border-r text-xs sm:text-sm">{center.type}</td>
                    <td className="px-3 py-4 text-center border-r text-xs sm:text-sm">{center.org}</td>
                    <td className="px-3 py-4 text-center border-r text-xs sm:text-sm">{center.recipient}</td>
                    <td className="px-3 py-4 text-center border-r text-xs sm:text-sm">{center.nearPoverty}</td>
                    <td className="px-3 py-4 text-center border-r text-xs sm:text-sm">{center.general}</td>
                    <td className="px-3 py-4 text-center border-r text-xs sm:text-[11px] leading-snug whitespace-pre-line">{center.note}</td>
                    <td className="px-3 py-4 text-center text-xs sm:text-sm whitespace-pre-line">{center.contact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground sm:hidden">
            ※ 화면을 좌우로 터치하시면 숨겨진 표를 보실 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  )
}
