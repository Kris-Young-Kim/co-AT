'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  Briefcase,
  UserCog,
  Banknote,
  Receipt,
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs))
}

const NAV_ITEMS = [
  { href: '/',            label: '대시보드',    icon: LayoutDashboard },
  { href: '/employees',   label: '직원 관리',   icon: Users           },
  { href: '/attendance',  label: '출퇴근 기록',  icon: Clock           },
  { href: '/leave',       label: '연차·휴가',   icon: CalendarDays    },
  { href: '/careers',     label: '경력 관리',   icon: Briefcase       },
  { href: '/salary',      label: '급여 관리',   icon: Banknote        },
  { href: '/daily-wages', label: '일용급여',    icon: Receipt         },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen border-r bg-white flex flex-col">
      <div className="px-6 py-5 border-b flex items-center gap-2">
        <UserCog className="w-5 h-5 text-violet-600" />
        <span className="font-semibold text-sm">인사관리</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-violet-50 text-violet-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
