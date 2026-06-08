'use client'

import { useState, useEffect } from 'react'
import { createDailyAbsence } from '@/actions/daily-absence-actions'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import type { DailyAbsenceType } from '@co-at/types'

const TYPE_OPTIONS: { value: DailyAbsenceType; label: string; desc: string }[] = [
  { value: 'outing',  label: '외출',     desc: '근무 중 외출 (30분 단위)' },
  { value: 'half_am', label: '오전반차', desc: '09:00~14:00 (0.5일 사용)' },
  { value: 'half_pm', label: '오후반차', desc: '14:00~18:00 (0.5일 사용)' },
  { value: 'late',    label: '지참',     desc: '지연 출근 (30분 단위)' },
]

// 30분 단위 옵션 생성 (30분 ~ 8시간)
const DURATION_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const min = (i + 1) * 30
  const h = Math.floor(min / 60)
  const m = min % 60
  const label = h > 0 ? (m > 0 ? `${h}시간 ${m}분` : `${h}시간`) : `${m}분`
  return { value: min, label }
})

export default function NewAbsencePage() {
  const router = useRouter()
  const [type, setType] = useState<DailyAbsenceType>('outing')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isHalfDay = type === 'half_am' || type === 'half_pm'
  const needsTime = type === 'outing' || type === 'late'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const duration = isHalfDay
      ? (type === 'half_am' ? 300 : 240)
      : parseInt(fd.get('duration_minutes') as string || '30')

    try {
      await createDailyAbsence({
        employee_id: fd.get('employee_id') as string,
        date: fd.get('date') as string,
        type,
        start_time: fd.get('start_time') as string || undefined,
        end_time: fd.get('end_time') as string || undefined,
        duration_minutes: duration,
        reason: fd.get('reason') as string || undefined,
      })
      router.push('/attendance/absences')
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-xl space-y-6">
      <div className="flex items-center gap-2">
        <LogOut className="h-6 w-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900">부재 신청</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-5">

        {/* 유형 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">유형 *</label>
          <div className="grid grid-cols-2 gap-2">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`px-3 py-2.5 border rounded-lg text-left transition-all ${
                  type === opt.value
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <p className="font-medium text-sm">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">직원 ID *</label>
          <input name="employee_id" required placeholder="직원 UUID"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          <p className="text-xs text-gray-400 mt-1">직원 정보 페이지에서 ID를 확인하세요</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">날짜 *</label>
          <input name="date" type="date" required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>

        {/* 반차: 시간 고정 표시 */}
        {isHalfDay && (
          <div className="bg-violet-50 rounded-lg px-4 py-3 text-sm text-violet-700">
            {type === 'half_am'
              ? '오전반차: 09:00 ~ 14:00 (0.5일)'
              : '오후반차: 14:00 ~ 18:00 (0.5일)'}
          </div>
        )}

        {/* 외출/지참: 시간 입력 */}
        {needsTime && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type === 'outing' ? '외출 시각' : '지참 시각'} *
              </label>
              <input name="start_time" type="time" required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
            {type === 'outing' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">복귀 시각</label>
                <input name="end_time" type="time"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
            )}
          </div>
        )}

        {/* 외출/지참: 소요 시간 */}
        {needsTime && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              소요 시간 * (30분 단위)
            </label>
            <select name="duration_minutes" required
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
              {DURATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">사유</label>
          <textarea name="reason" rows={2} placeholder="외출/지참 사유를 입력하세요"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 py-2 bg-violet-600 text-white text-sm rounded-md hover:bg-violet-700 disabled:opacity-50">
            {loading ? '저장 중...' : '신청 등록'}
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
