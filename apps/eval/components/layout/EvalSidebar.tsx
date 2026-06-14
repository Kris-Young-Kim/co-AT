'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users, BarChart3, LogOut, Phone, RefreshCw, Clock,
  FileEdit, GraduationCap, Gift, FileText, BarChart2,
  BookOpen, Kanban, QrCode, ClipboardList,
} from 'lucide-react'
import { useClerk } from '@clerk/nextjs'

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
  { type: 'item', href: '/', label: '대시보드', icon: BarChart3 },
  { type: 'item', href: '/pipeline', label: '서비스 진행 현황', icon: Kanban },

  { type: 'section', label: '대상자' },
  { type: 'item', href: '/clients', label: '대상자 목록', icon: Users },
  { type: 'item', href: '/clients/pending', label: '신규 접수 대기', icon: Clock },
  { type: 'item', href: '/print/client-labels', label: 'QR 라벨 인쇄', icon: QrCode },

  { type: 'section', label: '상담·서비스' },
  { type: 'item', href: '/call-logs', label: '콜센터 상담', icon: Phone },
  { type: 'item', href: '/service-records', label: '서비스 기록', icon: FileEdit },
  { type: 'item', href: '/education', label: '교육 이력', icon: GraduationCap },

  { type: 'section', label: '영역별 평가' },
  { type: 'item', href: '/assessments', label: '평가 목록', icon: ClipboardList },

  { type: 'section', label: '교부사업 평가' },
  { type: 'item', href: '/grant-eval', label: '교부사업 평가', icon: Gift },
  { type: 'item', href: '/grant-eval/referrals', label: '접수공문 관리', icon: FileText },
  { type: 'item', href: '/grant-eval/statistics', label: '교부사업 통계', icon: BarChart2 },

  { type: 'section', label: '지식·관리' },
  { type: 'item', href: '/knowledge', label: '보조기기 결과 이력', icon: BookOpen },
  { type: 'item', href: '/migration', label: 'Sheets 동기화', icon: RefreshCw },
]

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  if (href === '/clients') {
    return pathname === '/clients' || (pathname.startsWith('/clients/') && !pathname.startsWith('/clients/pending'))
  }
  return pathname === href || pathname.startsWith(href + '/')
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

      <nav className="flex-1 space-y-0.5">
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
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive(pathname, href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <button
        onClick={() => signOut({ redirectUrl: '/sign-in' })}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors mt-2"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        로그아웃
      </button>
    </aside>
  )
}
