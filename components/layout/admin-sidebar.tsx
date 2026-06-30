"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarCheck,
  Settings,
  Globe,
  Sparkles,
  MessageSquare,
  Bot,
  ClipboardList,
  Building2,
} from "lucide-react";

type NavItem = {
  type: "item";
  href: string;
  label: string;
  icon: React.ElementType;
  managerOnly?: boolean;
};

type NavSection = {
  type: "section";
  label: string;
};

type NavEntry = NavItem | NavSection;

const NAV_ENTRIES: NavEntry[] = [
  { type: "item", href: "/", label: "앱 목록", icon: LayoutDashboard },

  { type: "section", label: "콘텐츠" },
  { type: "item", href: "/notices-management", label: "웹 관리", icon: Globe },
  { type: "item", href: "/schedule", label: "일정 관리", icon: Calendar },
  { type: "item", href: "/appointments", label: "예약 관리", icon: CalendarCheck },
  { type: "item", href: "/partner-centers", label: "협력기관 연락망", icon: Building2 },

  { type: "section", label: "업무" },
  { type: "item", href: "/work-tasks", label: "업무 관리", icon: ClipboardList },
  { type: "item", href: "/messenger", label: "업무 메신저", icon: MessageSquare },
  { type: "item", href: "/agent-chat", label: "AI 업무 도우미", icon: Bot },

  { type: "section", label: "시스템" },
  { type: "item", href: "/users", label: "사용자 관리", icon: Users, managerOnly: true },
  { type: "item", href: "/settings", label: "설정", icon: Settings },
];

interface AdminSidebarProps {
  showUsersManagement?: boolean;
}

export function AdminSidebar({ showUsersManagement = false }: AdminSidebarProps) {
  const pathname = usePathname();

  const entries = NAV_ENTRIES.filter((entry) => {
    if (entry.type === "item" && entry.managerOnly) return showUsersManagement;
    return true;
  });

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

      <nav className="flex flex-col gap-0.5 p-3 sm:p-4">
        {entries.map((entry, idx) => {
          if (entry.type === "section") {
            return (
              <p
                key={`section-${idx}`}
                className="px-3 pt-4 pb-1 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider"
              >
                {entry.label}
              </p>
            );
          }

          const { href, label, icon: Icon } = entry;
          const isActive =
            pathname === href || (href !== "/" && pathname?.startsWith(href + "/"));

          return (
            <Link
              key={href}
              href={href}
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
              <span className="truncate">{label}</span>
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
