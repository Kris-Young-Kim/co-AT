'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BarcodeScanInput } from '@/inventory/components/inventory/BarcodeScanInput'
import {
  getClientByQrTokenForScan,
  getInventoryByQrOrBarcode,
  createRentalFromScan,
  type ScanMatchClient,
  type ScanMatchDevice,
} from '@/inventory/actions/scan-match-actions'
import { CheckCircle2, XCircle, User, Package, ArrowRight } from 'lucide-react'

type StepStatus = 'idle' | 'found' | 'error'

export function ScanMatchPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [client, setClient] = useState<ScanMatchClient | null>(null)
  const [clientStatus, setClientStatus] = useState<StepStatus>('idle')
  const [clientError, setClientError] = useState<string>('')

  const [device, setDevice] = useState<ScanMatchDevice | null>(null)
  const [deviceStatus, setDeviceStatus] = useState<StepStatus>('idle')
  const [deviceError, setDeviceError] = useState<string>('')

  const [rentalError, setRentalError] = useState<string>('')

  const handleClientScan = (value: string) => {
    setClientError('')
    setClientStatus('idle')
    setClient(null)
    startTransition(async () => {
      const result = await getClientByQrTokenForScan(value)
      if (result.success && result.client) {
        setClient(result.client)
        setClientStatus('found')
      } else {
        setClientError(result.error ?? '대상자를 찾을 수 없습니다')
        setClientStatus('error')
      }
    })
  }

  const handleDeviceScan = (value: string) => {
    setDeviceError('')
    setDeviceStatus('idle')
    setDevice(null)
    startTransition(async () => {
      const result = await getInventoryByQrOrBarcode(value)
      if (result.success && result.device) {
        setDevice(result.device)
        setDeviceStatus('found')
      } else {
        setDeviceError(result.error ?? '기기를 찾을 수 없습니다')
        setDeviceStatus('error')
      }
    })
  }

  const handleCreateRental = () => {
    if (!client || !device) return
    setRentalError('')
    startTransition(async () => {
      const result = await createRentalFromScan(client.id, device.id)
      if (result.success && result.rentalId) {
        router.push(`/rentals/${result.rentalId}`)
      } else {
        setRentalError(result.error ?? '대여 생성에 실패했습니다')
      }
    })
  }

  const reset = () => {
    setClient(null); setClientStatus('idle'); setClientError('')
    setDevice(null); setDeviceStatus('idle'); setDeviceError('')
    setRentalError('')
  }

  const canCreate = clientStatus === 'found' && deviceStatus === 'found'

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">바코드 스캔 대여</h1>
        <p className="text-sm text-gray-500 mt-1">대상자 QR → 기기 QR 순서로 스캔 후 대여를 생성합니다</p>
      </div>

      {/* Step 1 */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <User className="h-4 w-4" /> 대상자 QR 스캔
          </h2>
        </div>
        <BarcodeScanInput
          onScan={handleClientScan}
          placeholder="대상자 QR 스캔 또는 토큰 입력"
        />
        {clientStatus === 'found' && client && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-green-50 border border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-green-800">{client.name}</p>
              <p className="text-green-700 text-xs">
                {client.birth_date ?? '—'}
                {client.disability_type ? ` · ${client.disability_type}` : ''}
              </p>
            </div>
          </div>
        )}
        {clientStatus === 'error' && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200">
            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{clientError}</p>
          </div>
        )}
      </div>

      {/* Step 2 */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Package className="h-4 w-4" /> 기기 QR 스캔
          </h2>
        </div>
        <BarcodeScanInput
          onScan={handleDeviceScan}
          placeholder="기기 QR 스캔 또는 바코드 입력"
        />
        {deviceStatus === 'found' && device && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-green-50 border border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-green-800">{device.name}</p>
              {device.model && <p className="text-green-700 text-xs">{device.model}</p>}
            </div>
          </div>
        )}
        {deviceStatus === 'error' && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200">
            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{deviceError}</p>
          </div>
        )}
      </div>

      {/* Summary + Create */}
      {canCreate && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-3">
          <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
            <span>{client!.name}</span>
            <ArrowRight className="h-4 w-4" />
            <span>{device!.name}</span>
          </div>
          <p className="text-xs text-blue-600">대여 기간: 오늘부터 1개월 (이후 대여 상세에서 수정 가능)</p>
          {rentalError && (
            <div className="flex items-center gap-2 p-2 rounded bg-red-50 border border-red-200">
              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{rentalError}</p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleCreateRental}
              disabled={isPending}
              className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-60"
            >
              {isPending ? '처리 중...' : '대여 생성'}
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

      {!canCreate && (clientStatus === 'found' || deviceStatus === 'found') && (
        <button onClick={reset} className="text-sm text-gray-400 hover:text-gray-600">
          초기화
        </button>
      )}
    </div>
  )
}
