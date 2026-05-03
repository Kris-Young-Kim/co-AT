'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AnnualTarget, UpsertTargetInput } from '@/actions/annual-target-actions'

interface TargetFormProps {
  year: number
  defaultValues?: AnnualTarget | null
  onSubmit: (data: UpsertTargetInput) => Promise<{ success: boolean; error?: string }>
}

const FIELDS: { key: keyof UpsertTargetInput; label: string }[] = [
  { key: 'consultation', label: '보조기기 상담(연인원)' },
  { key: 'experience', label: '보조기기 사용 체험' },
  { key: 'rental', label: '대여' },
  { key: 'custom_make', label: '보조기기 맞춤 제작 지원' },
  { key: 'cleaning', label: '보조기기 소독 및 세척' },
  { key: 'repair', label: '보조기기 점검 및 수리' },
  { key: 'reuse', label: '보조기기 재사용 지원' },
  { key: 'professional_edu', label: '전문인력 교육 등' },
  { key: 'promotion', label: '홍보' },
]

export function TargetForm({ year, defaultValues, onSubmit }: TargetFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const data: UpsertTargetInput = { year } as UpsertTargetInput
    for (const { key } of FIELDS) {
      (data as unknown as Record<string, unknown>)[key] = parseInt(fd.get(key) as string) || 0
    }
    const result = await onSubmit(data)
    setLoading(false)
    if (!result.success) { setError(result.error ?? '저장 실패'); return }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
      <p className="text-sm text-gray-500 mb-4">콜센터·교부사업 맞춤형 평가지원은 '상시' 항목으로 목표 없음</p>
      {FIELDS.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-4">
          <label className="w-52 shrink-0 text-sm text-gray-700">{label}</label>
          <input
            name={key}
            type="number"
            min={0}
            defaultValue={(defaultValues as unknown as Record<string, unknown>)?.[key] as number ?? 0}
            className="w-28 px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-400">건</span>
        </div>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '저장 중...' : '목표 저장'}
      </button>
    </form>
  )
}
