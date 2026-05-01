import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { Phone, Mail, Printer, Globe } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "서비스 이용 안내",
  description: "강원특별자치도 보조기기센터 서비스 이용 방법과 신청 절차를 안내합니다.",
  openGraph: {
    title: "서비스 이용 안내 | GWATC 보조기기센터",
    description: "강원특별자치도 보조기기센터 서비스 이용 방법과 신청 절차를 안내합니다.",
    url: `${baseUrl}/apply/guide`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/apply/guide`,
  },
}

const contactCards = [
  {
    icon: Mail,
    title: "이메일 안내",
    value: "gatc2019@naver.com",
    color: "#0277BD",
    href: "mailto:gatc2019@naver.com",
  },
  {
    icon: Printer,
    title: "팩스 안내",
    value: "033) 248-7755",
    color: "#2E7D32",
    href: null,
  },
  {
    icon: Globe,
    title: "온라인 신청",
    value: "www.gatc.or.kr",
    color: "#6A1B9A",
    href: "/apply",
  },
]

const snsLinks = [
  {
    label: "카카오톡",
    href: "http://pf.kakao.com/_hjxmRxb",
    color: "#FAE100",
    textColor: "#3A1D1D",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.8 1.73 5.27 4.36 6.74L5.4 21l4.22-2.2A10.9 10.9 0 0 0 12 19c5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
      </svg>
    ),
  },
  {
    label: "페이스북",
    href: "https://www.facebook.com/GATC2019",
    color: "#1877F2",
    textColor: "#ffffff",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
      </svg>
    ),
  },
]

export default function ApplyGuidePage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "서비스 신청", href: "/apply" },
          { label: "서비스 이용 안내", href: "/apply/guide" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-10">서비스 이용 안내</h1>

      <div className="space-y-8 max-w-4xl">
        {/* 콜센터 배너 */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0277BD] to-[#01579B] text-white px-8 py-8 shadow-lg">
          <div className="absolute right-0 top-0 bottom-0 w-48 opacity-10 flex items-center justify-center text-[10rem] font-black select-none">
            ☎
          </div>
          <p className="text-sm font-semibold opacity-75 mb-1">콜센터 안내</p>
          <div className="flex items-center gap-3 mb-4">
            <Phone className="h-6 w-6" />
            <span className="text-3xl sm:text-4xl font-black tracking-wide">1670-5529</span>
          </div>
          <p className="text-sm sm:text-base leading-relaxed opacity-90">
            <strong>내선번호 13번으로 연락주시면</strong><br />
            상담 신청해 주시면 빠른 시간 안에 원하시는 상담 내용에 대해 상세하게 알려드리겠습니다.
          </p>
        </div>

        {/* 연락처 카드 3종 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {contactCards.map((card) => {
            const Icon = card.icon
            const content = (
              <div
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 text-center hover:shadow-md transition-shadow bg-white h-full"
                style={{ borderColor: card.color }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  <Icon className="h-6 w-6" style={{ color: card.color }} />
                </div>
                <p className="text-sm font-bold text-foreground">{card.title}</p>
                <p className="text-sm font-semibold" style={{ color: card.color }}>
                  {card.value}
                </p>
              </div>
            )

            if (card.href) {
              return card.href.startsWith("mailto") ? (
                <a key={card.title} href={card.href}>{content}</a>
              ) : (
                <Link key={card.title} href={card.href}>{content}</Link>
              )
            }
            return <div key={card.title}>{content}</div>
          })}
        </div>

        {/* SNS 섹션 */}
        <div className="rounded-2xl border bg-muted/30 px-6 py-6">
          <h2 className="text-base font-bold text-foreground mb-1">
            카카오톡 플러스 친구추가 &amp; 페이스북 맺기
          </h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            지금 바로{" "}
            <span className="font-semibold text-foreground">
              강원특별자치도 보조기기센터와 카카오톡 플러스 친구
            </span>
            맺거나{" "}
            <span className="font-semibold text-foreground">페이스북</span>을
            들어가시면 좀 더 다양한 소식을 확인해 보실 수 있습니다.
          </p>

          <div className="flex flex-wrap gap-8">
            {snsLinks.map((sns) => (
              <a
                key={sns.label}
                href={sns.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 group"
              >
                <div className="p-1.5 bg-white border rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                  <QRCodeSVG value={sns.href} size={100} level="M" marginSize={1} />
                </div>
                <span
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ backgroundColor: sns.color, color: sns.textColor }}
                >
                  {sns.icon}
                  {sns.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
