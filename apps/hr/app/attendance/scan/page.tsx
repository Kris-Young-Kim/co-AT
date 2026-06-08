'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { processQrScan, type QrScanResult } from '@/actions/qr-attendance-actions'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Suspense } from 'react'

function ScanContent() {
  const searchParams = useSearchParams()
  const empId = searchParams.get('emp')
  const [result, setResult] = useState<QrScanResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empId) {
      setLoading(false)
      return
    }
    processQrScan(empId)
      .then(r => setResult(r))
      .catch(() => setResult({
        success: false,
        action: 'check_in',
        employee_name: '—',
        time: '',
        message: '처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
      }))
      .finally(() => setLoading(false))
  }, [empId])

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <Loader2 className="h-12 w-12 text-violet-500 animate-spin" />
        <p className="text-gray-600">처리 중...</p>
      </div>
    )
  }

  if (!empId) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <XCircle className="h-16 w-16 text-red-400" />
        <p className="text-lg font-semibold text-red-600">잘못된 QR 코드입니다.</p>
        <a href="/attendance/qr" className="text-sm text-violet-600 hover:underline">
          QR 목록으로 돌아가기
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 py-16 max-w-sm mx-auto text-center">
      {result?.success ? (
        <CheckCircle className="h-20 w-20 text-green-500" />
      ) : (
        <XCircle className="h-20 w-20 text-amber-400" />
      )}

      <div>
        <p className="text-2xl font-bold text-gray-900 mb-1">{result?.employee_name}</p>
        <p className={`text-lg font-semibold ${result?.success ? 'text-green-600' : 'text-amber-600'}`}>
          {result?.action === 'check_in' && result.success && '출근 완료'}
          {result?.action === 'check_out' && result.success && '퇴근 완료'}
          {result?.action === 'already_complete' && '출퇴근 완료'}
          {!result?.success && result?.action !== 'already_complete' && '처리 실패'}
        </p>
        <p className="text-gray-500 text-sm mt-2">{result?.message}</p>
      </div>

      <p className="text-xs text-gray-400">{new Date().toLocaleString('ko-KR')}</p>

      <a
        href="/attendance/scan"
        className="mt-4 px-6 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700"
      >
        닫기
      </a>
    </div>
  )
}

export default function ScanPage() {
  return (
    <div className="p-8">
      <Suspense fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-12 w-12 text-violet-500 animate-spin" />
        </div>
      }>
        <ScanContent />
      </Suspense>
    </div>
  )
}
