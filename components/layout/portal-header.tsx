"use client"

import { Logo } from "@/components/common/logo"
import { UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Bell, Settings } from "lucide-react"

export function PortalHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:block hidden">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
            <Link href="/notices">
              <Bell className="h-4 w-4 mr-2" />
              공지사항
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
            <Link href="/portal/settings">
              <Settings className="h-4 w-4 mr-2" />
              설정
            </Link>
          </Button>
          <UserButton afterSignOutUrl="/" />
        </nav>
      </div>
    </header>
  )
}

