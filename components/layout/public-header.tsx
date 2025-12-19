"use client"

import { useState } from "react"
import { Logo } from "@/components/common/logo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SignInButton, UserButton, useUser, ClerkLoaded, ClerkLoading, ClerkFailed } from "@clerk/nextjs"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const headerMenuItems = [
  {
    id: "services",
    label: "주요사업",
    href: "/services",
    hasDropdown: true,
    subItems: [
      { label: "상담 및 정보제공", href: "/services/consultation" },
      { label: "맞춤형 지원", href: "/services/custom-support" },
      { label: "사후관리", href: "/services/aftercare" },
      { label: "교육/홍보", href: "/services/education-promotion" },
    ],
  },
  {
    id: "community",
    label: "커뮤니티",
    href: "/community",
    hasDropdown: true,
    subItems: [
      { label: "공지사항", href: "/notices" },
      { label: "지원사업", href: "/notices?category=support" },
      { label: "활동갤러리", href: "/community/gallery" },
      { label: "보조기기 서비스 사례", href: "/community/cases" },
    ],
  },
  {
    id: "info",
    label: "보조기기 정보",
    href: "/info",
    hasDropdown: true,
    subItems: [
      { label: "보유 보조기기", href: "/info/devices" },
      { label: "재사용 보조기기", href: "/info/reusable-devices" },
      { label: "나에게 맞는 보조기기", href: "/info/recommendation" },
      { label: "보조기기 수리센터 안내", href: "/info/repair-center" },
      { label: "정부지원사업안내", href: "/info/government-support" },
      { label: "자료실", href: "/info/resources" },
    ],
  },
  {
    id: "apply",
    label: "서비스 신청",
    href: "/apply",
    hasDropdown: true,
    subItems: [
      { label: "서비스 이용 안내", href: "/apply/guide" },
      { label: "온라인 신청", href: "/portal/apply" },
    ],
  },
  {
    id: "about",
    label: "센터소개",
    href: "/about",
    hasDropdown: true,
    subItems: [
      { label: "인사말", href: "/about/greeting" },
      { label: "조직도", href: "/about/organization" },
      { label: "연혁", href: "/about/history" },
      { label: "찾아오시는 길", href: "/about/location" },
    ],
  },
]

export function PublicHeader() {
  const pathname = usePathname()
  const { isSignedIn } = useUser()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-1 sm:gap-2 lg:gap-4">
          {headerMenuItems.map((item) => {
            const isActive = pathname.startsWith(item.href)

            if (item.hasDropdown && item.subItems) {
              return (
                <DropdownMenu
                  key={item.id}
                  open={openDropdown === item.id}
                  onOpenChange={(open) => setOpenDropdown(open ? item.id : null)}
                >
                  <DropdownMenuTrigger asChild>
                    <button
                      onMouseEnter={() => setOpenDropdown(item.id)}
                      onMouseLeave={() => setOpenDropdown(null)}
                      className={cn(
                        "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap relative",
                        isActive
                          ? "text-primary"
                          : "text-foreground hover:text-primary"
                      )}
                      aria-label={`${item.label} 메뉴`}
                      aria-expanded={openDropdown === item.id}
                      aria-haspopup="true"
                    >
                      {item.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-56"
                    onMouseEnter={() => setOpenDropdown(item.id)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    {item.subItems.map((subItem) => (
                      <DropdownMenuItem key={subItem.href} asChild>
                        <Link
                          href={subItem.href}
                          className="cursor-pointer"
                        >
                          {subItem.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap relative",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <ClerkLoading>
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm" disabled>
              로딩 중...
            </Button>
          </ClerkLoading>
          <ClerkFailed>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs sm:text-sm text-destructive"
              onClick={() => window.location.href = '/sign-in'}
            >
              로그인 (직접 이동)
            </Button>
          </ClerkFailed>
          <ClerkLoaded>
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                  로그인
                </Button>
              </SignInButton>
            ) : null}
            <UserButton afterSignOutUrl="/" />
          </ClerkLoaded>
        </div>
      </div>
    </header>
  )
}



