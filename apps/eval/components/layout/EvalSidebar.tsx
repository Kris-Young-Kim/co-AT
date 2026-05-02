'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, BarChart3, LogOut, Phone } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'

const NAV_ITEMS = [
  { href: '/', label: '대시보드', icon: BarChart3 },
  { href: '/clients', label: '클라이언트', icon: Users },
  { href: '/call-logs', label: '콜센터 상담', icon: Phone },
] as const

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export function EvalSidebar() {
  const pathname = usePathname()
  const { signOut } = useClerk()

  return (
    <aside className="flex flex-col w-56 min-h-screen border-r bg-white px-3 py-4">
      <div className="mb-6 px-2">
        <h1 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          GWATC 평가툴
        </h1>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === href || (href !== '/' && pathname.startsWith(href))
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <button
        onClick={() => signOut({ redirectUrl: '/sign-in' })}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        로그아웃
      </button>
    </aside>
  )
}
