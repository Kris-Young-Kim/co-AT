'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ArrowLeftRight, Wrench,
  RefreshCw, Cpu, Settings, FileBarChart, Map, Droplets, ScanLine, PackageCheck, Menu,
  Search, Tag,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

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
  { type: 'item', href: '/', label: '대시보드', icon: LayoutDashboard },

  { type: 'section', label: '기기 관리' },
  { type: 'item', href: '/devices', label: '기기 목록', icon: Package },
  { type: 'item', href: '/rentals', label: '대여 관리', icon: ArrowLeftRight },
  { type: 'item', href: '/scan/match', label: '스캔 대여', icon: ScanLine },
  { type: 'item', href: '/scan/return', label: '스캔 반납', icon: PackageCheck },
  { type: 'item', href: '/scan/lookup', label: '스캔 조회', icon: Search },
  { type: 'item', href: '/scan/labels', label: 'QR 라벨 인쇄', icon: Tag },
  { type: 'item', href: '/reuse', label: '재사용', icon: RefreshCw },

  { type: 'section', label: '제작' },
  { type: 'item', href: '/custom-orders', label: '맞춤제작', icon: Wrench },
  { type: 'item', href: '/fab-equipment', label: '제작 장비', icon: Cpu },

  { type: 'section', label: '사후관리' },
  { type: 'item', href: '/maintenance', label: '점검/수리', icon: Settings },
  { type: 'item', href: '/cleaning', label: '소독·세척', icon: Droplets },

  { type: 'section', label: '현황·분석' },
  { type: 'item', href: '/reports', label: '리포트', icon: FileBarChart },
  { type: 'item', href: '/map', label: '지역 현황 맵', icon: Map },
]

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
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
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarHeader() {
  return (
    <div className="p-4 border-b">
      <h1 className="text-base font-bold text-gray-900">자산/재고 관리</h1>
      <p className="text-xs text-gray-500 mt-0.5">inventory.gwatc.cloud</p>
    </div>
  )
}

export function InventorySidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <aside className="hidden md:flex w-56 shrink-0 border-r bg-white h-screen sticky top-0 flex-col">
        <SidebarHeader />
        <NavList />
      </aside>

      {/* 모바일 상단 헤더 */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 bg-white border-b px-4 h-14">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">메뉴 열기</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 flex flex-col">
            <SidebarHeader />
            <NavList onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="font-bold text-gray-900 text-sm">자산/재고 관리</span>
      </header>
    </>
  )
}
