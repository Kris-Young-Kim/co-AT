"use client"

import { Logo } from "@/components/common/logo"
import { UserButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Home, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function AdminHeader() {
  const router = useRouter()
  const { user } = useUser()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleAdminLogout = async () => {
    setIsLoggingOut(true)
    try {
      // 관리자 세션 쿠키 삭제
      await fetch('/api/admin/session', {
        method: 'DELETE',
      })
      
      // 홈으로 이동
      router.push('/')
    } catch (error) {
      console.error('관리자 로그아웃 실패:', error)
      // 에러가 발생해도 홈으로 이동
      router.push('/')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center">
            <Logo />
          </Link>
        </div>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              홈으로
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAdminLogout}
            disabled={isLoggingOut}
            className="text-xs sm:text-sm"
          >
            <LogOut className="h-4 w-4 mr-2" />
            관리자 로그아웃
          </Button>
          <UserButton afterSignOutUrl="/" />
        </nav>
      </div>
    </header>
  )
}

