import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { ChevronLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "2025 장애인보조공학기기 지원사업",
  description: "장애인의 안정적·지속적인 직업생활에 필요한 각종 보조공학기기를 고용유지조건이나 무상으로 지원하는 제도입니다.",
}

export default function AssistiveTechSupportPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "보조기기 정보", href: "/info" },
          { label: "정부지원사업안내", href: "/info/government-support" },
          { label: "장애인보조공학기기 지원사업", href: "/info/government-support/assistive-tech-support" },
        ]}
        className="mb-6"
      />

      <div className="max-w-3xl">
        <h1 className="text-responsive-xl font-bold text-foreground mb-8">
          2025 장애인보조공학기기 지원사업
        </h1>

        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-gray-700">

          <p>
            장애인의 안정적·지속적인 직업생활에 필요한 각종 보조공학기기를 고용유지조건이나 무상으로 지원하는 제도
          </p>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 지원대상</h2>
            <ul className="space-y-1.5 pl-2">
              <li>- 장애인을 고용한 사업주 또는 고용하려는 사업주 <span className="text-xs text-gray-500">(※ 보조공학기기 사용자를 지정하여 신청)</span></li>
              <li>- 국가 및 지방자치단체의 장 (공무원이 아닌 장애인 근로자 대상)</li>
              <li>- 지원신청 당시 근로자를 고용하고 있지 않거나 4명 이하의 근로자를 고용하고 있는 장애인사업주 (장애인 근로자를 고용하고 있거나 3개월 이내 고용하려는 사업주에 한함)</li>
              <li>- 장애인근로자 (출퇴근을 위한 자동차 개조 및 차량용 보조공학기기 지원에 한함), 장애인 공무원</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 신청기간</h2>
            <p className="pl-2">- 연중 예산 소진 시까지</p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 지원내용</h2>
            <ul className="space-y-2 pl-2">
              <li><strong className="text-red-600">- 장애인 1인당 1,500만 원 (중증 2,000만 원) 한도 지원</strong></li>
              <li>- 고용지원 필요도 결정 결과에 따라 중증 지원 대상 장애인도 포함</li>
              <li className="text-xs sm:text-sm text-[#0075c8] font-semibold">
                ※ 보조공학기기 상담·평가 결과(장애유형, 장애특성, 장애정도, 직무수행 불편사항 등)에 따라 신청내용과 다른 제품이 결정되거나 지원되지 않을 수 있음
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 지원조건</h2>
            <p className="pl-2">
              - 보조공학기기 구입일(맞춤형 보조공학기기는 공단의 구입 결정일)로부터 <strong>2년간 고용 또는 근로관계를 유지</strong>해야 하며, 미이행 할 경우 남아있는 잔액을 반환할 수 있음.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 지원 방식</h2>
            <ul className="space-y-1 pl-2">
              <li>- 맞춤형 보조공학기기 지원</li>
              <li>- 보조공학기기 구입, 대여 비용 지원</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 보조공학기기 지원 안내</h2>
            <a
              href="https://www.kead.or.kr/atintrdbsns/cntntsPage.do?menuId=MENU0629"
              target="_blank"
              rel="noopener noreferrer"
              className="pl-2 text-blue-600 underline text-sm break-all"
            >
              www.kead.or.kr — 한국장애인고용공단
            </a>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 신청문의</h2>
            <ul className="space-y-1 pl-2">
              <li>- 상담전화: 한국장애인고용공단 <strong>1588-1519</strong></li>
              <li>- 접수처: 사업장 소재지 관할 공단 지역본부 및 지사</li>
              <li className="text-xs sm:text-sm text-gray-600">※ 강원지사 033-737-6623</li>
            </ul>
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
