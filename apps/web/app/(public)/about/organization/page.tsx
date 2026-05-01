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

const DIRECTOR_COLOR = "#1A237E"   // 딥 인디고 — 센터장
const LEADER_COLOR   = "#0277BD"   // 사파이어 블루 — 팀장

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
  phone: "033) 248-7752",
}

const staffMembers = [
  {
    role: "보조공학사",
    name: "송근필",
    color: "#2E7D32",   // 포레스트 그린
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
    role: "사회복지사",
    name: "이창하",
    color: "#00838F",   // 시안 티얼
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
    color: "#6A1B9A",   // 딥 퍼플
    duties: [
      "(보조기기 맞춤형 지원사업) 보조기기 교부사업 관리 업무",
      "(보조기기센터 홍보) 보조기기 저변 확대를 위한 홍보 업무",
      "(민간자원 연계) 재원 확보 및 연계",
      "(실습생 관리) 실습 일정, 과정, 실습생 평가 등 전반",
      "그 밖에 보조기기센터 사업에 필요한 업무",
    ],
    phone: "033) 248-7754",
  },
  {
    role: "보조공학사",
    name: "노동억",
    color: "#BF360C",   // 번트 오렌지
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
      <h1 className="text-responsive-xl font-bold text-foreground mb-10">조직도</h1>

      <div className="flex flex-col items-center gap-0">
        {/* 센터장 */}
        <div className="w-full max-w-xs">
          <div className="rounded overflow-hidden shadow-md" style={{ border: `2px solid ${DIRECTOR_COLOR}` }}>
            <div className="py-5 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${DIRECTOR_COLOR} 0%, #283593 100%)` }}>
              <span className="absolute inset-0 opacity-10 flex items-center justify-center text-8xl font-black text-white select-none pointer-events-none">G</span>
              <p className="text-blue-200 text-xs font-semibold tracking-widest uppercase relative z-10 mb-0.5">{centerDirector.title}</p>
              <p className="text-white text-2xl font-bold relative z-10">{centerDirector.name}</p>
            </div>
            <div className="bg-white py-4 px-5">
              {centerDirector.duties.map((duty) => (
                <p key={duty} className="text-sm text-gray-700 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: DIRECTOR_COLOR }} />
                  {duty}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* 연결선 */}
        <div className="w-px h-8 bg-gray-300" />

        {/* 팀장 */}
        <div className="w-full max-w-xs">
          <div className="rounded overflow-hidden shadow-md" style={{ border: `2px solid ${LEADER_COLOR}` }}>
            <div className="py-5 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${LEADER_COLOR} 0%, #01579B 100%)` }}>
              <span className="absolute inset-0 opacity-10 flex items-center justify-center text-8xl font-black text-white select-none pointer-events-none">G</span>
              <p className="text-blue-200 text-xs font-semibold tracking-widest uppercase relative z-10 mb-0.5">{teamLeader.role}</p>
              <p className="text-white text-2xl font-bold relative z-10">{teamLeader.name}</p>
            </div>
            <div className="bg-white py-4 px-5 space-y-1.5">
              {teamLeader.duties.map((duty) => (
                <p key={duty} className="text-sm text-gray-700 flex items-start gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: LEADER_COLOR }} />
                  {duty}
                </p>
              ))}
            </div>
            <div className="bg-gray-50 border-t py-2.5 px-5 flex items-center gap-2" style={{ borderColor: `${LEADER_COLOR}40` }}>
              <Phone className="h-3.5 w-3.5 flex-shrink-0" style={{ color: LEADER_COLOR }} />
              <span className="font-bold text-sm" style={{ color: LEADER_COLOR }}>{teamLeader.phone}</span>
            </div>
          </div>
        </div>

        {/* 세로 → 가로 연결선 */}
        <div className="w-px h-8 bg-gray-300" />

        <div className="relative w-full max-w-4xl">
          <div className="h-px bg-gray-300 w-full" />
          <div className="flex justify-between">
            {staffMembers.map((_, i) => (
              <div key={i} className="flex-1 flex justify-center">
                <div className="w-px h-8 bg-gray-300" />
              </div>
            ))}
          </div>
        </div>

        {/* 직원 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl">
          {staffMembers.map((staff) => (
            <div
              key={`${staff.name}-${staff.phone}`}
              className="rounded overflow-hidden shadow-md flex flex-col"
              style={{ border: `2px solid ${staff.color}` }}
            >
              {/* 헤더 */}
              <div
                className="py-4 text-center relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${staff.color}E6 0%, ${staff.color} 100%)` }}
              >
                <span className="absolute inset-0 opacity-10 flex items-center justify-center text-7xl font-black text-white select-none pointer-events-none">G</span>
                <p className="text-white/80 text-xs font-semibold tracking-wider relative z-10 mb-0.5">{staff.role}</p>
                <p className="text-white text-xl font-bold relative z-10">{staff.name}</p>
              </div>

              {/* 업무 목록 */}
              <div className="bg-white py-4 px-4 space-y-2 flex-1">
                {staff.duties.map((duty) => (
                  <p key={duty} className="text-xs text-gray-700 flex items-start gap-1.5 leading-relaxed">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
                      style={{ background: staff.color }}
                    />
                    {duty}
                  </p>
                ))}
              </div>

              {/* 전화번호 */}
              <div
                className="bg-gray-50 border-t py-2.5 px-4 flex items-center gap-2"
                style={{ borderColor: `${staff.color}40` }}
              >
                <Phone className="h-3.5 w-3.5 flex-shrink-0" style={{ color: staff.color }} />
                <span className="font-bold text-sm" style={{ color: staff.color }}>{staff.phone}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
