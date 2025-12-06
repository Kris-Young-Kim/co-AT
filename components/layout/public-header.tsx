"use client"

import { Logo } from "@/components/common/logo"
import { Button } from "@/components/ui/button"
import { SignInButton, UserButton } from "@clerk/nextjs"
import Link from "next/link"

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/notices" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            공지사항
          </Link>
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm">
              로그인
            </Button>
          </SignInButton>
          <UserButton afterSignOutUrl="/" />
        </nav>
      </div>
    </header>
  )
}

