export const dynamic = 'force-dynamic'

import QRCode from 'qrcode'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { QrCode, User } from 'lucide-react'

interface Props {
  params: Promise<{ employeeId: string }>
}

export default async function EmployeeQrPage({ params }: Props) {
  const { employeeId } = await params
  const supabase = createSupabaseAdmin()

  const { data: emp } = await supabase
    .from('hr_employees')
    .select('name, department, position')
    .eq('id', employeeId)
    .single()

  // QR 코드에는 직원 ID만 인코딩 (스캔 페이지에서 처리)
  const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/attendance/scan?emp=${employeeId}`
  const qrDataUrl = await QRCode.toDataURL(scanUrl, {
    width: 300,
    margin: 2,
    color: { dark: '#1e1b4b', light: '#ffffff' },
  })

  return (
    <div className="p-8 flex flex-col items-center gap-6">
      <div className="flex items-center gap-2">
        <QrCode className="h-6 w-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900">QR 출퇴근 카드</h1>
      </div>

      <div className="bg-white border-2 border-violet-200 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-sm max-w-xs w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <User className="h-4 w-4 text-violet-600" />
            <span className="text-lg font-bold text-gray-900">{emp?.name ?? '—'}</span>
          </div>
          <p className="text-sm text-gray-500">{emp?.department} · {emp?.position}</p>
        </div>

        <p className="text-xs text-gray-400 text-center">
          QR코드를 스캔하면 자동으로 출·퇴근이 기록됩니다.
        </p>
      </div>

      <a
        href="/attendance/qr"
        className="text-sm text-violet-600 hover:underline"
      >
        ← 직원 목록으로
      </a>
    </div>
  )
}
