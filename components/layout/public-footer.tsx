"use client"

import { useState } from "react"
import Link from "next/link"
import { Logo } from "@/components/common/logo"
import { ChevronUp, ChevronDown } from "lucide-react"

const familySites = [
  "경기도 보조기기북부센터",
  "인천광역시 보조기기센터",
  "대전광역시 보조기기센터",
  "대구광역시 보조기기센터",
  "광주광역시 보조기기센터",
  "부산광역시 보조기기센터",
  "충청북도 보조기기센터",
  "전라북도 보조기기센터",
  "경상남도 보조기기센터",
  "제주특별자치도 보조기기센터",
  "세종특별자치시 보조기기센터",
  "서울시 보조기기센터",
  "전라남도 보조기기센터",
  "경상북도 보조기기센터",
  "충청남도 보조기기센터",
  "울산광역시 보조기기센터",
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
              <p className="flex flex-wrap gap-x-3">
                <span>사업자 등록번호 : 221-82-10983</span>
                <span>대표전화 : 033-248-7751~4</span>
                <span>Fax : 033-248-7755</span>
                <span>Email : gatc2019@naver.com</span>
              </p>
              <p className="pt-1">Copyright(c) 강원특별자치도보조기기센터 All rights reserved.</p>
            </div>
          </div>

          {/* 패밀리 사이트 */}
          <div className="w-full lg:w-64 shrink-0">
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
                  <li key={site}>
                    <button className="w-full text-center text-sm py-2.5 px-4 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground">
                      {site}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
