'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ArrowLeftRight } from 'lucide-react'

const navItems = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/devices', label: '기기 목록', icon: Package },
  { href: '/rentals', label: '대여 관리', icon: ArrowLeftRight },
]

export function InventorySidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 border-r bg-white h-screen sticky top-0 flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-base font-bold text-gray-900">자산/재고 관리</h1>
        <p className="text-xs text-gray-500 mt-0.5">inventory.gwatc.cloud</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
