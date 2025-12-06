"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/common/logo"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Package,
  Calendar,
  Settings,
} from "lucide-react"

const menuItems = [
  { href: "/admin/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/clients", label: "대상자 관리", icon: Users },
  { href: "/admin/inventory", label: "재고 관리", icon: Package },
  { href: "/admin/schedule", label: "일정 관리", icon: Calendar },
  { href: "/admin/settings", label: "설정", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 border-r bg-muted/40 md:block">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Logo />
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

