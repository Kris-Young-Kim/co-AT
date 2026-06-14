'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface LabelClient {
  id: string
  name: string
  birth_date: string | null
  registration_number: string | null
  qr_token: string
}

interface Props {
  clients: LabelClient[]
}

function ClientLabel({ client }: { client: LabelClient }) {
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    QRCode.toDataURL(client.qr_token, { width: 120, errorCorrectionLevel: 'M' }).then(setQrDataUrl)
  }, [client.qr_token])

  return (
    <div className="border border-gray-300 p-3 text-center flex flex-col items-center gap-1 w-[160px] h-[200px] justify-center">
      {qrDataUrl ? (
        <img src={qrDataUrl} width={110} height={110} alt="QR" />
      ) : (
        <div className="w-[110px] h-[110px] bg-gray-100" />
      )}
      <p className="text-sm font-bold text-gray-900 leading-tight">{client.name}</p>
      {client.birth_date && (
        <p className="text-xs text-gray-500">{client.birth_date}</p>
      )}
      {client.registration_number && (
        <p className="text-[10px] text-gray-400 font-mono">{client.registration_number}</p>
      )}
    </div>
  )
}

export function ClientLabelView({ clients }: Props) {
  return (
    <div className="p-8 print:p-4">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 10mm; size: A4; }
        }
      `}</style>
      <div className="grid grid-cols-3 gap-4 print:gap-3">
        {clients.map(client => (
          <ClientLabel key={client.id} client={client} />
        ))}
      </div>
    </div>
  )
}
