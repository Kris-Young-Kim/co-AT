"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Package,
  Calendar,
  Settings,
  FileText,
  Sparkles,
  BarChart3,
  MessageSquare,
  Wrench,
} from "lucide-react";

const menuItems = [
  { href: "/admin/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/stats", label: "통계 대시보드", icon: BarChart3 },
  { href: "/admin/chatbot", label: "규정 검색 챗봇", icon: MessageSquare },
  { href: "/admin/notices-management", label: "새 글 관리", icon: FileText },
  { href: "/admin/clients", label: "대상자 관리", icon: Users },
  { href: "/admin/inventory", label: "재고 관리", icon: Package },
  { href: "/admin/rentals", label: "대여 관리", icon: Package },
  { href: "/admin/custom-makes", label: "맞춤제작 관리", icon: Package },
  { href: "/admin/equipment", label: "장비 관리", icon: Wrench },
  { href: "/admin/schedule", label: "일정 관리", icon: Calendar },
  { href: "/admin/users", label: "사용자 관리", icon: Users },
  { href: "/admin/settings", label: "설정", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 border-r bg-gradient-to-b from-background to-muted/20 md:block">
      <div className="flex h-16 items-center gap-2 border-b px-6 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">관리자</span>
            <span className="text-[10px] text-muted-foreground">Admin Panel</span>
          </div>
        </div>
      </div>
      <nav className="flex flex-col gap-1 p-3 sm:p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1"
              )}
            >
              <Icon className={cn(
                "h-4 w-4 transition-transform duration-200",
                isActive ? "scale-110" : "group-hover:scale-110"
              )} />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/50" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
