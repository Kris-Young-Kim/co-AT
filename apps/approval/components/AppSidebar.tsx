'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FilePlus,
  Archive,
  Stamp,
  UserCheck,
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs))
}

const NAV_ITEMS = [
  { href: '/',                       label: '결재함',    icon: LayoutDashboard },
  { href: '/new',                    label: '기안하기',  icon: FilePlus        },
  { href: '/archive',                label: '보관함',    icon: Archive         },
  { href: '/settings/signature',     label: '서명 등록', icon: Stamp           },
  { href: '/settings/delegation',    label: '위임 결재', icon: UserCheck       },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen border-r bg-white flex flex-col">
      <div className="px-6 py-5 border-b flex items-center gap-2">
        <Stamp className="w-5 h-5 text-blue-600" />
        <span className="font-semibold text-sm">전자결재</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-blue-50 text-blue-700 font-medium'
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
