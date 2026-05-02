'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CallLog, CreateCallLogInput } from '@/actions/call-log-actions'

interface CallLogFormProps {
  defaultValues?: Partial<CallLog>
  onSubmit: (data: CreateCallLogInput) => Promise<{ success: boolean; error?: string }>
  submitLabel?: string
}

const REQUESTER_TYPES = [
  '장애 당사자', '보호자 및 지인', '유관기관 종사자',
  '시군구(및 읍면동) 담당자', '교육기관 종사자', '기타',
]

const Q_TYPES = [
  { key: 'q_public_benefit', label: '공적급여' },
  { key: 'q_private_benefit', label: '민간급여' },
  { key: 'q_device', label: '보조기기' },
  { key: 'q_case_management', label: '사례연계' },
  { key: 'q_other', label: '기타' },
] as const

export function CallLogForm({ defaultValues, onSubmit, submitLabel = '저장' }: CallLogFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qTypes, setQTypes] = useState({
    q_public_benefit: defaultValues?.q_public_benefit ?? false,
    q_private_benefit: defaultValues?.q_private_benefit ?? false,
    q_device: defaultValues?.q_device ?? false,
    q_case_management: defaultValues?.q_case_management ?? false,
    q_other: defaultValues?.q_other ?? false,
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)

    const data: CreateCallLogInput = {
      log_date: fd.get('log_date') as string,
      requester_type: (fd.get('requester_type') as string) || null,
      requester_region: (fd.get('requester_region') as string) || null,
      target_name: (fd.get('target_name') as string) || null,
      target_gender: (fd.get('target_gender') as string) || null,
      target_disability_type: (fd.get('target_disability_type') as string) || null,
      target_disability_severity: (fd.get('target_disability_severity') as string) || null,
      target_economic_status: (fd.get('target_economic_status') as string) || null,
      ...qTypes,
      question_content: (fd.get('question_content') as string) || null,
      answer: (fd.get('answer') as string) || null,
      staff_name: (fd.get('staff_name') as string) || null,
    }

    const result = await onSubmit(data)
    setLoading(false)
    if (!result.success) { setError(result.error ?? '저장 실패'); return }
    router.push('/call-logs')
    router.refresh()
  }

  const textField = (name: string, label: string, required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        name={name}
        type="text"
        defaultValue={(defaultValues as Record<string, unknown>)?.[name] as string ?? ''}
        required={required}
        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* 상담일 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          상담일 <span className="text-red-500">*</span>
        </label>
        <input
          name="log_date"
          type="date"
          defaultValue={defaultValues?.log_date ?? ''}
          required
          className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 의뢰인 정보 */}
      <fieldset className="border rounded-lg p-4 space-y-3">
        <legend className="text-sm font-semibold text-gray-700 px-1">의뢰인 정보</legend>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">의뢰인 유형</label>
          <select
            name="requester_type"
            defaultValue={defaultValues?.requester_type ?? ''}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
          >
            <option value="">선택</option>
            {REQUESTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {textField('requester_region', '지역 또는 소속')}
      </fieldset>

      {/* 대상자 정보 */}
      <fieldset className="border rounded-lg p-4 space-y-3">
        <legend className="text-sm font-semibold text-gray-700 px-1">대상자 정보</legend>
        <div className="grid grid-cols-2 gap-3">
          {textField('target_name', '성명')}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
            <select
              name="target_gender"
              defaultValue={defaultValues?.target_gender ?? ''}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
            >
              <option value="">선택</option>
              <option value="남">남</option>
              <option value="여">여</option>
            </select>
          </div>
        </div>
        {textField('target_disability_type', '장애유형')}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">장애정도</label>
          <select
            name="target_disability_severity"
            defaultValue={defaultValues?.target_disability_severity ?? ''}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
          >
            <option value="">선택</option>
            <option value="심한">심한</option>
            <option value="심하지 않은">심하지 않은</option>
          </select>
        </div>
        {textField('target_economic_status', '경제상황')}
      </fieldset>

      {/* 질문 유형 */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">질문 유형 (복수 선택 가능)</p>
        <div className="flex flex-wrap gap-3">
          {Q_TYPES.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={qTypes[key]}
                onChange={e => setQTypes(prev => ({ ...prev, [key]: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 질문내용 + 답변 */}
      {(['question_content', 'answer'] as const).map(field => (
        <div key={field}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field === 'question_content' ? '질문 내용' : '답변(조치사항)'}
          </label>
          <textarea
            name={field}
            rows={3}
            defaultValue={(defaultValues?.[field] as string) ?? ''}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      ))}

      {textField('staff_name', '상담자')}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '저장 중...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 border text-sm font-medium rounded-md hover:bg-gray-50"
        >
          취소
        </button>
      </div>
    </form>
  )
}
