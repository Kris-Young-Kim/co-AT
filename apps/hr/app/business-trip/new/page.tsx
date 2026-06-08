'use client'

import { useState } from 'react'
import { createBusinessTrip } from '@/actions/business-trip-actions'
import { useRouter } from 'next/navigation'
import { Plane } from 'lucide-react'

export default function NewBusinessTripPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const start = fd.get('start_date') as string
    const end = fd.get('end_date') as string
    const startD = new Date(start)
    const endD = new Date(end)
    const days = Math.max(1, Math.floor((endD.getTime() - startD.getTime()) / 86400000) + 1)

    try {
      await createBusinessTrip({
        employee_id: fd.get('employee_id') as string,
        destination: fd.get('destination') as string,
        purpose: fd.get('purpose') as string,
        start_date: start,
        end_date: end,
        days,
        transport: fd.get('transport') as string || undefined,
        allowance: parseInt(fd.get('allowance') as string || '0'),
        note: fd.get('note') as string || undefined,
      })
      router.push('/business-trip')
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-xl space-y-6">
      <div className="flex items-center gap-2">
        <Plane className="h-6 w-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900">출장 신청</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">직원 ID</label>
          <input name="employee_id" required placeholder="직원 UUID"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          <p className="text-xs text-gray-400 mt-1">직원 정보 페이지에서 ID 확인 가능</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">목적지 *</label>
          <input name="destination" required placeholder="예: 서울 코엑스"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">출장 목적 *</label>
          <input name="purpose" required placeholder="예: 보조공학사 역량강화 교육 참석"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">출장 시작일 *</label>
            <input name="start_date" type="date" required
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">출장 종료일 *</label>
            <input name="end_date" type="date" required
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">교통수단</label>
          <select name="transport"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
            <option value="">선택 안 함</option>
            <option value="자가용">자가용</option>
            <option value="KTX">KTX</option>
            <option value="버스">버스</option>
            <option value="항공">항공</option>
            <option value="렌터카">렌터카</option>
            <option value="기타">기타</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">출장비 (원)</label>
          <input name="allowance" type="number" min="0" defaultValue="0"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
          <textarea name="note" rows={2} placeholder="추가 메모"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 py-2 bg-violet-600 text-white text-sm rounded-md hover:bg-violet-700 disabled:opacity-50">
            {loading ? '저장 중...' : '출장 신청'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-2 border text-sm rounded-md hover:bg-gray-50">
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
