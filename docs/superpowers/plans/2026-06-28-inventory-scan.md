# Inventory Scan 기능 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** inventory 앱에 스캔 조회(`/scan/lookup`)와 일괄 QR 라벨 인쇄(`/scan/labels`) 기능을 추가한다.

**Architecture:** 기존 `scan-match-actions.ts`의 `extractQrToken()` 패턴을 재사용하여 스캔 조회 액션을 구현하고, 별도 `scan-labels-actions.ts`를 만들어 기기 목록을 가져온다. 두 기능 모두 기존 `BarcodeScanInput`과 `qrcode` 라이브러리를 사용하는 클라이언트 컴포넌트로 구성한다.

**Tech Stack:** Next.js 15 App Router, Supabase (`createAdminClient`), TypeScript strict, Tailwind (print: variants), `qrcode` (already installed), Clerk (`hasAdminOrStaffPermission`), lucide-react

---

### Task 1: getDeviceByScanValue 서버 액션 추가

**Files:**
- Modify: `apps/inventory/actions/scan-match-actions.ts`

- [ ] **Step 1: DeviceLookupResult 인터페이스 + getDeviceByScanValue 함수 추가**

`apps/inventory/actions/scan-match-actions.ts` 파일 끝에 다음 코드를 추가한다 (`createRentalFromScan` 함수 뒤):

```ts
export interface DeviceLookupResult {
  id: string
  name: string
  model: string | null
  status: string
  is_rental_available: boolean
  qr_token: string | null
  barcode: string | null
  asset_code: string | null
  category: string | null
  activeRental: {
    rentalId: string
    clientName: string
    rentalStartDate: string
  } | null
}

export async function getDeviceByScanValue(value: string): Promise<{
  success: boolean
  device?: DeviceLookupResult
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const supabase = createAdminClient()
    const token = extractQrToken(value)

    const { data: byQr } = await supabase
      .from('inventory')
      .select('id, name, model, status, is_rental_available, qr_token, barcode, asset_code, category')
      .eq('qr_token', token)
      .single()

    const { data: byBarcode } = byQr
      ? { data: null }
      : await supabase
          .from('inventory')
          .select('id, name, model, status, is_rental_available, qr_token, barcode, asset_code, category')
          .eq('barcode', value.trim())
          .single()

    const raw = (byQr ?? byBarcode) as Omit<DeviceLookupResult, 'activeRental'> | null
    if (!raw) return { success: false, error: '기기 QR/바코드를 찾을 수 없습니다' }

    const { data: rental } = await supabase
      .from('rentals')
      .select('id, rental_start_date, client_id')
      .eq('inventory_id', raw.id)
      .in('status', ['rented', 'overdue'])
      .order('rental_start_date', { ascending: false })
      .limit(1)
      .single()

    let activeRental: DeviceLookupResult['activeRental'] = null
    if (rental) {
      const r = rental as { id: string; rental_start_date: string; client_id: string }
      const { data: client } = await supabase
        .from('clients')
        .select('name')
        .eq('id', r.client_id)
        .single()
      activeRental = {
        rentalId: r.id,
        clientName: (client as { name: string } | null)?.name ?? '알 수 없음',
        rentalStartDate: r.rental_start_date,
      }
    }

    return { success: true, device: { ...raw, activeRental } }
  } catch {
    return { success: false, error: '오류가 발생했습니다' }
  }
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd D:\AILeader1\project\valuewith\co-AT
pnpm --filter inventory exec tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add apps/inventory/actions/scan-match-actions.ts
git commit -m "feat(inventory/scan): add DeviceLookupResult and getDeviceByScanValue action"
```

---

### Task 2: 스캔 조회 페이지 (/scan/lookup)

**Files:**
- Create: `apps/inventory/components/scan/ScanLookupPage.tsx`
- Create: `apps/inventory/app/scan/lookup/page.tsx`

- [ ] **Step 1: ScanLookupPage 클라이언트 컴포넌트 작성**

파일 생성: `apps/inventory/components/scan/ScanLookupPage.tsx`

```tsx
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, XCircle, Package, User, Calendar,
  ArrowLeftRight, PackageCheck, AlertCircle,
} from 'lucide-react'
import { BarcodeScanInput } from '@/inventory/components/inventory/BarcodeScanInput'
import {
  getDeviceByScanValue,
  type DeviceLookupResult,
} from '@/inventory/actions/scan-match-actions'
import { DeviceStatusBadge } from '@/inventory/components/inventory/DeviceStatusBadge'

export function ScanLookupPage() {
  const [isPending, startTransition] = useTransition()
  const [device, setDevice] = useState<DeviceLookupResult | null>(null)
  const [error, setError] = useState<string>('')

  const handleScan = (value: string) => {
    setError('')
    setDevice(null)
    startTransition(async () => {
      const result = await getDeviceByScanValue(value)
      if (result.success && result.device) {
        setDevice(result.device)
      } else {
        setError(result.error ?? '기기를 찾을 수 없습니다')
      }
    })
  }

  const reset = () => {
    setDevice(null)
    setError('')
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">스캔 조회</h1>
        <p className="text-sm text-gray-500 mt-1">
          기기 QR 또는 바코드를 스캔하면 현재 상태를 확인합니다
        </p>
      </div>

      <BarcodeScanInput
        onScan={handleScan}
        placeholder="기기 QR 스캔 또는 바코드 입력"
      />

      {isPending && (
        <p className="text-sm text-gray-400 animate-pulse">조회 중...</p>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200">
          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {device && (
        <div className="border rounded-lg divide-y">
          {/* Device info */}
          <div className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">{device.name}</p>
                  {device.model && (
                    <p className="text-xs text-gray-500">{device.model}</p>
                  )}
                </div>
              </div>
              <DeviceStatusBadge status={device.status} />
            </div>
            {device.asset_code && (
              <p className="text-xs text-gray-400 pl-6">자산번호: {device.asset_code}</p>
            )}
            {device.category && (
              <p className="text-xs text-gray-400 pl-6">분류: {device.category}</p>
            )}
          </div>

          {/* Rental status */}
          {device.activeRental ? (
            <div className="p-4 space-y-2 bg-amber-50">
              <div className="flex items-center gap-2 text-amber-700 text-sm font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                현재 대여 중
              </div>
              <div className="text-sm space-y-1 pl-6">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <User className="h-3.5 w-3.5" />
                  {device.activeRental.clientName}
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Calendar className="h-3.5 w-3.5" />
                  {device.activeRental.rentalStartDate} 대여 시작
                </div>
                <Link
                  href={`/rentals/${device.activeRental.rentalId}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  대여 상세 보기 →
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                현재 대여 중이 아닙니다
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="p-4 flex flex-wrap gap-2">
            {device.is_rental_available && device.status === '보관' && (
              <Link
                href="/scan/match"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <ArrowLeftRight className="h-4 w-4" />
                대여 스캔으로 이동
              </Link>
            )}
            {device.activeRental && (
              <Link
                href="/scan/return"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 transition-colors"
              >
                <PackageCheck className="h-4 w-4" />
                반납 스캔으로 이동
              </Link>
            )}
            <button
              onClick={reset}
              className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              다시 스캔
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 라우트 페이지 작성**

파일 생성: `apps/inventory/app/scan/lookup/page.tsx`

```tsx
import { ScanLookupPage } from '@/inventory/components/scan/ScanLookupPage'

export default function ScanLookupRoute() {
  return <ScanLookupPage />
}
```

- [ ] **Step 3: 타입 체크**

```bash
pnpm --filter inventory exec tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add apps/inventory/components/scan/ScanLookupPage.tsx apps/inventory/app/scan/lookup/page.tsx
git commit -m "feat(inventory/scan): add scan lookup page (/scan/lookup)"
```

---

### Task 3: 일괄 QR 라벨 인쇄 (/scan/labels)

**Files:**
- Create: `apps/inventory/actions/scan-labels-actions.ts`
- Create: `apps/inventory/components/scan/BatchLabelPrintPage.tsx`
- Create: `apps/inventory/app/scan/labels/page.tsx`

- [ ] **Step 1: 라벨 인쇄용 서버 액션 작성**

파일 생성: `apps/inventory/actions/scan-labels-actions.ts`

```ts
"use server"

import { createAdminClient } from '@/lib/supabase/admin'
import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'

export interface LabelDevice {
  id: string
  name: string
  model: string | null
  qr_token: string
  asset_code: string | null
  status: string
}

export async function getInventoryDevicesForLabels(): Promise<{
  success: boolean
  devices?: LabelDevice[]
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('inventory')
    .select('id, name, model, qr_token, asset_code, status')
    .not('qr_token', 'is', null)
    .order('name')

  if (error) return { success: false, error: error.message }

  return { success: true, devices: (data ?? []) as LabelDevice[] }
}
```

- [ ] **Step 2: BatchLabelPrintPage 컴포넌트 작성**

파일 생성: `apps/inventory/components/scan/BatchLabelPrintPage.tsx`

```tsx
'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Printer, Square, CheckSquare, Loader2 } from 'lucide-react'
import QRCode from 'qrcode'
import { getInventoryDevicesForLabels, type LabelDevice } from '@/inventory/actions/scan-labels-actions'
import { DeviceStatusBadge } from '@/inventory/components/inventory/DeviceStatusBadge'

const INVENTORY_BASE_URL = process.env.NEXT_PUBLIC_INVENTORY_URL ?? 'https://inventory.gwatc.cloud'

interface QrLabelProps {
  device: LabelDevice
  qrDataUrl: string
}

function QrLabel({ device, qrDataUrl }: QrLabelProps) {
  return (
    <div className="w-48 p-3 border border-gray-300 text-center print:border-black">
      {qrDataUrl ? (
        <img src={qrDataUrl} width={160} height={160} alt="QR" className="mx-auto" />
      ) : (
        <div className="w-40 h-40 mx-auto bg-gray-100 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}
      <p className="mt-2 text-xs font-semibold text-gray-900 leading-snug">{device.name}</p>
      {device.asset_code && (
        <p className="text-xs text-gray-500">{device.asset_code}</p>
      )}
    </div>
  )
}

export function BatchLabelPrintPage() {
  const [isPending, startTransition] = useTransition()
  const [devices, setDevices] = useState<LabelDevice[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [qrMap, setQrMap] = useState<Record<string, string>>({})
  const [error, setError] = useState<string>('')
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    startTransition(async () => {
      const result = await getInventoryDevicesForLabels()
      if (result.success && result.devices) {
        setDevices(result.devices)
      } else {
        setError(result.error ?? '기기 목록을 불러올 수 없습니다')
      }
    })
  }, [])

  // Generate QR data URLs for newly selected devices
  useEffect(() => {
    const toGenerate = [...selected].filter((id) => !qrMap[id])
    if (toGenerate.length === 0) return

    const deviceMap = Object.fromEntries(devices.map((d) => [d.id, d]))
    Promise.all(
      toGenerate.map(async (id) => {
        const dev = deviceMap[id]
        if (!dev) return [id, ''] as [string, string]
        const url = `${INVENTORY_BASE_URL}/scan/${dev.qr_token}`
        const dataUrl = await QRCode.toDataURL(url, { width: 160, errorCorrectionLevel: 'M' })
        return [id, dataUrl] as [string, string]
      })
    ).then((entries) => {
      setQrMap((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
    })
  }, [selected, devices, qrMap])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(devices.map((d) => d.id)))
  const clearAll = () => setSelected(new Set())

  const selectedDevices = devices.filter((d) => selected.has(d.id))
  const allChecked = devices.length > 0 && selected.size === devices.length

  return (
    <>
      {/* Selection UI — hidden on print */}
      <div className="print:hidden max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">QR 라벨 인쇄</h1>
            <p className="text-sm text-gray-500 mt-1">
              인쇄할 기기를 선택한 후 인쇄 버튼을 누르세요
            </p>
          </div>
          <button
            onClick={() => window.print()}
            disabled={selected.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Printer className="h-4 w-4" />
            라벨 인쇄 ({selected.size}개)
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {isPending && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            기기 목록 로딩 중...
          </div>
        )}

        {!isPending && devices.length > 0 && (
          <>
            <div className="flex items-center gap-3 text-sm">
              <button onClick={selectAll} className="text-blue-600 hover:underline">
                전체 선택 ({devices.length}개)
              </button>
              <span className="text-gray-300">|</span>
              <button onClick={clearAll} className="text-gray-500 hover:underline">
                선택 해제
              </button>
              <span className="ml-auto text-gray-400">{selected.size}개 선택됨</span>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="py-2 px-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={(e) => (e.target.checked ? selectAll() : clearAll())}
                        className="rounded"
                      />
                    </th>
                    <th className="py-2 px-3 text-left font-medium text-gray-600">기기명</th>
                    <th className="py-2 px-3 text-left font-medium text-gray-600">자산번호</th>
                    <th className="py-2 px-3 text-left font-medium text-gray-600">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {devices.map((device) => (
                    <tr
                      key={device.id}
                      onClick={() => toggleSelect(device.id)}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        selected.has(device.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="py-2 px-3">
                        {selected.has(device.id) ? (
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <p className="font-medium text-gray-900">{device.name}</p>
                        {device.model && <p className="text-xs text-gray-500">{device.model}</p>}
                      </td>
                      <td className="py-2 px-3 text-gray-600">{device.asset_code ?? '—'}</td>
                      <td className="py-2 px-3">
                        <DeviceStatusBadge status={device.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Print output — hidden on screen, flex-wrap on print */}
      {selectedDevices.length > 0 && (
        <div className="hidden print:flex print:flex-wrap gap-4 p-8">
          {selectedDevices.map((device) => (
            <QrLabel key={device.id} device={device} qrDataUrl={qrMap[device.id] ?? ''} />
          ))}
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: 라우트 페이지 작성**

파일 생성: `apps/inventory/app/scan/labels/page.tsx`

```tsx
import { BatchLabelPrintPage } from '@/inventory/components/scan/BatchLabelPrintPage'

export default function ScanLabelsRoute() {
  return <BatchLabelPrintPage />
}
```

- [ ] **Step 4: 타입 체크**

```bash
pnpm --filter inventory exec tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 5: Commit**

```bash
git add apps/inventory/actions/scan-labels-actions.ts apps/inventory/components/scan/BatchLabelPrintPage.tsx apps/inventory/app/scan/labels/page.tsx
git commit -m "feat(inventory/scan): add batch QR label print page (/scan/labels)"
```

---

### Task 4: InventorySidebar 메뉴 항목 추가

**Files:**
- Modify: `apps/inventory/components/layout/InventorySidebar.tsx`

- [ ] **Step 1: Search, Tag 아이콘 import 추가**

`apps/inventory/components/layout/InventorySidebar.tsx` 의 import 라인을 수정한다.

기존:
```tsx
import {
  LayoutDashboard, Package, ArrowLeftRight, Wrench,
  RefreshCw, Cpu, Settings, FileBarChart, Map, Droplets, ScanLine, PackageCheck, Menu,
} from 'lucide-react'
```

신규:
```tsx
import {
  LayoutDashboard, Package, ArrowLeftRight, Wrench,
  RefreshCw, Cpu, Settings, FileBarChart, Map, Droplets, ScanLine, PackageCheck, Menu,
  Search, Tag,
} from 'lucide-react'
```

- [ ] **Step 2: NAV_ENTRIES에 새 항목 추가**

기존 (`/scan/return` 항목 바로 뒤에 두 줄 추가):
```tsx
  { type: 'item', href: '/scan/match', label: '스캔 대여', icon: ScanLine },
  { type: 'item', href: '/scan/return', label: '스캔 반납', icon: PackageCheck },
  { type: 'item', href: '/reuse', label: '재사용', icon: RefreshCw },
```

신규:
```tsx
  { type: 'item', href: '/scan/match', label: '스캔 대여', icon: ScanLine },
  { type: 'item', href: '/scan/return', label: '스캔 반납', icon: PackageCheck },
  { type: 'item', href: '/scan/lookup', label: '스캔 조회', icon: Search },
  { type: 'item', href: '/scan/labels', label: 'QR 라벨 인쇄', icon: Tag },
  { type: 'item', href: '/reuse', label: '재사용', icon: RefreshCw },
```

- [ ] **Step 3: 타입 체크**

```bash
pnpm --filter inventory exec tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add apps/inventory/components/layout/InventorySidebar.tsx
git commit -m "feat(inventory/scan): add scan lookup and QR label print to sidebar"
```
