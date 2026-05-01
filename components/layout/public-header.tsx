"use client"

import { useState, useEffect } from "react"
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
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { LayoutDashboard, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

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
      { label: "지원사업", href: "/notices/support" },
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
      { label: "온라인 신청", href: "/apply" },
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isSignedIn } = useUser()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")

  useEffect(() => setMounted(true), [])
  
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "")
  }, [searchParams])

  useEffect(() => {
    if (isSignedIn) {
      hasAdminOrStaffPermission().then(setIsAdmin)
    } else {
      setIsAdmin(false)
    }
  }, [isSignedIn])

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm">
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
                      onKeyDown={(e) => {
                        // Enter 또는 Space 키로 드롭다운 열기/닫기
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          setOpenDropdown(openDropdown === item.id ? null : item.id)
                        }
                        // Esc 키로 드롭다운 닫기 (Radix UI가 자동 처리하지만 명시적으로 추가)
                        if (e.key === "Escape") {
                          setOpenDropdown(null)
                        }
                      }}
                      className={cn(
                        "inline-flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap relative",
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
                  "inline-flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap relative",
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
          {!mounted ? (
            <div className="h-9 w-20" aria-hidden />
          ) : (
            <>
              {/* 사이트 검색창 */}
              <form onSubmit={handleSearch} className="hidden lg:flex items-center relative w-40 xl:w-60">
                <Search 
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" 
                  onClick={() => handleSearch()}
                />
                <Input
                  type="search"
                  placeholder="검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-full bg-muted/50 border-none focus-visible:ring-1 text-sm"
                />
              </form>

              {/* 관리자 모드 버튼 (권한이 있을 때만 표시) */}
              {isAdmin && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex items-center gap-2 h-9 px-4 rounded-full bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-medium transition-all duration-300 border border-slate-200/50 dark:border-white/10 hover:border-primary/30 group relative overflow-hidden"
                >
                  <Link href={process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.gwatc.cloud"}>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute -inset-full top-0 h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:animate-shine" />
                    
                    <LayoutDashboard className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors duration-300 group-hover:rotate-12 transform" />
                    <span className="relative z-10 group-hover:tracking-tight transition-all duration-300">관리자 모드</span>
                    
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  </Link>
                </Button>
              )}

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
            </>
          )}
        </div>
      </div>
    </header>
  )
}



