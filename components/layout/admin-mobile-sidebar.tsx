"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Package,
  Calendar,
  Settings,
  FileText,
  Sparkles,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const menuItems = [
  { href: "/admin/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/notices-management", label: "새 글 관리", icon: FileText },
  { href: "/admin/clients", label: "대상자 관리", icon: Users },
  { href: "/admin/inventory", label: "재고 관리", icon: Package },
  { href: "/admin/rentals", label: "대여 관리", icon: Package },
  { href: "/admin/custom-makes", label: "맞춤제작 관리", icon: Package },
  { href: "/admin/schedule", label: "일정 관리", icon: Calendar },
  { href: "/admin/users", label: "사용자 관리", icon: Users, managerOnly: true },
  { href: "/admin/settings", label: "설정", icon: Settings },
]

interface AdminMobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  showUsersManagement?: boolean
}

export function AdminMobileSidebar({ open, onOpenChange, showUsersManagement = false }: AdminMobileSidebarProps) {
  const pathname = usePathname()
  const filteredItems = menuItems.filter(
    (item) => !("managerOnly" in item && item.managerOnly) || showUsersManagement
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed left-0 top-0 h-full w-64 max-w-full translate-x-0 translate-y-0 rounded-none border-r p-0 data-[state=open]:slide-in-from-left">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <DialogTitle className="text-sm font-semibold">관리자</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
              aria-label="메뉴 닫기"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <nav className="flex flex-col gap-1 p-3 overflow-y-auto">
          {filteredItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/")

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px] touch-manipulation",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent/80"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 transition-transform duration-200 flex-shrink-0",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} />
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/50" />
                )}
              </Link>
            )
          })}
        </nav>
      </DialogContent>
    </Dialog>
  )
}
