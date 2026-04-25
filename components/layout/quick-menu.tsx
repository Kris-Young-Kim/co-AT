"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { FileText, ClipboardList, Search, ExternalLink, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

const quickItems = [
  {
    label: "서비스\n이용안내",
    href: "/apply/guide",
    icon: FileText,
    external: false,
    color: "bg-[#0277BD] hover:bg-[#01579B]",
  },
  {
    label: "온라인\n신청",
    href: "/portal/apply",
    icon: ClipboardList,
    external: false,
    color: "bg-[#2E7D32] hover:bg-[#1B5E20]",
  },
  {
    label: "보유기기\n검색",
    href: "/info/devices",
    icon: Search,
    external: false,
    color: "bg-[#6A1B9A] hover:bg-[#4A148C]",
  },
  {
    label: "중앙보조\n기기센터",
    href: "http://knat.go.kr/knw/home/knat_DB/prod_search.php",
    icon: ExternalLink,
    external: true,
    color: "bg-[#BF360C] hover:bg-[#870000]",
  },
]

export function QuickMenu() {
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" })

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1.5">
      {quickItems.map((item) => {
        const Icon = item.icon
        const Comp = item.external ? "a" : Link
        const extraProps = item.external
          ? { href: item.href, target: "_blank", rel: "noopener noreferrer" }
          : { href: item.href }

        return (
          <Comp
            key={item.label}
            {...(extraProps as any)}
            className={cn(
              "group flex flex-col items-center justify-center gap-1",
              "w-14 h-14 rounded-lg shadow-md text-white transition-all duration-200",
              "hover:scale-105 hover:shadow-lg",
              item.color
            )}
            title={item.label.replace("\n", " ")}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="text-center leading-tight whitespace-pre text-[10px] font-medium">
              {item.label}
            </span>
          </Comp>
        )
      })}

      {/* TOP 버튼 */}
      <button
        onClick={scrollToTop}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5",
          "w-14 h-10 rounded-lg shadow-md bg-gray-600 hover:bg-gray-700 text-white",
          "transition-all duration-200 hover:scale-105",
          showTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        )}
        aria-label="맨 위로 이동"
      >
        <ChevronUp className="w-4 h-4" />
        <span className="text-[10px] font-semibold leading-none">TOP</span>
      </button>
    </div>
  )
}
