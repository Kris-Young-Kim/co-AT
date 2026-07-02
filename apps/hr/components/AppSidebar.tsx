'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  Briefcase,
  UserCog,
  Banknote,
  Receipt,
  FileText,
  Building2,
  Award,
  TrendingUp,
  ArrowUpCircle,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Zap,
  BookOpen,
  ScrollText,
  CreditCard,
  PiggyBank,
  FileSpreadsheet,
  QrCode,
  AlarmClock,
  Wallet,
  Activity,
  Plane,
  HandCoins,
  LogOut,
  Star,
  GraduationCap,
  FilePen,
  LineChart,
  Shield,
  FileCheck2,
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs))
}

type NavItem = { href: string; label: string; icon: React.ElementType }
type NavCategory = {
  key: string
  label: string
  icon: React.ElementType
  items: NavItem[]
}

const CATEGORIES: NavCategory[] = [
  {
    key: 'personnel',
    label: '인사관리',
    icon: Users,
    items: [
      { href: '/departments',           label: '부서 등록',     icon: Building2    },
      { href: '/positions',             label: '직급 등록',     icon: Award        },
      { href: '/salary-steps',          label: '호봉 등록',     icon: TrendingUp   },
      { href: '/salary-step-promotions',label: '호봉 승급',     icon: ArrowUpCircle},
      { href: '/employees',             label: '인사정보',      icon: UserCog      },
      { href: '/employees/status',      label: '인사정보현황',  icon: BarChart3    },
      { href: '/certificates',          label: '증명서 발급',   icon: FileText     },
    ],
  },
  {
    key: 'salary',
    label: '급여관리',
    icon: Banknote,
    items: [
      { href: '/salary/pay-items',       label: '지급공제항목 등록', icon: PiggyBank      },
      { href: '/salary/generate',        label: '급상여 생성',       icon: Zap            },
      { href: '/salary/ledger',          label: '급여대장',          icon: BookOpen       },
      { href: '/salary/slips',           label: '급여명세서',        icon: ScrollText     },
      { href: '/salary/payment-status',  label: '급여지급현황',      icon: BarChart3      },
      { href: '/salary/transfer-list',   label: '계좌이체명세서',    icon: CreditCard     },
      { href: '/salary/withholding-tax',      label: '원천징수부',        icon: FileSpreadsheet},
      { href: '/salary/insurance',           label: '4대보험 현황',      icon: Shield         },
      { href: '/salary/year-end-tax',        label: '연말정산',          icon: FileCheck2     },
      { href: '/salary/simplified-statement',label: '간이지급명세서',    icon: FileText       },
      { href: '/salary',                     label: '급여 기초자료',     icon: Banknote       },
      { href: '/daily-wages',                label: '일용급여',          icon: Receipt        },
    ],
  },
  {
    key: 'attendance',
    label: '근태관리',
    icon: Clock,
    items: [
      { href: '/attendance',          label: '출퇴근 기록',    icon: Clock        },
      { href: '/attendance/summary',  label: '근무현황',       icon: Activity     },
      { href: '/attendance/absences', label: '외출·반차·지참', icon: LogOut       },
      { href: '/attendance/overtime', label: '시간외근무',     icon: AlarmClock   },
      { href: '/attendance/weekly',   label: '주52시간',       icon: BarChart3    },
      { href: '/attendance/qr',       label: 'QR 출퇴근',     icon: QrCode       },
      { href: '/leave',               label: '연차·휴가',      icon: CalendarDays },
      { href: '/leave/balance',       label: '연차 잔여',      icon: Wallet       },
      { href: '/leave/calendar',      label: '휴가 캘린더',    icon: CalendarDays },
      { href: '/careers',             label: '경력 관리',      icon: Briefcase    },
    ],
  },
  {
    key: 'business',
    label: '출장·퇴직',
    icon: Plane,
    items: [
      { href: '/business-trip', label: '출장 관리',   icon: Plane      },
      { href: '/severance',     label: '퇴직금 정산', icon: HandCoins  },
    ],
  },
  {
    key: 'development',
    label: '인사개발',
    icon: Star,
    items: [
      { href: '/performance', label: '인사평가',     icon: Star          },
      { href: '/training',    label: '교육훈련',     icon: GraduationCap },
      { href: '/contracts',   label: '근로계약서',   icon: FilePen       },
      { href: '/hr-stats',    label: 'HR 통계·보고서', icon: LineChart   },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  const defaultOpen = CATEGORIES.reduce<Record<string, boolean>>((acc, cat) => {
    acc[cat.key] = cat.items.some(item => pathname.startsWith(item.href))
    return acc
  }, {})

  const [open, setOpen] = useState<Record<string, boolean>>(defaultOpen)

  const toggle = (key: string) =>
    setOpen(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <aside className="w-60 min-h-screen border-r bg-white flex flex-col">
      <div className="px-5 py-5 border-b flex items-center gap-2">
        <UserCog className="w-5 h-5 text-violet-600" />
        <span className="font-semibold text-sm text-gray-900">인사관리시스템</span>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {/* 대시보드 */}
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
            pathname === '/'
              ? 'bg-violet-50 text-violet-700 font-medium'
              : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          대시보드
        </Link>

        {/* 카테고리 토글 */}
        {CATEGORIES.map(cat => {
          const isOpen = open[cat.key] ?? false
          const isCatActive = cat.items.some(item => pathname.startsWith(item.href))

          return (
            <div key={cat.key}>
              <button
                onClick={() => toggle(cat.key)}
                className={cn(
                  'w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  isCatActive ? 'text-violet-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <span className="flex items-center gap-3">
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                </span>
                {isOpen
                  ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                }
              </button>

              {isOpen && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-100 pl-2">
                  {cat.items.map(item => {
                    const active = item.href === '/employees'
                      ? pathname === '/employees' || pathname.startsWith('/employees/')
                      : pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                          active
                            ? 'bg-violet-50 text-violet-700 font-medium'
                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                        )}
                      >
                        <item.icon className="w-3.5 h-3.5" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
