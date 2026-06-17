"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, FileText, UserCircle, LayoutGrid } from "lucide-react"

const BASE_ITEMS = [
  { href: "/mypage", label: "홈", icon: Home },
  { href: "/apply", label: "신청", icon: FileText },
  { href: "/portal/profile", label: "내 정보", icon: UserCircle },
]

const APPS_ITEM = { href: "/apps", label: "앱", icon: LayoutGrid }

export function MobileBottomNav({ showApps = false }: { showApps?: boolean }) {
  const pathname = usePathname()
  const navItems = showApps
    ? [BASE_ITEMS[0], BASE_ITEMS[1], APPS_ITEM, BASE_ITEMS[2]]
    : BASE_ITEMS

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 sm:px-4 py-2 text-[10px] sm:text-xs transition-colors min-w-0 flex-1",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="truncate w-full text-center">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
