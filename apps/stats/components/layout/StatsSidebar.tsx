'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Briefcase, TrendingUp, Target, FileSpreadsheet } from 'lucide-react'

const navItems = [
  { href: '/', label: 'KPI 대시보드', icon: LayoutDashboard },
  { href: '/monthly', label: '월별 현황', icon: CalendarDays },
  { href: '/business', label: '사업별 현황', icon: Briefcase },
  { href: '/yearly', label: '연도별 추이', icon: TrendingUp },
  { href: '/targets', label: '목표 관리', icon: Target },
  { href: '/export', label: 'Excel 내보내기', icon: FileSpreadsheet },
]

export function StatsSidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 shrink-0 border-r bg-white h-screen sticky top-0 flex flex-col print:hidden">
      <div className="p-4 border-b">
        <h1 className="text-base font-bold text-gray-900">성과 대시보드</h1>
        <p className="text-xs text-gray-500 mt-0.5">stats.gwatc.cloud</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
