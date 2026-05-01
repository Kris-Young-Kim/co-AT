'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createIntakeRecord } from '@/actions/intake-actions'

interface IntakeFormProps {
  clientId: string
  applicationId: string
}

export function IntakeForm({ clientId, applicationId }: IntakeFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const fd = new FormData(e.currentTarget)

    const result = await createIntakeRecord({
      application_id: applicationId,
      client_id: clientId,
      consult_date: fd.get('consult_date') as string,
      consultation_content: (fd.get('consultation_content') as string) || undefined,
      main_activity_place: (fd.get('main_activity_place') as string) || undefined,
      activity_posture: (fd.get('activity_posture') as string) || undefined,
      main_supporter: (fd.get('main_supporter') as string) || undefined,
      environment_limitations: (fd.get('environment_limitations') as string) || undefined,
    })

    if (!result.success) {
      setError(result.error ?? '저장에 실패했습니다')
      setIsSubmitting(false)
      return
    }

    router.push(`/clients/${clientId}/applications/${applicationId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="border rounded-lg p-6 bg-white">
        <h3 className="font-semibold text-gray-900 mb-4">기본 정보</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            상담일 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="consult_date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="border rounded-md px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </section>

      <section className="border rounded-lg p-6 bg-white">
        <h3 className="font-semibold text-gray-900 mb-4">상담 내용</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">상담 내용</label>
          <textarea
            name="consultation_content"
            rows={5}
            placeholder="상담 내용을 입력하세요"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </section>

      <section className="border rounded-lg p-6 bg-white">
        <h3 className="font-semibold text-gray-900 mb-4">활동 및 환경 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주 활동 장소</label>
            <input type="text" name="main_activity_place" placeholder="예) 자택, 직장, 학교"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주 활동 자세</label>
            <input type="text" name="activity_posture" placeholder="예) 앉기, 서기, 눕기"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주 부양자</label>
            <input type="text" name="main_supporter" placeholder="예) 배우자, 부모, 자녀"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">환경적 제한 사항</label>
            <input type="text" name="environment_limitations" placeholder="예) 엘리베이터 없음, 문턱 있음"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </section>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
          취소
        </button>
        <button type="submit" disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {isSubmitting ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}
