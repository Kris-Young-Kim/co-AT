import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { ChevronLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "2025 장애인보조기기교부사업",
  description: "생활이 어려운 저소득 장애인들에게 보조기기를 지원하는 사업입니다.",
}

export default function DisabilityDeviceGrantPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "보조기기 정보", href: "/info" },
          { label: "정부지원사업안내", href: "/info/government-support" },
          { label: "장애인보조기기교부사업", href: "/info/government-support/disability-device-grant" },
        ]}
        className="mb-6"
      />

      <div className="max-w-3xl">
        <h1 className="text-responsive-xl font-bold text-foreground mb-8">
          2025 장애인보조기기교부사업
        </h1>

        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-gray-700">

          {/* 소개 */}
          <p className="text-base sm:text-lg font-bold text-gray-800">
            생활이 어려운 저소득 장애인들에게 보조기기를 지원하는 사업
          </p>

          {/* 지원대상 */}
          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 지원대상</h2>
            <ul className="space-y-1.5 pl-2">
              <li>
                <span className="font-semibold">- 소득수준 :</span> 기초생활수급자 또는 차상위 계층 장애인
              </li>
              <li>
                - 장애유형 : 지체·뇌병변·시각·청각·심장·호흡·발달·지적·자폐성·언어 장애인
              </li>
            </ul>
          </section>

          {/* 문의 및 신청 */}
          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 문의 및 신청</h2>
            <ul className="space-y-1.5 pl-2">
              <li>
                - 주민등록상 거주지 <strong>읍·면·동 행정복지센터</strong>에 문의 및 신청 가능합니다.
              </li>
              <li>
                - 행정복지센터보다 <strong>시·군청</strong>이 가까운 경우 시·군청에 문의 및 신청 가능합니다.
              </li>
            </ul>
          </section>

          {/* 교부품목 */}
          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 교부품목(44개)</h2>
            <p className="text-xs text-muted-foreground pl-2">
              ※ 출처: 보건복지부 국립재활원 - 장애인보조기기 교부사업 품목 정보 안내서
            </p>
          </section>

          {/* 급여기준 */}
          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 급여기준</h2>
            <ul className="space-y-2 pl-2">
              <li>
                - <strong>연간 지원기준액 합계 <span className="text-red-600">200만원 범위 내</span></strong>에서{" "}
                <strong><span className="text-red-600">1인당 최대 3개 품목 신청</span></strong>이 가능합니다.
                <p className="text-xs sm:text-sm text-gray-500 mt-1 ml-2">
                  * 단, 단일품목으로서 <strong>지원기준액이 <span className="text-red-600">200만원을 초과</span>하는 품목</strong>은{" "}
                  <strong>연간 <span className="text-red-600">1인당 1품목</span>만</strong> 신청 가능합니다.
                </p>
              </li>
              <li>
                - <strong>중복 지원 가능 품목</strong>은 <strong>최대 2개</strong> 또는 <strong>5개까지</strong> 가능합니다.
                <p className="text-xs sm:text-sm text-gray-500 mt-1 ml-2">
                  (장애인용 의복, 휠체어 악세서리, 지지대 및 손잡이, 목욕용 미끄럼방지용품의 경우 각 2개까지 신청 가능 / 음식섭취 보조기기는 각 5개까지 신청 가능)
                </p>
              </li>
              <li>
                - <strong className="text-red-600">신청하신 품목 가격이 지원기준 금액을 초과하면 초과하신 금액만큼 자부담금이 발생합니다.</strong>
              </li>
              <li>
                - 지원받은 적이 있는 <strong>동일 품목</strong>을 다시 신청하려면 품목의{" "}
                <strong>내구연한이 지나야 신청할 수 있습니다.</strong>
              </li>
              <li>
                - <strong>전년도에 교부 받았던 품목과 "다른" 품목은 올해 신청이 가능합니다.</strong>
              </li>
              <li>
                - 교부 시 제품 파손 등으로 시·군청장이 재교부 필요성을 인정하는 경우에는 다시 교부 받을 수 있지만,{" "}
                <strong>본인의 과실로 기기를 분실한 경우는 재교부가 불가능합니다.</strong>
              </li>
              <li>
                - <strong>다른 정부지원사업을 통해 교부 받은 물품이 내구 연한에 이르지 않았다면 동일 품목은 교부가 불가능합니다.</strong>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 ml-2">
                  * 신청 시 시·군청, 읍·면·동 행정복지센터에서 중복여부를 확인합니다.<br />
                  * 다른 정부지원사업이란 국민건강보험급여, 기초의료수급, 요양보험, 산재보험, 고용보험, 국가유공자대상 보장구 교부사업, 정보통신보조기기 보급사업 등 동일 품목에 대한 보조기기 지원사업을 말합니다.
                </p>
              </li>
            </ul>
          </section>

          {/* 교부절차 */}
          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 교부절차</h2>
            <div className="overflow-x-auto">
              <div className="flex items-center gap-1 min-w-max text-xs sm:text-sm">
                {["신청", "대상자 확인", "지원 결정", "보조기기 구매", "교부"].map((step, i, arr) => (
                  <div key={step} className="flex items-center gap-1">
                    <div className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0075c8] text-white font-semibold text-center leading-tight px-1">
                      {step}
                    </div>
                    {i < arr.length - 1 && (
                      <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
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
