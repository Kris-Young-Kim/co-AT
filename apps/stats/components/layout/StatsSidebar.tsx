'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarDays, Briefcase, TrendingUp,
  Target, FileSpreadsheet, ClipboardList, Megaphone,
  LineChart, PhoneIncoming,
} from 'lucide-react'

type NavItem = {
  type: 'item'
  href: string
  label: string
  icon: React.ElementType
}

type NavSection = {
  type: 'section'
  label: string
}

type NavEntry = NavItem | NavSection

const NAV_ENTRIES: NavEntry[] = [
  { type: 'item', href: '/', label: 'KPI 대시보드', icon: LayoutDashboard },

  { type: 'section', label: '실적 현황' },
  { type: 'item', href: '/monthly', label: '월별 현황', icon: CalendarDays },
  { type: 'item', href: '/business', label: '사업별 현황', icon: Briefcase },
  { type: 'item', href: '/yearly', label: '연도별 추이', icon: TrendingUp },
  { type: 'item', href: '/programs', label: '프로그램 실적', icon: ClipboardList },
  { type: 'item', href: '/promotion', label: '홍보 실적', icon: Megaphone },
  { type: 'item', href: '/intake', label: '채널별 접수', icon: PhoneIncoming },

  { type: 'section', label: '목표·예측' },
  { type: 'item', href: '/targets', label: '목표 관리', icon: Target },
  { type: 'item', href: '/forecast', label: '수요 예측', icon: LineChart },

  { type: 'section', label: '내보내기' },
  { type: 'item', href: '/export', label: 'Excel 내보내기', icon: FileSpreadsheet },
]

export function StatsSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 border-r bg-white h-screen sticky top-0 flex flex-col print:hidden">
      <div className="p-4 border-b">
        <h1 className="text-base font-bold text-gray-900">성과 대시보드</h1>
        <p className="text-xs text-gray-500 mt-0.5">stats.gwatc.cloud</p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ENTRIES.map((entry, idx) => {
          if (entry.type === 'section') {
            return (
              <p
                key={`section-${idx}`}
                className="px-3 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider"
              >
                {entry.label}
              </p>
            )
          }

          const { href, label, icon: Icon } = entry
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
