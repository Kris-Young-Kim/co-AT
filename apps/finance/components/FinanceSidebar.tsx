'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wallet, Receipt, FileBarChart, Tag, ArrowLeftRight, TrendingUp, Users } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs))
}

const NAV_ITEMS = [
  { href: '/',                label: '대시보드',      icon: LayoutDashboard },
  { href: '/budget',          label: '예산 관리',     icon: Wallet          },
  { href: '/budget/transfer', label: '예산 전용',     icon: ArrowLeftRight  },
  { href: '/expenditures',    label: '지출 내역',     icon: Receipt         },
  { href: '/income',          label: '수입·후원금',   icon: TrendingUp      },
  { href: '/salary-cost',     label: '인건비 현황',   icon: Users           },
  { href: '/reports',         label: '리포트',        icon: FileBarChart    },
  { href: '/categories',      label: '카테고리',      icon: Tag             },
]

export function FinanceSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen border-r bg-white flex flex-col">
      <div className="px-6 py-5 border-b flex items-center gap-2">
        <Wallet className="w-5 h-5 text-emerald-600" />
        <span className="font-semibold text-sm">예산·재무</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const bestMatch = NAV_ITEMS.filter(item =>
            item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(item.href + '/')
          ).sort((a, b) => b.href.length - a.href.length)[0]
          const active = bestMatch?.href === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-emerald-50 text-emerald-700 font-medium'
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
