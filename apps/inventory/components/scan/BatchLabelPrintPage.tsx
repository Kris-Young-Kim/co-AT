'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Printer, Square, CheckSquare, Loader2, AlertTriangle } from 'lucide-react'
import QRCode from 'qrcode'
import { getInventoryDevicesForLabels, type LabelDevice } from '@/inventory/actions/scan-labels-actions'
import { DeviceStatusBadge } from '@/inventory/components/inventory/DeviceStatusBadge'

const INVENTORY_BASE_URL = process.env.NEXT_PUBLIC_INVENTORY_URL ?? 'https://inventory.gwatc.cloud'

interface QrLabelProps {
  device: LabelDevice
  qrDataUrl: string
  failed: boolean
}

function QrLabel({ device, qrDataUrl, failed }: QrLabelProps) {
  return (
    <div className="w-48 p-3 border border-gray-300 text-center print:border-black">
      {qrDataUrl ? (
        <img src={qrDataUrl} width={160} height={160} alt="QR" className="mx-auto" />
      ) : failed ? (
        <div className="w-40 h-40 mx-auto bg-red-50 flex flex-col items-center justify-center gap-1 print:hidden">
          <AlertTriangle className="h-6 w-6 text-red-400" />
          <span className="text-xs text-red-500">생성 실패</span>
        </div>
      ) : (
        <div className="w-40 h-40 mx-auto bg-gray-100 flex items-center justify-center print:hidden">
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
  const [failedQr, setFailedQr] = useState<Set<string>>(new Set())
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
    const toGenerate = [...selected].filter((id) => !qrMap[id] && !failedQr.has(id))
    if (toGenerate.length === 0) return

    const deviceMap = Object.fromEntries(devices.map((d) => [d.id, d]))
    Promise.allSettled(
      toGenerate.map(async (id) => {
        const dev = deviceMap[id]
        if (!dev?.qr_token) throw new Error(id)
        const url = `${INVENTORY_BASE_URL}/scan/${dev.qr_token}`
        const dataUrl = await QRCode.toDataURL(url, { width: 160, errorCorrectionLevel: 'M' })
        return [id, dataUrl] as [string, string]
      })
    ).then((results) => {
      const succeeded: [string, string][] = []
      const failed: string[] = []
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          succeeded.push(r.value)
        } else {
          failed.push(toGenerate[i])
        }
      })
      if (succeeded.length > 0) {
        setQrMap((prev) => ({ ...prev, ...Object.fromEntries(succeeded) }))
      }
      if (failed.length > 0) {
        setFailedQr((prev) => new Set([...prev, ...failed]))
      }
    })
  }, [selected, devices, qrMap, failedQr])

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
  const pendingQrCount = selectedDevices.filter(
    (d) => !qrMap[d.id] && !failedQr.has(d.id)
  ).length
  const canPrint = selected.size > 0 && pendingQrCount === 0

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
            disabled={!canPrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pendingQrCount > 0 ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            {pendingQrCount > 0
              ? `QR 생성 중... (${pendingQrCount}개 남음)`
              : `라벨 인쇄 (${selected.size}개)`}
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

      {/* Failed QR warning — print:hidden */}
      {failedQr.size > 0 && (
        <div className="print:hidden max-w-5xl mx-auto px-4 pb-4">
          <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 border border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700">
              QR 코드 생성에 실패한 기기 {failedQr.size}개가 있습니다. 인쇄 목록에서 제외됩니다.
            </p>
          </div>
        </div>
      )}

      {/* Print output — hidden on screen, flex-wrap on print */}
      {selectedDevices.length > 0 && (
        <div className="hidden print:flex print:flex-wrap gap-4 p-8">
          {selectedDevices
            .filter((d) => qrMap[d.id])
            .map((device) => (
              <QrLabel
                key={device.id}
                device={device}
                qrDataUrl={qrMap[device.id]}
                failed={false}
              />
            ))}
        </div>
      )}
    </>
  )
}
