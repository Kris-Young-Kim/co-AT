import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { ChevronLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "2025 국가유공자 보철구 지급사업",
  description: "국가유공 상이자에게 보철구를 지급하여 생활 편의를 돕는 사업입니다.",
}

export default function VeteransProstheticsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "보조기기 정보", href: "/info" },
          { label: "정부지원사업안내", href: "/info/government-support" },
          { label: "국가유공자 보철구 지급사업", href: "/info/government-support/veterans-prosthetics" },
        ]}
        className="mb-6"
      />

      <div className="max-w-3xl">
        <h1 className="text-responsive-xl font-bold text-foreground mb-8">
          2025 국가유공자 보철구 지급사업
        </h1>

        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-gray-700">

          <p>
            국가유공 상이자에게 신체기능장애나 활동력이 상실된 부분을 보충·정형 또는 보완해 주는 보철구를 지급하여 생활 편의를 돕는 사업
          </p>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 지원대상</h2>
            <ul className="space-y-1.5 pl-2">
              <li>- 상이를 입은 국가 유공자 (전상군경, 공상군경, 4.19혁명 부상자, 공상공무원, 국가사회발전특별공로상이자, 6.18자유상이자, 전투종사군무원, 국가유공자에 준하는 군경 등)</li>
              <li>- 재해부상군경 및 재해부상공무원, 특수임무부상자, 애국지사, 5.18 민주화운동부상자</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 신청방법</h2>
            <p className="pl-2">- 국가보훈처 <strong>1577-0606</strong> 방문 또는 전화</p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 신청기간</h2>
            <p className="pl-2">- 상시</p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 지원내용</h2>
            <ul className="space-y-2 pl-2">
              <li>- 상이처 해당 보철구는 무상공급</li>
              <li>- 보철구 수명을 고려해 기존 지급자에게는 수명연한 1개월 이전에 안내하며, 신규 희망 시 관할 보훈청에서 안내 및 접수 가능</li>
              <li>- 타 공적급여에서 지급 받을 수 있는 용품 및 보철구와 중복 지급 시에 지원되지 않음</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#0075c8] mb-3">▶ 참고자료</h2>
            <a
              href="https://pocenter.bohun.or.kr/020guide/guide01_02.php?left=1"
              target="_blank"
              rel="noopener noreferrer"
              className="pl-2 text-sm text-blue-600 underline break-all"
            >
              pocenter.bohun.or.kr — 중앙보훈병원 보장구센터
            </a>
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
