# Phase 2: apps/inventory — 자산/재고 관리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AT 전문가(보조공학사)가 `inventory.gwatc.cloud`에서 보조기기 자산 등록·수정·삭제, 바코드 스캔 조회, 대여·반납 처리, 재고 현황 확인을 할 수 있는 전용 웹 앱을 구축한다.

**Architecture:** `apps/inventory`는 독립 Next.js 16 앱. `apps/eval`과 동일한 방식으로 `@/inventory/*` alias를 앱 자체로, `@/*`를 repo 루트로 설정해 기존 `actions/`, `types/` 코드를 재사용한다.

**Backend Status:** DB 테이블(inventory, rentals) + Server Actions(inventory-actions.ts, rental-actions.ts)는 이미 존재. 본 Phase는 UI 구축만 수행.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase (기존 테이블), Clerk v6, Tailwind CSS, shadcn/ui (`@co-at/ui`), `@co-at/auth`, `@co-at/lib`

---

## File Map

```
apps/inventory/
  tsconfig.json                           ← @/inventory/* + @/* alias 추가
  next.config.mjs                         ← externalDir, transpilePackages 유지
  app/
    layout.tsx                            ← 사이드바 레이아웃
    page.tsx                              ← 재고 대시보드 (요약 현황)
    globals.css                           ← 기존 유지
    devices/
      page.tsx                            ← 기기 목록 (검색, 상태 필터, 바코드 스캔)
      new/
        page.tsx                          ← 기기 등록 폼
      [id]/
        page.tsx                          ← 기기 상세
        edit/
          page.tsx                        ← 기기 수정 폼
    rentals/
      page.tsx                            ← 대여 목록 (연체·만료임박 강조)
      new/
        page.tsx                          ← 대여 등록 폼
      [id]/
        page.tsx                          ← 대여 상세 + 반납/연장 버튼
  components/
    layout/
      InventorySidebar.tsx                ← 사이드바 내비게이션
    inventory/
      BarcodeScanInput.tsx                ← USB 바코드 스캐너 Enter 트리거
      DeviceListTable.tsx                 ← 기기 목록 테이블
      DeviceStatusBadge.tsx               ← 상태 배지 (보관/대여중/수리중/소독중/폐기)
      DeviceForm.tsx                      ← 기기 등록/수정 폼 (create + edit 공용)
    rental/
      RentalListTable.tsx                 ← 대여 목록 테이블 (연체 강조)
      RentalStatusBadge.tsx               ← 대여 상태 배지
      RentalForm.tsx                      ← 대여 등록 폼
      ReturnButton.tsx                    ← 반납 처리 버튼 (client component)
      ExtendButton.tsx                    ← 기간 연장 버튼 (client component)

-- 기존 재사용 (apps/inventory에서 @/ 경로로 접근) --
actions/inventory-actions.ts   ← getInventoryList, getInventoryItem, createInventoryItem, updateInventoryItem, deleteInventoryItem, updateInventoryStatus, getInventoryItemByBarcode
actions/rental-actions.ts      ← createRental, returnRental, extendRental, getRentals, getRentalById, getOverdueRentals, getExpiringRentals
types/database.types.ts        ← DB 타입 (루트)
```

---

## Task 1: Configure apps/inventory — tsconfig + next.config

**Files:**
- Modify: `apps/inventory/tsconfig.json`
- Modify: `apps/inventory/next.config.mjs`

- [ ] **Step 1: Update apps/inventory/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/inventory/*": ["./*"],
      "@/components/ui/*": ["../../packages/ui/ui/*"],
      "@/lib/supabase/*": ["../../packages/lib/supabase/*"],
      "@/lib/validators": ["../../packages/lib/validators.ts"],
      "@/types/*": ["../../packages/lib/types/*"],
      "@/*": ["../../*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 2: Update apps/inventory/next.config.mjs**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
  },
  transpilePackages: ['@co-at/ui', '@co-at/lib', '@co-at/auth', '@co-at/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 3: Commit**

```bash
git add apps/inventory/tsconfig.json apps/inventory/next.config.mjs
git commit -m "feat(inventory): configure tsconfig alias and externalDir"
```

---

## Task 2: Sidebar + Layout

**Files:**
- Create: `apps/inventory/components/layout/InventorySidebar.tsx`
- Modify: `apps/inventory/app/layout.tsx`

- [ ] **Step 1: Create InventorySidebar.tsx**

```typescript
// apps/inventory/components/layout/InventorySidebar.tsx
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
```

- [ ] **Step 2: Update apps/inventory/app/layout.tsx**

```typescript
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { InventorySidebar } from '@/inventory/components/layout/InventorySidebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'GWATC — 자산/재고 관리',
  description: '보조공학센터 자산 및 재고 관리 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="ko">
        <body className="bg-gray-50">
          <div className="flex min-h-screen">
            <InventorySidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/inventory/components/layout/InventorySidebar.tsx apps/inventory/app/layout.tsx
git commit -m "feat(inventory): add sidebar layout"
```

---

## Task 3: Shared Components (Badge + BarcodeScan)

**Files:**
- Create: `apps/inventory/components/inventory/DeviceStatusBadge.tsx`
- Create: `apps/inventory/components/inventory/RentalStatusBadge.tsx` (rental/ 폴더에 위치)
- Create: `apps/inventory/components/inventory/BarcodeScanInput.tsx`

- [ ] **Step 1: Create DeviceStatusBadge.tsx**

```typescript
// apps/inventory/components/inventory/DeviceStatusBadge.tsx
const STATUS_STYLES: Record<string, string> = {
  보관: 'bg-green-100 text-green-700',
  대여중: 'bg-blue-100 text-blue-700',
  수리중: 'bg-yellow-100 text-yellow-700',
  소독중: 'bg-purple-100 text-purple-700',
  폐기: 'bg-gray-100 text-gray-500',
}

export function DeviceStatusBadge({ status }: { status: string | null }) {
  const s = status ?? '—'
  const cls = STATUS_STYLES[s] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {s}
    </span>
  )
}
```

- [ ] **Step 2: Create RentalStatusBadge.tsx**

```typescript
// apps/inventory/components/rental/RentalStatusBadge.tsx
const STATUS_STYLES: Record<string, string> = {
  rented: 'bg-blue-100 text-blue-700',
  returned: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  damaged: 'bg-orange-100 text-orange-700',
}

const STATUS_LABELS: Record<string, string> = {
  rented: '대여중',
  returned: '반납완료',
  overdue: '연체',
  damaged: '손상',
}

export function RentalStatusBadge({ status }: { status: string | null }) {
  const s = status ?? 'rented'
  const cls = STATUS_STYLES[s] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {STATUS_LABELS[s] ?? s}
    </span>
  )
}
```

- [ ] **Step 3: Create BarcodeScanInput.tsx**

```typescript
// apps/inventory/components/inventory/BarcodeScanInput.tsx
'use client'

import { useRef, useState } from 'react'
import { Search } from 'lucide-react'

interface BarcodeScanInputProps {
  onScan: (value: string) => void
  placeholder?: string
}

export function BarcodeScanInput({
  onScan,
  placeholder = '바코드 스캔 또는 입력 후 Enter',
}: BarcodeScanInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && value.trim()) {
            onScan(value.trim())
            setValue('')
          }
        }}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/inventory/components/
git commit -m "feat(inventory): add shared badge and barcode scan components"
```

---

## Task 4: Device List Page

**Files:**
- Create: `apps/inventory/components/inventory/DeviceListTable.tsx`
- Create: `apps/inventory/app/devices/page.tsx`

- [ ] **Step 1: Create DeviceListTable.tsx**

```typescript
// apps/inventory/components/inventory/DeviceListTable.tsx
import { DeviceStatusBadge } from '@/inventory/components/inventory/DeviceStatusBadge'
import type { InventoryItem } from '@/actions/inventory-actions'
import Link from 'next/link'

interface DeviceListTableProps {
  items: InventoryItem[]
}

export function DeviceListTable({ items }: DeviceListTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">등록된 기기가 없습니다.</div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-700">기기명</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">자산번호</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">카테고리</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">제조사/모델</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">상태</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map(item => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{item.name}</td>
              <td className="px-4 py-3 text-gray-600">{item.asset_code ?? '—'}</td>
              <td className="px-4 py-3 text-gray-600">{item.category ?? '—'}</td>
              <td className="px-4 py-3 text-gray-600">
                {[item.manufacturer, item.model].filter(Boolean).join(' ') || '—'}
              </td>
              <td className="px-4 py-3">
                <DeviceStatusBadge status={item.status} />
              </td>
              <td className="px-4 py-3">
                <Link href={`/devices/${item.id}`} className="text-blue-600 hover:underline">
                  상세
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Create apps/inventory/app/devices/page.tsx**

```typescript
import { getInventoryList } from '@/actions/inventory-actions'
import { DeviceListTable } from '@/inventory/components/inventory/DeviceListTable'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface DevicesPageProps {
  searchParams: Promise<{ q?: string; status?: string; category?: string }>
}

export default async function DevicesPage({ searchParams }: DevicesPageProps) {
  const params = await searchParams
  const result = await getInventoryList({
    search: params.q,
    status: params.status,
    category: params.category,
    limit: 100,
  })
  const items = result.success ? result.items ?? [] : []
  const total = result.success ? result.total ?? 0 : 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">기기 목록</h1>
          <p className="text-sm text-gray-500 mt-1">총 {total}개 기기</p>
        </div>
        <Link
          href="/devices/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          기기 등록
        </Link>
      </div>

      {/* 검색/필터 */}
      <form method="GET" className="flex gap-3 mb-6">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="기기명, 자산번호, 제조사 검색..."
          className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          name="status"
          defaultValue={params.status}
          className="px-3 py-2 border rounded-md text-sm focus:outline-none"
        >
          <option value="">전체 상태</option>
          <option value="보관">보관</option>
          <option value="대여중">대여중</option>
          <option value="수리중">수리중</option>
          <option value="소독중">소독중</option>
          <option value="폐기">폐기</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900"
        >
          검색
        </button>
      </form>

      <DeviceListTable items={items} />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/inventory/components/inventory/DeviceListTable.tsx apps/inventory/app/devices/page.tsx
git commit -m "feat(inventory): add device list page"
```

---

## Task 5: Device Detail + Edit + New Pages

**Files:**
- Create: `apps/inventory/components/inventory/DeviceForm.tsx`
- Create: `apps/inventory/app/devices/[id]/page.tsx`
- Create: `apps/inventory/app/devices/[id]/edit/page.tsx`
- Create: `apps/inventory/app/devices/new/page.tsx`

- [ ] **Step 1: Create DeviceForm.tsx (shared create/edit form)**

```typescript
// apps/inventory/components/inventory/DeviceForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { InventoryItem } from '@/actions/inventory-actions'

interface DeviceFormProps {
  defaultValues?: Partial<InventoryItem>
  onSubmit: (data: Partial<InventoryItem>) => Promise<{ success: boolean; error?: string; item?: InventoryItem }>
  submitLabel?: string
}

export function DeviceForm({ defaultValues, onSubmit, submitLabel = '저장' }: DeviceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const data: Partial<InventoryItem> = {
      name: fd.get('name') as string,
      asset_code: (fd.get('asset_code') as string) || null,
      category: (fd.get('category') as string) || null,
      status: (fd.get('status') as string) || '보관',
      manufacturer: (fd.get('manufacturer') as string) || null,
      model: (fd.get('model') as string) || null,
      purchase_date: (fd.get('purchase_date') as string) || null,
      purchase_price: fd.get('purchase_price') ? Number(fd.get('purchase_price')) : null,
      barcode: (fd.get('barcode') as string) || null,
      is_rental_available: fd.get('is_rental_available') === 'true',
    }

    const result = await onSubmit(data)
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? '저장에 실패했습니다')
      return
    }

    router.push(result.item ? `/devices/${result.item.id}` : '/devices')
    router.refresh()
  }

  const field = (
    name: string,
    label: string,
    opts?: { type?: string; required?: boolean; defaultValue?: string | number | null }
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{opts?.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        name={name}
        type={opts?.type ?? 'text'}
        defaultValue={opts?.defaultValue ?? undefined}
        required={opts?.required}
        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {field('name', '기기명', { required: true, defaultValue: defaultValues?.name })}
      {field('asset_code', '자산번호', { defaultValue: defaultValues?.asset_code })}
      {field('category', '카테고리', { defaultValue: defaultValues?.category })}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
        <select
          name="status"
          defaultValue={defaultValues?.status ?? '보관'}
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
        >
          {['보관', '대여중', '수리중', '소독중', '폐기'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {field('manufacturer', '제조사', { defaultValue: defaultValues?.manufacturer })}
      {field('model', '모델명', { defaultValue: defaultValues?.model })}
      {field('purchase_date', '구입일', { type: 'date', defaultValue: defaultValues?.purchase_date })}
      {field('purchase_price', '구입가격 (원)', { type: 'number', defaultValue: defaultValues?.purchase_price ?? undefined })}
      {field('barcode', '바코드', { defaultValue: defaultValues?.barcode })}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">대여 가능</label>
        <select
          name="is_rental_available"
          defaultValue={String(defaultValues?.is_rental_available ?? true)}
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
        >
          <option value="true">가능</option>
          <option value="false">불가</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '저장 중...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 border text-sm font-medium rounded-md hover:bg-gray-50"
        >
          취소
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create device detail page**

```typescript
// apps/inventory/app/devices/[id]/page.tsx
import { getInventoryItem } from '@/actions/inventory-actions'
import { DeviceStatusBadge } from '@/inventory/components/inventory/DeviceStatusBadge'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'

interface DeviceDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function DeviceDetailPage({ params }: DeviceDetailPageProps) {
  const { id } = await params
  const result = await getInventoryItem(id)
  if (!result.success || !result.item) notFound()

  const d = result.item

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex gap-4 py-2.5 border-b last:border-0">
      <dt className="w-32 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  )

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/devices" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{d.name}</h1>
        <Link
          href={`/devices/${id}/edit`}
          className="flex items-center gap-2 px-3 py-1.5 border text-sm font-medium rounded-md hover:bg-gray-50"
        >
          <Pencil className="h-4 w-4" />
          수정
        </Link>
      </div>

      <div className="bg-white border rounded-lg p-6 max-w-2xl">
        <dl>
          {row('기기명', d.name)}
          {row('자산번호', d.asset_code)}
          {row('카테고리', d.category)}
          {row('상태', <DeviceStatusBadge status={d.status} />)}
          {row('제조사', d.manufacturer)}
          {row('모델명', d.model)}
          {row('바코드', d.barcode)}
          {row('구입일', d.purchase_date)}
          {row('구입가격', d.purchase_price ? `${d.purchase_price.toLocaleString()}원` : null)}
          {row('대여가능', d.is_rental_available ? '가능' : '불가')}
        </dl>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create device edit page**

```typescript
// apps/inventory/app/devices/[id]/edit/page.tsx
import { getInventoryItem, updateInventoryItem } from '@/actions/inventory-actions'
import { DeviceForm } from '@/inventory/components/inventory/DeviceForm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface DeviceEditPageProps {
  params: Promise<{ id: string }>
}

export default async function DeviceEditPage({ params }: DeviceEditPageProps) {
  const { id } = await params
  const result = await getInventoryItem(id)
  if (!result.success || !result.item) notFound()

  async function handleUpdate(data: Parameters<typeof updateInventoryItem>[1]) {
    'use server'
    return updateInventoryItem(id, data)
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/devices/${id}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">기기 수정</h1>
      </div>
      <DeviceForm
        defaultValues={result.item}
        onSubmit={handleUpdate}
        submitLabel="수정 저장"
      />
    </div>
  )
}
```

- [ ] **Step 4: Create device new page**

```typescript
// apps/inventory/app/devices/new/page.tsx
import { createInventoryItem } from '@/actions/inventory-actions'
import { DeviceForm } from '@/inventory/components/inventory/DeviceForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function DeviceNewPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/devices" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">기기 등록</h1>
      </div>
      <DeviceForm onSubmit={createInventoryItem} submitLabel="등록" />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/inventory/components/inventory/DeviceForm.tsx \
  "apps/inventory/app/devices/[id]/page.tsx" \
  "apps/inventory/app/devices/[id]/edit/page.tsx" \
  apps/inventory/app/devices/new/page.tsx
git commit -m "feat(inventory): add device detail, edit, and new pages"
```

---

## Task 6: Rental List + Detail + New Pages

**Files:**
- Create: `apps/inventory/components/rental/RentalListTable.tsx`
- Create: `apps/inventory/components/rental/ReturnButton.tsx`
- Create: `apps/inventory/components/rental/ExtendButton.tsx`
- Create: `apps/inventory/app/rentals/page.tsx`
- Create: `apps/inventory/app/rentals/[id]/page.tsx`

- [ ] **Step 1: Create RentalListTable.tsx**

```typescript
// apps/inventory/components/rental/RentalListTable.tsx
import type { RentalWithDetails } from '@/actions/rental-actions'
import { RentalStatusBadge } from '@/inventory/components/rental/RentalStatusBadge'
import Link from 'next/link'

interface RentalListTableProps {
  rentals: RentalWithDetails[]
}

export function RentalListTable({ rentals }: RentalListTableProps) {
  if (rentals.length === 0) {
    return <div className="text-center py-12 text-gray-500">대여 기록이 없습니다.</div>
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-700">기기명</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">이용자</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">대여기간</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">상태</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">반납기한</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rentals.map(r => (
            <tr
              key={r.id}
              className={`hover:bg-gray-50 ${r.is_overdue ? 'bg-red-50' : r.is_due_today ? 'bg-yellow-50' : ''}`}
            >
              <td className="px-4 py-3 font-medium">
                {r.inventory_name ?? '—'}
                {r.inventory_model && <span className="text-gray-500 ml-1 text-xs">{r.inventory_model}</span>}
              </td>
              <td className="px-4 py-3 text-gray-600">{r.client_name ?? '—'}</td>
              <td className="px-4 py-3 text-gray-600">
                {r.rental_start_date} ~ {r.rental_end_date}
              </td>
              <td className="px-4 py-3">
                <RentalStatusBadge status={r.status} />
              </td>
              <td className="px-4 py-3 text-gray-600">
                {r.is_overdue && <span className="text-red-600 font-medium">연체 ({Math.abs(r.days_remaining ?? 0)}일)</span>}
                {r.is_due_today && !r.is_overdue && <span className="text-yellow-600 font-medium">오늘 반납</span>}
                {!r.is_overdue && !r.is_due_today && r.status === 'rented' && `${r.days_remaining}일 남음`}
                {r.status === 'returned' && r.return_date}
              </td>
              <td className="px-4 py-3">
                <Link href={`/rentals/${r.id}`} className="text-blue-600 hover:underline">
                  상세
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Create ReturnButton.tsx**

```typescript
// apps/inventory/components/rental/ReturnButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { returnRental } from '@/actions/rental-actions'

export function ReturnButton({ rentalId }: { rentalId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleReturn() {
    if (!confirm('반납 처리하시겠습니까?')) return
    setLoading(true)
    const result = await returnRental(rentalId)
    setLoading(false)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error ?? '반납 처리에 실패했습니다')
    }
  }

  return (
    <button
      onClick={handleReturn}
      disabled={loading}
      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
    >
      {loading ? '처리 중...' : '반납 처리'}
    </button>
  )
}
```

- [ ] **Step 3: Create ExtendButton.tsx**

```typescript
// apps/inventory/components/rental/ExtendButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { extendRental } from '@/actions/rental-actions'

export function ExtendButton({ rentalId, currentEndDate }: { rentalId: string; currentEndDate: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState(14)

  async function handleExtend() {
    if (!confirm(`${days}일 연장하시겠습니까?`)) return
    setLoading(true)
    const result = await extendRental(rentalId, days)
    setLoading(false)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error ?? '연장에 실패했습니다')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={days}
        onChange={e => setDays(Number(e.target.value))}
        className="px-2 py-2 border rounded-md text-sm"
      >
        {[7, 14, 30].map(d => <option key={d} value={d}>{d}일</option>)}
      </select>
      <button
        onClick={handleExtend}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '처리 중...' : '기간 연장'}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Create rentals list page**

```typescript
// apps/inventory/app/rentals/page.tsx
import { getRentals, getOverdueRentals } from '@/actions/rental-actions'
import { RentalListTable } from '@/inventory/components/rental/RentalListTable'

interface RentalsPageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function RentalsPage({ searchParams }: RentalsPageProps) {
  const params = await searchParams
  const status = params.status

  const [rentalsResult, overdueResult] = await Promise.all([
    getRentals({ status: status || undefined, limit: 100 }),
    getOverdueRentals(),
  ])

  const rentals = rentalsResult.success ? rentalsResult.rentals ?? [] : []
  const overdueCount = overdueResult.success ? (overdueResult.rentals ?? []).length : 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대여 관리</h1>
          {overdueCount > 0 && (
            <p className="text-sm text-red-600 mt-1 font-medium">연체 {overdueCount}건</p>
          )}
        </div>
      </div>

      {/* 상태 필터 */}
      <div className="flex gap-2 mb-6">
        {[
          { value: '', label: '전체' },
          { value: 'rented', label: '대여중' },
          { value: 'overdue', label: '연체' },
          { value: 'returned', label: '반납완료' },
        ].map(opt => (
          <a
            key={opt.value}
            href={opt.value ? `?status=${opt.value}` : '/rentals'}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              (status ?? '') === opt.value
                ? 'bg-gray-800 text-white border-gray-800'
                : 'text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </a>
        ))}
      </div>

      <RentalListTable rentals={rentals} />
    </div>
  )
}
```

- [ ] **Step 5: Create rental detail page**

```typescript
// apps/inventory/app/rentals/[id]/page.tsx
import { getRentalById } from '@/actions/rental-actions'
import { RentalStatusBadge } from '@/inventory/components/rental/RentalStatusBadge'
import { ReturnButton } from '@/inventory/components/rental/ReturnButton'
import { ExtendButton } from '@/inventory/components/rental/ExtendButton'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface RentalDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function RentalDetailPage({ params }: RentalDetailPageProps) {
  const { id } = await params
  const result = await getRentalById(id)
  if (!result.success || !result.rental) notFound()

  const r = result.rental
  const isActive = r.status === 'rented' || r.status === 'overdue'

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex gap-4 py-2.5 border-b last:border-0">
      <dt className="w-32 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  )

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/rentals" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">대여 상세</h1>
      </div>

      <div className="bg-white border rounded-lg p-6 max-w-2xl mb-6">
        <dl>
          {row('기기명', r.inventory_name)}
          {row('모델', r.inventory_model)}
          {row('이용자', r.client_name)}
          {row('상태', <RentalStatusBadge status={r.status} />)}
          {row('대여 시작', r.rental_start_date)}
          {row('반납 기한', r.rental_end_date)}
          {row('실제 반납일', r.return_date)}
          {row('연장 횟수', `${r.extension_count ?? 0}회`)}
          {r.days_remaining !== undefined && r.status === 'rented' && row('남은 일수', `${r.days_remaining}일`)}
          {r.is_overdue && row('연체', <span className="text-red-600 font-medium">연체 {Math.abs(r.days_remaining ?? 0)}일</span>)}
        </dl>
      </div>

      {isActive && (
        <div className="flex gap-3">
          <ReturnButton rentalId={id} />
          <ExtendButton rentalId={id} currentEndDate={r.rental_end_date} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/inventory/components/rental/ apps/inventory/app/rentals/
git commit -m "feat(inventory): add rental list, detail, return, and extend pages"
```

---

## Task 7: Dashboard Page

**Files:**
- Modify: `apps/inventory/app/page.tsx`

- [ ] **Step 1: Update dashboard page**

```typescript
// apps/inventory/app/page.tsx
import { getInventoryList } from '@/actions/inventory-actions'
import { getOverdueRentals, getExpiringRentals, getRentals } from '@/actions/rental-actions'
import Link from 'next/link'
import { Package, ArrowLeftRight, AlertTriangle, Clock } from 'lucide-react'

export default async function InventoryDashboard() {
  const [inventoryResult, overdueResult, expiringResult, activeRentalsResult] = await Promise.all([
    getInventoryList({ limit: 1 }),
    getOverdueRentals(),
    getExpiringRentals(7),
    getRentals({ status: 'rented', limit: 1 }),
  ])

  const totalDevices = inventoryResult.success ? inventoryResult.total ?? 0 : 0
  const overdueCount = overdueResult.success ? (overdueResult.rentals ?? []).length : 0
  const expiringCount = expiringResult.success ? (expiringResult.rentals ?? []).length : 0
  const activeRentals = activeRentalsResult.success ? activeRentalsResult.total ?? 0 : 0

  const cards = [
    { label: '전체 기기', value: `${totalDevices}개`, href: '/devices', icon: Package, color: 'blue' },
    { label: '대여중', value: `${activeRentals}건`, href: '/rentals?status=rented', icon: ArrowLeftRight, color: 'green' },
    { label: '연체', value: `${overdueCount}건`, href: '/rentals?status=overdue', icon: AlertTriangle, color: 'red' },
    { label: '7일내 반납', value: `${expiringCount}건`, href: '/rentals?status=rented', icon: Clock, color: 'yellow' },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">자산/재고 대시보드</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {cards.map(({ label, value, href, icon: Icon, color }) => (
          <Link
            key={label}
            href={href}
            className="border rounded-lg p-5 bg-white hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${colorMap[color]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex gap-3">
        <Link
          href="/devices/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          기기 등록
        </Link>
        <Link
          href="/devices"
          className="px-4 py-2 border text-sm font-medium rounded-md hover:bg-gray-50"
        >
          기기 목록
        </Link>
        <Link
          href="/rentals"
          className="px-4 py-2 border text-sm font-medium rounded-md hover:bg-gray-50"
        >
          대여 관리
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/inventory/app/page.tsx
git commit -m "feat(inventory): update dashboard with inventory and rental summary"
```

---

## Task 8: TypeScript 검증

- [ ] **Step 1: TypeScript check apps/inventory**

```bash
npx tsc --noEmit --skipLibCheck -p apps/inventory/tsconfig.json 2>&1 | head -30
```

Expected: 에러 없음. 에러 발생 시 타입 오류를 수정한다.

- [ ] **Step 2: Final commit**

```bash
git add .
git commit -m "feat(inventory): phase 2 complete — device management, rental management"
```

---

## Checklist — Spec Coverage

| 스펙 항목 | 커버된 태스크 |
|---|---|
| 기기 등록/수정/삭제 | Task 5 |
| 바코드 스캔 조회 | Task 3 (BarcodeScanInput) + Task 4 (devices page) |
| 상태별 재고 현황 | Task 4, Task 7 |
| 대여·반납 처리 | Task 6 |
| 연장 처리 | Task 6 |
| 연체 조회 | Task 6, Task 7 |
| 재고 대시보드 | Task 7 |
