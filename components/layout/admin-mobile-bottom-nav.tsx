"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FileText, Users, Package, Calendar, Bot, MessageSquare } from "lucide-react"

const navItems = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/notices-management", label: "공지", icon: FileText },
  { href: "/clients", label: "대상자", icon: Users },
  { href: "/inventory", label: "재고", icon: Package },
  { href: "/schedule", label: "일정", icon: Calendar },
  { href: "/messenger", label: "메신저", icon: MessageSquare },
  { href: "/agent-chat", label: "AI도우미", icon: Bot },
]

export function AdminMobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden safe-area-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-2 text-[10px] transition-colors min-h-[44px] min-w-[44px] touch-manipulation flex-1",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-primary active:bg-accent/50"
              )}
              aria-label={item.label}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate w-full text-center">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
