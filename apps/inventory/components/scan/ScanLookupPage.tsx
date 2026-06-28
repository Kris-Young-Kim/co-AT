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
