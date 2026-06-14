'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Printer, QrCode } from 'lucide-react'
import Link from 'next/link'

interface ClientQrLabelProps {
  clientId: string
  qrToken: string
  name: string
  birthDate?: string | null
}

export function ClientQrLabel({ clientId, qrToken, name, birthDate }: ClientQrLabelProps) {
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    QRCode.toDataURL(qrToken, { width: 96, errorCorrectionLevel: 'M' }).then(setQrDataUrl)
  }, [qrToken])

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
        <QrCode className="h-4 w-4" />
        대상자 QR 코드
      </h3>
      <div className="flex items-center gap-4">
        {qrDataUrl ? (
          <div className="border rounded p-1.5 bg-white shrink-0">
            <img src={qrDataUrl} width={80} height={80} alt="대상자 QR 코드" />
          </div>
        ) : (
          <div className="w-[96px] h-[96px] border rounded bg-gray-50 animate-pulse" />
        )}
        <div className="text-xs text-gray-500 space-y-1.5">
          <p className="text-gray-600 font-medium">보조기기 대여 시 스캔</p>
          <p>inventory 앱 &gt; 스캔 매칭에서 사용</p>
          <p className="font-mono text-gray-400 break-all text-[10px]">{qrToken}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Link
          href={`/print/client-label/${clientId}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 transition-colors"
        >
          <Printer className="h-3.5 w-3.5" />
          개별 라벨 인쇄
        </Link>
        <Link
          href="/print/client-labels"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 transition-colors text-gray-500"
        >
          일괄 라벨 인쇄
        </Link>
      </div>
    </div>
  )
}
