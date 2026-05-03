'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ScrollText, Settings, Send, Zap } from 'lucide-react'
import { cn } from '@co-at/ui'

const NAV_ITEMS = [
  { href: '/',         label: '대시보드',  icon: LayoutDashboard },
  { href: '/logs',     label: '실행 로그', icon: ScrollText      },
  { href: '/channels', label: '채널 설정', icon: Settings        },
  { href: '/send',     label: '수동 발송', icon: Send            },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen border-r bg-white flex flex-col">
      <div className="px-6 py-5 border-b flex items-center gap-2">
        <Zap className="w-5 h-5 text-indigo-600" />
        <span className="font-semibold text-sm">업무 자동화</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === href
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
