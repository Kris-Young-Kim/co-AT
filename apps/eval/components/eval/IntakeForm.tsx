'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createIntakeRecord } from '@/actions/intake-actions'
import { generateIntakeDraft } from '@/actions/ai-actions'

const INPUT_CLASS = 'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const SKELETON_CLASS = 'w-full rounded-md bg-gray-200 animate-pulse'

interface IntakeFormProps {
  clientId: string
  applicationId: string
}

export function IntakeForm({ clientId, applicationId }: IntakeFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [memo, setMemo] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const [consultationContent, setConsultationContent] = useState('')
  const [mainActivityPlace, setMainActivityPlace] = useState('')
  const [activityPosture, setActivityPosture] = useState('')
  const [mainSupporter, setMainSupporter] = useState('')
  const [environmentLimitations, setEnvironmentLimitations] = useState('')

  async function handleAiGenerate() {
    const hasExistingContent = [
      consultationContent, mainActivityPlace, activityPosture,
      mainSupporter, environmentLimitations,
    ].some(Boolean)

    if (hasExistingContent && !window.confirm('기존 내용이 덮어씌워집니다. 계속하시겠습니까?')) {
      return
    }

    setAiLoading(true)
    setAiError(null)
    try {
      const result = await generateIntakeDraft({ memo, applicationId, clientId })
      if (!result.success || !result.draft) {
        setAiError(result.error ?? 'AI 초안 생성에 실패했습니다')
        return
      }
      const { draft } = result
      setConsultationContent(draft.consultation_content)
      setMainActivityPlace(draft.main_activity_place)
      setActivityPosture(draft.activity_posture)
      setMainSupporter(draft.main_supporter)
      setEnvironmentLimitations(draft.environment_limitations)
    } catch {
      setAiError('AI 초안 생성에 실패했습니다')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const fd = new FormData(e.currentTarget)

    const result = await createIntakeRecord({
      application_id: applicationId,
      client_id: clientId,
      consult_date: fd.get('consult_date') as string,
      consultation_content: consultationContent || undefined,
      main_activity_place: mainActivityPlace || undefined,
      activity_posture: activityPosture || undefined,
      main_supporter: mainSupporter || undefined,
      environment_limitations: environmentLimitations || undefined,
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

      <section className="border rounded-lg p-6 bg-white space-y-3">
        <h3 className="font-semibold text-gray-900">AI 초안 생성</h3>
        <p className="text-xs text-gray-500">
          짧은 메모를 입력하면 AI가 아래 5개 필드의 초안을 자동으로 생성합니다.
        </p>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
          placeholder="예) 40대 남성, 지체장애 3급, 전동휠체어 사용 중. 자택 생활, 혼자 외출 가능."
          disabled={aiLoading}
          className={INPUT_CLASS}
        />
        {aiError && <p className="text-sm text-red-600">{aiError}</p>}
        <button
          type="button"
          onClick={handleAiGenerate}
          disabled={aiLoading || !memo.trim()}
          className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
        >
          {aiLoading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              생성 중...
            </>
          ) : (
            'AI 초안 생성'
          )}
        </button>
      </section>

      <section className="border rounded-lg p-6 bg-white">
        <h3 className="font-semibold text-gray-900 mb-4">상담 내용</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">상담 내용</label>
          {aiLoading ? (
            <div className={`${SKELETON_CLASS} h-24`} />
          ) : (
            <textarea
              value={consultationContent}
              onChange={(e) => setConsultationContent(e.target.value)}
              rows={5}
              placeholder="상담 내용을 입력하세요"
              className={INPUT_CLASS}
            />
          )}
        </div>
      </section>

      <section className="border rounded-lg p-6 bg-white">
        <h3 className="font-semibold text-gray-900 mb-4">활동 및 환경 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주 활동 장소</label>
            {aiLoading ? (
              <div className={`${SKELETON_CLASS} h-9`} />
            ) : (
              <input
                type="text"
                value={mainActivityPlace}
                onChange={(e) => setMainActivityPlace(e.target.value)}
                placeholder="예) 자택, 직장, 학교"
                className={INPUT_CLASS}
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주 활동 자세</label>
            {aiLoading ? (
              <div className={`${SKELETON_CLASS} h-9`} />
            ) : (
              <input
                type="text"
                value={activityPosture}
                onChange={(e) => setActivityPosture(e.target.value)}
                placeholder="예) 앉기, 서기, 눕기"
                className={INPUT_CLASS}
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주 부양자</label>
            {aiLoading ? (
              <div className={`${SKELETON_CLASS} h-9`} />
            ) : (
              <input
                type="text"
                value={mainSupporter}
                onChange={(e) => setMainSupporter(e.target.value)}
                placeholder="예) 배우자, 부모, 자녀"
                className={INPUT_CLASS}
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">환경적 제한 사항</label>
            {aiLoading ? (
              <div className={`${SKELETON_CLASS} h-9`} />
            ) : (
              <input
                type="text"
                value={environmentLimitations}
                onChange={(e) => setEnvironmentLimitations(e.target.value)}
                placeholder="예) 엘리베이터 없음, 문턱 있음"
                className={INPUT_CLASS}
              />
            )}
          </div>
        </div>
      </section>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}
