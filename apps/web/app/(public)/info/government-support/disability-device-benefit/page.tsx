import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { ChevronLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "2025 장애인 보조기기 급여제도",
  description: "등록 장애인이 의사 처방에 따라 보조기기 구입 시 구입금액 일부를 국민건강보험공단에서 보험급여비로 지급하는 제도입니다.",
}

export default function DisabilityDeviceBenefitPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "보조기기 정보", href: "/info" },
          { label: "정부지원사업안내", href: "/info/government-support" },
          { label: "장애인 보조기기 급여제도", href: "/info/government-support/disability-device-benefit" },
        ]}
        className="mb-6"
      />

      <div className="max-w-3xl">
        <h1 className="text-responsive-xl font-bold text-foreground mb-8">
          2025 장애인 보조기기 급여제도
        </h1>

        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-gray-700">

          <div className="space-y-2">
            <p>
              장애인복지법에 따라 등록된 장애인인 가입자 및 피부양자가 의사 처방에 따라 보조기기를 구입할 경우, 구입금액 일부를 국민건강보험공단에서 보험급여비로 지급하는 제도
            </p>
            <p>
              즉, 장애인 의료비 부담을 줄이기 위해 보조기기 구입에 대한 일부 비용을 지원하는 사업
            </p>
            <p className="text-xs sm:text-sm text-red-600">
              ※ 보조기기 급여를 받을 수 있는 사람이 타법령에 따라 보조기기에 상당하는 급여를 받을 수 있는 경우(국가유공자, 산업재해대상자, 장기요양수급자 등), 장애인보조기기 보험급여가 제한됩니다.
            </p>
          </div>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 지원대상</h2>
            <ul className="space-y-1 pl-2">
              <li>- 등록장애인 중 건강보험 가입자 또는 피부양자, 차상위자</li>
              <li className="text-xs sm:text-sm text-gray-500">※ 동일보조기기는 내구연한 내 1인당 1회 지급</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 신청기관</h2>
            <p className="pl-2">- 차상위, 건강보험가입자: 국민건강보험공단 신청 <strong>(1577-1000)</strong></p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 지원내용</h2>
            <ul className="space-y-2 pl-2">
              <li>- 의지 및 보조기, 휠체어, 보청기 등 9개 분류 90개 품목</li>
              <li>- 공단 등록 업소 보조기기 구입: 전동휠체어, 의료용 스쿠터, 전동보조기기 전지, 자세보조용구, 보청기, 의지 보조기, 맞춤형 교정용 신발, 욕창예방방석, 욕창예방매트리스, 이동식전동리프트, 전방보행차, 후방보행차, 수동휠체어, 의안</li>
              <li>
                <strong>▷ 수급권·차상위:</strong>{" "}
                품목별 기준액 및 구입금액 범위 내{" "}
                <span className="bg-yellow-100 px-1">전액 지원</span>
              </li>
              <li>
                <strong>▷ 건강보험가입자:</strong>{" "}
                품목별 기준액 및 구입금액 범위 내{" "}
                <span className="bg-yellow-100 px-1">90% 지원</span>
              </li>
              <li className="text-xs sm:text-sm text-gray-500">
                ※ 단, 전동휠체어, 의료용 스쿠터, 자세보조용구는 고시금액 까지 포함하여 범위 내 90% 지원 or 100% 지원
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 신청기간</h2>
            <p className="pl-2">- 상시</p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 지원절차</h2>
            <div className="overflow-x-auto">
              <div className="flex flex-wrap items-center gap-1 text-xs sm:text-sm">
                {[
                  "장애인보장구 처방(병원)",
                  "사전급여신청(국민건강보험공단)",
                  "급여결정 통보(공단)",
                  "보장구 구입",
                  "보장구 검수확인",
                  "구입비용지급 청구",
                  "구입비용 지급",
                  "사후점검",
                ].map((step, i, arr) => (
                  <span key={step} className="flex items-center gap-1">
                    <span className="bg-blue-50 border border-blue-200 rounded px-2 py-1 whitespace-nowrap">{step}</span>
                    {i < arr.length - 1 && <span className="text-gray-400">→</span>}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 신청문의</h2>
            <div className="pl-2 space-y-1">
              <p>국민건강보험공단 <strong>1577-1000</strong></p>
              <a
                href="https://www.nhis.or.kr/nhis/policy/wbhada10900m02.do"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline text-sm break-all"
              >
                www.nhis.or.kr — 국민건강보험공단 홈페이지
              </a>
            </div>
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
