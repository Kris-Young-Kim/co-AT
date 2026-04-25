import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { ChevronLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "2025 정보통신보조기기 보급사업",
  description: "신체적·경제적으로 정보통신 접근이 어려운 장애인에게 정보통신 보조기기를 저렴한 가격으로 보급하는 사업입니다.",
}

export default function IctAssistiveDevicesPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "보조기기 정보", href: "/info" },
          { label: "정부지원사업안내", href: "/info/government-support" },
          { label: "정보통신보조기기 보급사업", href: "/info/government-support/ict-assistive-devices" },
        ]}
        className="mb-6"
      />

      <div className="max-w-3xl">
        <h1 className="text-responsive-xl font-bold text-foreground mb-8">
          2025 정보통신보조기기 보급사업
        </h1>

        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-gray-700">

          <p>
            신체적·경제적으로 정보통신에 대한 접근과 활용이 어려운 장애인을 대상으로 정보화를 통한 사회통합을 유도하고 정보격차를 해소하기 위해 정보통신 보조기기를 저렴한 가격으로 보급하는 사업
          </p>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 신청기간</h2>
            <p className="pl-2">
              - <strong className="text-red-600">2025년 5월 7일(수) ~ 6월 23일(월)</strong>
              <br />
              <span className="text-xs text-gray-500">※ 우편으로 신청한 경우 접수 마감일까지 도착분에 한함</span>
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 신청방법</h2>
            <ul className="space-y-1.5 pl-2">
              <li>
                - 신청서 등 구비서류를 홈페이지(
                <a href="http://www.at4u.or.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">www.at4u.or.kr</a>
                )에 신청
              </li>
              <li>- 거주지(주민등록지 기준) 관할 접수처(강원특별자치도청 정보화정책과)에 방문·우편(24266) 제출</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 신청서류</h2>
            <div className="space-y-3 pl-2">
              <div>
                <p className="font-semibold text-blue-800 mb-1">신청서류</p>
                <p>신청서(활용계획서, 개인정보 수집·이용 동의서, 행정정보공동이용 신청(동의)서 등 포함) 1부</p>
                <p className="text-xs text-gray-500 mt-1">
                  ※ 강원특별자치도청 홈페이지(state.gwd.go.kr) '도정마당→공고/고시'에서 신청서 서식 내려받기
                </p>
              </div>
              <div>
                <p className="font-semibold text-blue-800 mb-1">첨부서류</p>
                <ul className="space-y-1 text-xs sm:text-sm">
                  <li>① 장애인증명서 1부 또는 국가유공자확인서 1부, 주민등록등본 1부, 국민기초생활수급자 증명서 또는 차상위계층 확인서 각 1부</li>
                  <li>② 신청서의 「사회활동」에 표시한 사항과 관련된 증빙서류</li>
                  <li>③ 법정대리인 동의서 1부(만 19세 미만인 경우), 위임장 1부(대리인 신청 시)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-red-500 mb-3">▶ 신청 시 참고(주의)사항</h2>
            <ul className="space-y-1.5 pl-2 text-xs sm:text-sm">
              <li><strong>신청서 및 활용계획서 작성 시 "정보통신보조기기 자가진단표"를 반드시 확인</strong>하시기 바랍니다.</li>
              <li>- 자가진단 결과 "부적합"인 경우 보급대상이 되지 않으며, 신청서 및 활용계획서에 자가진단 결과를 기재하지 않은 경우에도 보급대상에서 제외될 수 있습니다.</li>
              <li className="mt-2"><strong>정보통신보조기기 보급제외자</strong></li>
              {[
                "본인의 등록 장애유형과 관계없는 장애유형의 보조기기를 신청한 자",
                "내구연한 이내에 동일품목의 보조기기를 사업지원기관 혹은 타 부처, 지자체에서 지원 받은 자",
                "정보통신보조기기 사용을 위한 자가진단 결과가 부적합한 자",
                "정보통신기기 등 다른 보조도구와 이용을 수반하는 보조기기의 경우 구동할 수 있는 요구사양의 정보통신기기 또는 다른 보조도구를 보유하지 않은 자",
                "현재의 장애여건을 고려하여 향후 1년 이상 지속적으로 해당 보조기기의 사용이 어려운 자",
                "보급사업에 1인 2개 이상 신청자 (단, 최초 신청한 1개 제품은 인정)",
                "동일 품목의 보조기기를 중복 신청한 동일가구 내 가구원",
                "신청서의 내용을 허위로 작성하여 제출한 자",
                "타인의 명의를 도용하여 신청한 자",
                "신청에 필요한 필수 제출서류를 제출하지 않은 자",
                "심층상담 대상자가 특별한 사유없이 심층상담에 불응한 자",
                "보급대상자 중 정해진 납부기간 내 개인부담금을 납부하지 않은 자",
                "보급대상자 중 이용약관에 동의하지 않은 자",
                "점자평가 대상자의 경우 점자평가 결과가 60점 미만인 자",
                "기타 보조기기 사용을 위하여 필요한 요건이 갖추어져 있지 않은 자",
              ].map((item, i) => (
                <li key={i}>{i + 1}) {item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 보급품목</h2>
            <ul className="space-y-1 pl-2">
              <li>- 장애유형별 적합한 정보통신보조기기 <strong className="text-red-600">130종</strong></li>
              <li className="text-xs sm:text-sm text-gray-600">· 시각 62, 지체·뇌병변 23, 청각·언어 45</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 신청문의</h2>
            <p className="pl-2 font-semibold">강원특별자치도청 행정국 정보화정책과 <strong>033-249-2151</strong></p>
          </section>

        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/info/government-support"
            className="inline-flex items-center gap-2 px-6 py-2.5 border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            목록가기
          </Link>
        </div>
      </div>
    </div>
  )
}
