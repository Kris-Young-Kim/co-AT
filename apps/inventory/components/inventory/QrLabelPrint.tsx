'use client'

import { QRCodeSVG } from 'qrcode.react'

interface QrLabelPrintProps {
  qrToken: string
  deviceName: string
  assetCode?: string | null
}

export function QrLabelPrint({ qrToken, deviceName, assetCode }: QrLabelPrintProps) {
  const url = `${process.env.NEXT_PUBLIC_INVENTORY_URL ?? 'https://inventory.gwatc.cloud'}/scan/${qrToken}`

  return (
    <div>
      <div id="qr-label" className="hidden print:block p-4 border text-center w-48">
        <QRCodeSVG value={url} size={160} level="M" />
        <p className="mt-2 text-sm font-medium">{deviceName}</p>
        {assetCode && <p className="text-xs text-gray-500">{assetCode}</p>}
      </div>
      <button
        onClick={() => {
          const el = document.getElementById('qr-label')
          if (el) { el.style.display = 'block'; window.print(); el.style.display = 'none' }
        }}
        className="flex items-center gap-2 px-3 py-1.5 border text-sm font-medium rounded-md hover:bg-gray-50"
      >
        QR 라벨 인쇄
      </button>
    </div>
  )
}
