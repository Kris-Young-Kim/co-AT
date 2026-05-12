"use client"

import { Logo } from "@/components/common/logo"
import { UserButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Home, LogOut, Menu } from "lucide-react"
import { useState } from "react"
import { AdminMobileSidebar } from "@/components/layout/admin-mobile-sidebar"

const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gwatc.cloud'

interface AdminHeaderProps {
  showUsersManagement?: boolean
}

export function AdminHeader({ showUsersManagement = false }: AdminHeaderProps) {
  const { user } = useUser()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleAdminLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/admin/session', { method: 'DELETE' })
    } catch (error) {
      console.error('관리자 로그아웃 실패:', error)
    } finally {
      window.location.href = PUBLIC_SITE_URL
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            {/* 모바일 햄버거 메뉴 */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-10 w-10 touch-manipulation"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="메뉴 열기"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <a href={PUBLIC_SITE_URL} className="flex items-center">
              <Logo />
            </a>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm min-h-[44px] touch-manipulation">
              <a href={PUBLIC_SITE_URL}>
                <Home className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">홈으로</span>
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAdminLogout}
              disabled={isLoggingOut}
              className="text-xs sm:text-sm min-h-[44px] touch-manipulation"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">관리자 로그아웃</span>
            </Button>
            <div className="min-h-[44px] min-w-[44px] flex items-center justify-center">
              <UserButton afterSignOutUrl={PUBLIC_SITE_URL} />
            </div>
          </nav>
        </div>
      </header>
      <AdminMobileSidebar open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen} showUsersManagement={showUsersManagement} />
    </>
  )
}

