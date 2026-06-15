'use client'

import { useState, useTransition } from 'react'
import { BarcodeScanInput } from '@/inventory/components/inventory/BarcodeScanInput'
import {
  getActiveRentalByDeviceQr,
  type ActiveRentalInfo,
} from '@/inventory/actions/scan-match-actions'
import { returnRental } from '@/actions/rental-actions'
import { CheckCircle2, XCircle, Package, RotateCcw } from 'lucide-react'

type ScanStatus = 'idle' | 'found' | 'error'
type ReturnStatus = 'idle' | 'done' | 'error'

export function ScanReturnPage() {
  const [isPending, startTransition] = useTransition()

  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle')
  const [scanError, setScanError] = useState('')
  const [info, setInfo] = useState<ActiveRentalInfo | null>(null)

  const [returnStatus, setReturnStatus] = useState<ReturnStatus>('idle')
  const [returnError, setReturnError] = useState('')

  const handleScan = (value: string) => {
    setScanError('')
    setScanStatus('idle')
    setInfo(null)
    setReturnStatus('idle')
    setReturnError('')
    startTransition(async () => {
      const result = await getActiveRentalByDeviceQr(value)
      if (result.success && result.info) {
        setInfo(result.info)
        setScanStatus('found')
      } else {
        setScanError(result.error ?? '기기를 찾을 수 없습니다')
        setScanStatus('error')
      }
    })
  }

  const handleReturn = () => {
    if (!info) return
    setReturnError('')
    startTransition(async () => {
      const result = await returnRental(info.rentalId)
      if (result.success) {
        setReturnStatus('done')
      } else {
        setReturnStatus('error')
        setReturnError(result.error ?? '반납 처리에 실패했습니다')
      }
    })
  }

  const reset = () => {
    setScanStatus('idle')
    setScanError('')
    setInfo(null)
    setReturnStatus('idle')
    setReturnError('')
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">바코드 스캔 반납</h1>
        <p className="text-sm text-gray-500 mt-1">기기 QR/바코드를 스캔하면 대여 정보를 불러옵니다</p>
      </div>

      {returnStatus === 'done' && info ? (
        <div className="border border-green-200 rounded-lg p-6 bg-green-50 space-y-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
          <div>
            <p className="text-base font-semibold text-green-800">반납 완료</p>
            <p className="text-sm text-green-700 mt-1">
              {info.deviceName}
              {info.deviceModel ? ` (${info.deviceModel})` : ''} →{' '}
              <span className="font-medium">{info.clientName}</span> 반납 처리됨
            </p>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 mx-auto px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
          >
            <RotateCcw className="h-4 w-4" /> 다음 기기 스캔
          </button>
        </div>
      ) : (
        <>
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold">1</span>
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Package className="h-4 w-4" /> 반납할 기기 스캔
              </h2>
            </div>
            <BarcodeScanInput
              onScan={handleScan}
              placeholder="기기 QR 스캔 또는 바코드 입력"
            />
            {scanStatus === 'found' && info && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 border border-blue-200">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-800">{info.deviceName}{info.deviceModel ? ` (${info.deviceModel})` : ''}</p>
                  <p className="text-blue-700 text-xs">
                    대여자: {info.clientName} · 대여일: {info.rentalStartDate}
                  </p>
                </div>
              </div>
            )}
            {scanStatus === 'error' && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200">
                <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-700">{scanError}</p>
              </div>
            )}
          </div>

          {scanStatus === 'found' && info && (
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50 space-y-3">
              <p className="text-sm font-medium text-orange-800">
                <span className="font-semibold">{info.clientName}</span>의 기기를 반납 처리합니다
              </p>
              {returnStatus === 'error' && (
                <div className="flex items-center gap-2 p-2 rounded bg-red-50 border border-red-200">
                  <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{returnError}</p>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleReturn}
                  disabled={isPending}
                  className="flex-1 py-2 bg-orange-500 text-white text-sm font-medium rounded-md hover:bg-orange-600 disabled:opacity-60"
                >
                  {isPending ? '처리 중...' : '반납 처리'}
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2 border text-sm rounded-md hover:bg-white"
                >
                  초기화
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
