"use client"

import { useState } from "react"
import Link from "next/link"
import { Logo } from "@/components/common/logo"
import { ChevronUp, ChevronDown } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

const familySites = [
  { name: "경기도 보조기기북부센터", href: "http://atrac.or.kr/" },
  { name: "인천광역시 보조기기센터", href: "http://www.icatc.or.kr/" },
  { name: "대전광역시 보조기기센터", href: "https://www.cnuh.co.kr/yeswecan/" },
  { name: "대구광역시 보조기기센터", href: "http://datc.daegu.ac.kr/" },
  { name: "광주광역시 보조기기센터", href: "http://www.gjat.or.kr/" },
  { name: "부산광역시 보조기기센터", href: "http://www.bratc.or.kr/" },
  { name: "충청북도 보조기기센터", href: "http://www.cbat.or.kr/" },
  { name: "전라북도 보조기기센터", href: "http://www.jbat.or.kr" },
  { name: "경상남도 보조기기센터", href: "http://gnatc.or.kr/" },
  { name: "제주특별자치도 보조기기센터", href: "http://www.jejuat.or.kr/" },
  { name: "세종특별자치시 보조기기센터", href: "http://sjatc.or.kr/" },
  { name: "서울시 보조기기센터", href: "http://www.seoulats.or.kr/" },
  { name: "전라남도 보조기기센터", href: "http://www.suncheon.ac.kr/jnat/" },
  { name: "경상북도 보조기기센터", href: "http://gbatc.daegu.ac.kr" },
  { name: "충청남도 보조기기센터", href: "http://www.cnat.or.kr" },
  { name: "울산광역시 보조기기센터", href: "https://www.usat.or.kr/main.html" },
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

export function PublicFooter() {
  const [familyOpen, setFamilyOpen] = useState(false)

  return (
    <footer className="border-t bg-muted/50">
      <div className="container px-4 sm:px-6 py-6 sm:py-8">
        {/* 상단 링크 */}
        <div className="flex gap-4 text-xs sm:text-sm mb-5 border-b pb-4">
          <Link href="/privacy" className="hover:underline font-medium text-foreground">
            개인정보처리방침
          </Link>
          <Link href="/email-policy" className="hover:underline text-muted-foreground">
            이메일무단수집거부
          </Link>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* 기관 정보 */}
          <div className="flex flex-col gap-2">
            <Logo />
            <div className="text-xs sm:text-sm text-muted-foreground space-y-1 mt-1">
              <p className="font-medium text-foreground">강원특별자치도 보조기기센터</p>
              <p>강원특별자치도 춘천시 충열로 142번길 24-16(우두동 291-2)</p>
              <p>강원특별자치도재활병원 2층</p>
              <p>대표 : 이승준</p>
              <p>고유번호증 : 221-82-10983</p>
              <p className="flex flex-wrap gap-x-3">
                <span>대표전화 : 033-248-7751~4</span>
                <span>Fax : 033-248-7755</span>
                <span>Email : gatc2019@naver.com</span>
              </p>
              <p className="pt-1">Copyright(c) 강원특별자치도보조기기센터 All rights reserved.</p>
            </div>
          </div>

          {/* 오른쪽: SNS QR + 패밀리 사이트 */}
          <div className="flex flex-col gap-4 shrink-0">
            {/* SNS QR 코드 */}
            <div className="flex gap-4">
              {snsLinks.map((sns) => (
                <a
                  key={sns.label}
                  href={sns.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group"
                >
                  {/* QR 코드 */}
                  <div className="p-1.5 bg-white border rounded-md shadow-sm group-hover:shadow-md transition-shadow">
                    <QRCodeSVG
                      value={sns.href}
                      size={88}
                      level="M"
                      marginSize={1}
                    />
                  </div>
                  {/* 레이블 배지 */}
                  <span
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: sns.color, color: sns.textColor }}
                  >
                    {sns.icon}
                    {sns.label}
                  </span>
                </a>
              ))}
            </div>

            {/* 패밀리 사이트 */}
            <div className="w-full lg:w-52">
              <button
                onClick={() => setFamilyOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 border rounded-md bg-background text-sm font-medium hover:bg-muted/60 transition-colors"
                aria-expanded={familyOpen}
              >
                <span>패밀리 사이트</span>
                {familyOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {familyOpen && (
                <ul className="border border-t-0 rounded-b-md bg-background divide-y max-h-72 overflow-y-auto">
                  {familySites.map((site) => (
                    <li key={site.name}>
                      <a
                        href={site.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center text-sm py-2.5 px-4 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        {site.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
