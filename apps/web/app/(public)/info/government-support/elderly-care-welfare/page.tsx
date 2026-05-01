import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { ChevronLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "2025 노인장기요양보험 복지용구 급여사업",
  description: "노인장기요양보험 대상자에게 일상생활·신체활동 지원에 필요한 보조기기를 구입하거나 대여해 주는 사업입니다.",
}

export default function ElderlyCareWelfarePage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "보조기기 정보", href: "/info" },
          { label: "정부지원사업안내", href: "/info/government-support" },
          { label: "노인장기요양보험 복지용구 급여사업", href: "/info/government-support/elderly-care-welfare" },
        ]}
        className="mb-6"
      />

      <div className="max-w-3xl">
        <h1 className="text-responsive-xl font-bold text-foreground mb-8">
          2025 노인장기요양보험 복지용구 급여사업
        </h1>

        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-gray-700">

          <p>
            심신 기능이 저하되어 일상생활을 영위하는 데 지장이 있는 노인장기요양보험 대상자에게 일상생활, 신체활동 지원 및 인지기능 유지·기능 향상에 필요한 보조기기로써 보건복지부장관이 정하여 고시하는 것을 구입하거나 대여해 주는 사업
          </p>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 지원대상</h2>
            <ul className="space-y-1.5 pl-2">
              <li>- 장기요양인정서에 재가급여 또는 가족요양비 지급대상자로 표시된 경우</li>
              <li>- 장기요양 1~5등급, 인지지원등급을 받은 65세 이상 노인 및 노인성 질병을 가진 65세 미만 국민</li>
              <li className="font-bold text-red-600">※ 노인요양시설 입소자는 복지용구 급여 대상이 아님.</li>
              <li className="font-bold text-red-600">※ 의료기관에 15일 이상 입원한 경우 입원기간 동안 전동침대, 수동침대, 이동욕조, 목욕리프트 대여 불가</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 신청문의</h2>
            <p className="pl-2">국민건강보험공단 <strong>1577-1000</strong></p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 신청기간</h2>
            <p className="pl-2">- 상시</p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 지원내용</h2>
            <ul className="space-y-2 pl-2">
              <li><strong>- 급여비용 연한도액: <span className="text-red-600">160만 원</span></strong></li>
              <li><strong>- 급여비용 부담률: 일반대상자 15%, 경감대상자 6% 또는 9%, 기초생활수급자 0%</strong></li>
              <li>- 복지용구 급여비용(본인부담금+공단부담금)은 구입과 대여를 합산한 금액으로 <strong className="text-red-600">연한도액 초과 시 전액 본인 부담</strong></li>
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-red-500 mb-3">▶ 복지용구 이용 전 반드시 알아야 하는 사항</h2>
            <ul className="space-y-2 pl-2 text-xs sm:text-sm">
              <li>- 내구연한이 정해진 품목은 재료의 재질·형태·기능 및 종류를 불문하고 <strong>내구연한 내에서 품목당 1개의 제품만 구입·대여 가능</strong> (단, 성인용보행기는 2개, 경사로(실내용)는 6개까지 사용 가능 횟수 내에서 구입할 수 있음)</li>
              <li>- 내구연한 중 <strong>훼손·마모되거나, 수급자의 기능상태 변화로 사용할 수 없을 경우</strong> 『복지용구 추가급여신청서』를 건강보험공단에 제출하고 공단이 이를 확인한 경우에는 내구연한 이내라도 급여를 다시 받을 수 있음</li>
              <li>- <strong>전동침대와 수동침대는 동일 품목으로 1개의 제품만 이용 가능</strong></li>
              <li>- <strong>구입 또는 대여 품목인 욕창예방매트리스의 경우 수급자는 구입 및 대여를 동시에 할 수 없음.</strong></li>
              <li>
                - 사용 가능 횟수가 정해지지 않은 품목 중 미끄럼방지용품, 자세변환용구, 안전손잡이, 간이변기, 요실금 팬티는 수급자의 <strong>연한도액 적용구간에 [구입가능 개수]를 초과하여 구입할 수 없음.</strong>
                <p className="mt-1 text-gray-500">※ 미끄럼방지용품(매트) 5개 / 미끄럼방지용품(양말) 6개 / 자세변환용구 5개 / 안전손잡이 10개 / 간이변기 2개 / 요실금팬티 4개 초과 시 구입 X</p>
              </li>
              <li>- <strong>수급자가 복지용구와 동일한 품목을 타 법령에 의해 지급받은 경우 급여가 제한</strong>될 수 있음.</li>
              <li>- 복지용구 대여가격은 월 단위로 산정함 (월이라 함은 매월 1일부터 말일까지)</li>
              <li>- 수급자가 복지용구를 대여하는 기간 도중에 사망한 경우에는 <strong>사망일 다음날로부터 최대 7일까지 산정할 수 있음</strong></li>
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
