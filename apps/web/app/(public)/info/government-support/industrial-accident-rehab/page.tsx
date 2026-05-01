import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { ChevronLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "2025 산재보험요양급여 재활보조기기 지원",
  description: "근로자가 업무상 사유에 의하여 부상을 당하거나 질병이 발생한 경우 재활에 필요한 보조기구 비용을 지원하는 사업입니다.",
}

export default function IndustrialAccidentRehabPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "보조기기 정보", href: "/info" },
          { label: "정부지원사업안내", href: "/info/government-support" },
          { label: "산재보험요양급여 재활보조기기 지원", href: "/info/government-support/industrial-accident-rehab" },
        ]}
        className="mb-6"
      />

      <div className="max-w-3xl">
        <h1 className="text-responsive-xl font-bold text-foreground mb-8">
          2025 산재보험요양급여 재활보조기기 지원
        </h1>

        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-gray-700">

          {/* 소개 */}
          <p>
            근로자가 업무상 사유에 의하여 부상을 당하거나 질병이 발생한 경우 재활에 필요한 보조기구 비용을 지원하는 사업
          </p>

          {/* 지원대상 */}
          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 지원대상</h2>
            <p className="pl-2">
              - 산업재해 장애인: 산재보험 가입 근로자 중 「산업재해보상보험 요양급여 산정기준」에 따른 재활보조기구 유형 및 용도별 지급 대상에 해당하는 자
            </p>
          </section>

          {/* 선정기준 */}
          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 선정기준</h2>
            <p className="pl-2">
              - 재활보조기구 지급 대상에 해당하는 산재근로자로 재활보조기구 각 품목별 지급 대상 요건을 충족한 경우
            </p>
          </section>

          {/* 신청기간 */}
          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 신청기간</h2>
            <p className="pl-2">- 상시</p>
          </section>

          {/* 지원내용 */}
          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 지원내용</h2>
            <ul className="space-y-2 pl-2">
              <li>- 의지·보조기 : 102품목 (건강보험 급여 79품목, 산재보험 별도 23품목)</li>
              <li>- 수리료 : 126품목 (건강보험 급여 12품목, 산재보험 별도 급여 114품목)</li>
              <li className="mt-2">
                - 재활보조기구는 요양이 끝났을 때 비용을 지급하지만, 다음의 경우에 치료 중에도 지급 가능
                <ul className="mt-1.5 space-y-1 pl-3 text-xs sm:text-sm text-gray-600">
                  <li>· 사지절단환자 또는 신경마비 등으로 인하여 치료가 끝난 후에도 계속해서 재활보조기구의 장착이 의학적으로 필요한 경우</li>
                  <li>· 경추, 흉추, 요추 등의 척추손상 또는 척추질환의 치료를 위해서 보조기기 착용이 의학적으로 필요한 경우</li>
                  <li>· 관절 손상 등으로 인해 관절운동의 제한 또는 관절의 고정을 위해서 보조기기 착용이 의학적으로 필요한 경우</li>
                  <li>· 하지골절로 인해 통원치료 시 목발이 의학적으로 필요한 경우</li>
                </ul>
              </li>
            </ul>
          </section>

          {/* 신청방법 */}
          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 신청방법</h2>
            <div className="space-y-4 pl-2">
              <div>
                <p className="font-bold text-red-600 mb-1">- 처음으로 재활보조기기를 구입하는 경우</p>
                <p>
                  산재보험 의료기관에서 해당 전문의가 재활보조기기를 처방·검수하여 산재근로자에게 직접 제공하고 의료기관에서 공단으로 진료비를 청구
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  ※ 의료기관(치료 중인 경우에는 현재 요양중인 의료기관)에서 처방을 받고 불가피하게 시중업체에서 재활보조기기를 구입한 경우에는 근로복지공단에 요양비로 청구
                </p>
              </div>
              <div>
                <p className="font-bold text-red-600 mb-1">- 내구연한이 경과하여 추가로 재활보조기기를 지급받는 경우</p>
                <p>
                  재활보조기기의 계속적인 장착이 필요한 경우에는 공단에 두는 의료기관(연구기관)에서 추가 지급
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  ※ 공단에 두는 의료기관(연구기관)에서 추가 지급하는 것이 곤란하여 거주지 관내 시중업체에서 구입한 경우에는 근로복지공단에 요양비로 청구
                </p>
              </div>
            </div>
          </section>

          {/* 신청문의 */}
          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 신청문의</h2>
            <p className="pl-2">- 근로복지공단 <strong>1588-0075</strong></p>
          </section>

          {/* 참고자료 */}
          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-2">▶ 참고자료</h2>
            <a
              href="http://www.bokjibank.or.kr/bokji/view.php?zipEncode=ZCZm90wDU91DLLMDMetpSfMvWLME"
              target="_blank"
              rel="noopener noreferrer"
              className="pl-2 text-sm text-blue-600 underline break-all"
            >
              www.bokjibank.or.kr
            </a>
          </section>

        </div>

        {/* 목록가기 */}
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
