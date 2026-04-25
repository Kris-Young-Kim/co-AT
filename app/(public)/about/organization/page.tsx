import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { Phone } from "lucide-react"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "조직도",
  description: "강원특별자치도 보조기기센터의 조직 구조와 부서별 역할을 확인하세요.",
  openGraph: {
    title: "조직도 | GWATC 보조기기센터",
    description: "강원특별자치도 보조기기센터의 조직 구조와 부서별 역할을 확인하세요.",
    url: `${baseUrl}/about/organization`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/about/organization`,
  },
}

const centerDirector = {
  title: "센터장",
  name: "손굉룡",
  duties: ["센터 운영 총괄"],
}

const teamLeader = {
  role: "팀장 (작업치료사)",
  name: "김영기",
  duties: [
    "센터 기획 운영 및 조정에 관한 사항",
    "인사 관리에 관한 사항",
    "주요 업무보고에 관한 사항",
    "보조공학 연구에 관한 사항",
    "재원 확보 및 연계에 관한 사항",
  ],
  phone: "033) 248-7754",
}

const staffMembers = [
  {
    role: "사회복지사",
    name: "이창하",
    color: "teal" as const,
    duties: [
      "(보조기기 상담 및 정보제공) 콜센터 및 체험프로그램 관리",
      "(보조기기센터의 예산·회계 및 행정, 인사 업무) 예산·회계, 인사 등 센터의 행정 전반에 관련된 업무",
      "(주요자산관리) 보조기기 외 주요자산 관리",
      "(운영자문위원회) 위원 위촉, 회의 개최, 회의록 작성 등",
      "그 밖에 보조기기센터 사업에 필요한 업무",
    ],
    phone: "033) 248-7751",
  },
  {
    role: "작업치료사",
    name: "양하나",
    color: "green" as const,
    duties: [
      "(보조기기 맞춤형 지원사업) 보조기기 교부사업 관리 업무",
      "(보조기기센터 홍보) 보조기기 저변 확대를 위한 홍보 업무",
      "(민간자원 연계) 재원 확보 및 연계",
      "(실습생 관리) 실습 일정, 과정, 실습생 평가 등 전반",
      "그 밖에 보조기기센터 사업에 필요한 업무",
    ],
    phone: "033) 248-7752",
  },
  {
    role: "보조공학사",
    name: "송근필",
    color: "green" as const,
    duties: [
      "(보조기기 맞춤형 지원사업) 보조기기 대여 사업 관리 업무",
      "(보조기기 사후관리 사업) 소독 및 세척, 점검 및 수리, 재사용 지원",
      "(보조기기 교육 사업) 교육 홍보, 일정 조율, 강사 관리 등",
      "(통합관리 팀 협력) 운영기관 내 공공부문 팀 대상자 연계 및 협력방안 마련을 위한 정례회의",
      "그 밖에 보조기기센터 사업에 필요한 업무",
    ],
    phone: "033) 248-7753",
  },
  {
    role: "보조공학사",
    name: "노동억",
    color: "green" as const,
    duties: [
      "(보조기기 맞춤형 지원사업) 맞춤제작 사업 관리 업무",
      "(보조기기센터 홍보) 보조기기 저변 확대를 위한 홍보 업무",
      "(주요자산관리) 보조기기 주요자산 관리",
      "(서비스 전달체계구축 사업) 기관 발굴, 업무협약, 대상자 연계 및 협력사업 시행 등",
      "그 밖에 보조기기센터 사업에 필요한 업무",
    ],
    phone: "033) 248-7758",
  },
]

const headerColors = {
  teal: "bg-[#00B2A0]",
  green: "bg-[#4CAF76]",
}

export default function OrganizationPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "센터소개", href: "/about" },
          { label: "조직도", href: "/about/organization" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-10">
        조직도
      </h1>

      <div className="flex flex-col items-center gap-0">
        {/* 센터장 */}
        <div className="w-full max-w-xs">
          <div className="border-2 border-[#4472C4] rounded-sm overflow-hidden">
            <div className="bg-[#4472C4] py-4 text-center relative overflow-hidden">
              <span className="absolute inset-0 opacity-10 flex items-center justify-center text-7xl font-bold text-white select-none pointer-events-none">e</span>
              <p className="text-white text-sm font-medium relative z-10">{centerDirector.title}</p>
              <p className="text-white text-2xl font-bold relative z-10">{centerDirector.name}</p>
            </div>
            <div className="bg-white py-4 px-4">
              {centerDirector.duties.map((duty) => (
                <p key={duty} className="text-sm text-gray-700 before:content-['▪'] before:mr-1 before:text-gray-400">
                  {duty}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* 세로 연결선 */}
        <div className="w-0.5 h-8 bg-gray-300" />

        {/* 팀장 */}
        <div className="w-full max-w-xs">
          <div className="border-2 border-[#4472C4] rounded-sm overflow-hidden">
            <div className="bg-[#4472C4] py-4 text-center relative overflow-hidden">
              <span className="absolute inset-0 opacity-10 flex items-center justify-center text-7xl font-bold text-white select-none pointer-events-none">e</span>
              <p className="text-white text-sm font-medium relative z-10">{teamLeader.role}</p>
              <p className="text-white text-2xl font-bold relative z-10">{teamLeader.name}</p>
            </div>
            <div className="bg-white py-4 px-4 space-y-1">
              {teamLeader.duties.map((duty) => (
                <p key={duty} className="text-sm text-gray-700 before:content-['▪'] before:mr-1 before:text-gray-400">
                  {duty}
                </p>
              ))}
            </div>
            <div className="bg-white border-t border-gray-200 py-3 px-4 flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#4472C4]" />
              <span className="text-[#4472C4] font-semibold text-sm">{teamLeader.phone}</span>
            </div>
          </div>
        </div>

        {/* 세로 + 가로 연결선 */}
        <div className="w-0.5 h-8 bg-gray-300" />

        {/* 가로 연결 바 */}
        <div className="relative w-full max-w-4xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-0 bg-gray-300" />
          <div className="h-0.5 bg-gray-300 w-full" />
          {/* 각 카드 위 세로선 */}
          <div className="flex justify-between">
            {staffMembers.map((_, i) => (
              <div key={i} className="flex-1 flex justify-center">
                <div className="w-0.5 h-8 bg-gray-300" />
              </div>
            ))}
          </div>
        </div>

        {/* 직원 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl">
          {staffMembers.map((staff) => (
            <div
              key={`${staff.role}-${staff.name}-${staff.phone}`}
              className="border-2 rounded-sm overflow-hidden flex flex-col"
              style={{ borderColor: staff.color === "teal" ? "#00B2A0" : "#4CAF76" }}
            >
              <div className={`${headerColors[staff.color]} py-4 text-center relative overflow-hidden`}>
                <span className="absolute inset-0 opacity-10 flex items-center justify-center text-6xl font-bold text-white select-none pointer-events-none">e</span>
                <p className="text-white text-sm font-medium relative z-10">{staff.role}</p>
                {staff.name && (
                  <p className="text-white text-xl font-bold relative z-10">{staff.name}</p>
                )}
              </div>
              <div className="bg-white py-4 px-4 space-y-1 flex-1">
                {staff.duties.map((duty) => (
                  <p key={duty} className="text-xs text-gray-700 before:content-['▪'] before:mr-1 before:text-gray-400 leading-relaxed">
                    {duty}
                  </p>
                ))}
              </div>
              <div
                className="bg-white border-t py-3 px-4 flex items-center gap-2"
                style={{ borderColor: staff.color === "teal" ? "#00B2A0" : "#4CAF76" }}
              >
                <Phone
                  className="h-4 w-4"
                  style={{ color: staff.color === "teal" ? "#00B2A0" : "#4CAF76" }}
                />
                <span
                  className="font-semibold text-sm"
                  style={{ color: staff.color === "teal" ? "#00B2A0" : "#4CAF76" }}
                >
                  {staff.phone}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
