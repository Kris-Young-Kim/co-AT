'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDomainAssessment } from '@/actions/assessment-actions'
import type { AssessmentDomainType } from './DomainSelector'
import { DOMAIN_LABELS } from './DomainSelector'

interface DomainAssessmentFormProps {
  applicationId: string
  domain: AssessmentDomainType
  clientId: string
}

export function DomainAssessmentForm({ applicationId, domain, clientId }: DomainAssessmentFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const fd = new FormData(e.currentTarget)

    const result = await createDomainAssessment({
      application_id: applicationId,
      domain_type: domain,
      evaluation_date: fd.get('evaluation_date') as string,
      evaluator_opinion: (fd.get('evaluator_opinion') as string) || undefined,
      recommended_device: (fd.get('recommended_device') as string) || undefined,
      future_plan: (fd.get('future_plan') as string) || undefined,
    })

    if (!result.success) {
      setError(result.error ?? '저장에 실패했습니다')
      setIsSubmitting(false)
      return
    }

    setSaved(true)
    setIsSubmitting(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="border-b pb-3 mb-5">
        <h3 className="font-semibold text-gray-900">
          {domain} 영역 — {DOMAIN_LABELS[domain]} 평가
        </h3>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}
      {saved && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-700">저장되었습니다</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          평가일 <span className="text-red-500">*</span>
        </label>
        <input type="date" name="evaluation_date" required
          defaultValue={new Date().toISOString().split('T')[0]}
          className="border rounded-md px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">평가자 의견</label>
        <textarea name="evaluator_opinion" rows={4}
          placeholder={`${DOMAIN_LABELS[domain]} 영역에 대한 평가 의견을 입력하세요`}
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">추천 보조기기</label>
        <input type="text" name="recommended_device" placeholder="추천하는 보조기기명을 입력하세요"
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">향후 계획</label>
        <textarea name="future_plan" rows={3} placeholder="향후 서비스 계획을 입력하세요"
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
          취소
        </button>
        <button type="submit" disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {isSubmitting ? '저장 중...' : '평가 저장'}
        </button>
      </div>
    </form>
  )
}
