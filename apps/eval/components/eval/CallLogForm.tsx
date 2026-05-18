'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, MicOff, Sparkles } from 'lucide-react'
import type { CallLog, CreateCallLogInput } from '@/actions/call-log-actions'
import { generateCallLogAnswer } from '@/actions/ai-actions'

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

type VoiceField = 'question_content' | 'answer'

interface SpeechRecognitionAPI {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionAPIEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
interface SpeechRecognitionAPIEvent {
  resultIndex: number
  results: SpeechRecognitionAPIResultList
}
interface SpeechRecognitionAPIResultList {
  length: number
  [index: number]: { isFinal: boolean; [index: number]: { transcript: string } }
}

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

  const [questionContent, setQuestionContent] = useState<string>(
    (defaultValues?.question_content as string) ?? ''
  )
  const [answerContent, setAnswerContent] = useState<string>(
    (defaultValues?.answer as string) ?? ''
  )
  const [recording, setRecording] = useState<VoiceField | null>(null)
  const recognitionRef = useRef<SpeechRecognitionAPI | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  function toggleRecording(field: VoiceField) {
    if (recording === field) {
      recognitionRef.current?.stop()
      recognitionRef.current = null
      setRecording(null)
      return
    }

    recognitionRef.current?.stop()
    recognitionRef.current = null

    type SpeechRecognitionCtor = new () => SpeechRecognitionAPI
    const win = window as Window & { webkitSpeechRecognition?: SpeechRecognitionCtor; SpeechRecognition?: SpeechRecognitionCtor }
    const SpeechRecognitionImpl = win.webkitSpeechRecognition ?? win.SpeechRecognition

    if (!SpeechRecognitionImpl) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 사용해 주세요.')
      return
    }

    const rec = new SpeechRecognitionImpl()
    rec.lang = 'ko-KR'
    rec.continuous = true
    rec.interimResults = false

    rec.onresult = (event: SpeechRecognitionAPIEvent) => {
      const results = Array.from({ length: event.results.length }, (_, i) => event.results[i])
      const transcript = results
        .slice(event.resultIndex)
        .filter(r => r.isFinal)
        .map(r => r[0].transcript)
        .join('')
      if (!transcript) return
      const setter = field === 'question_content' ? setQuestionContent : setAnswerContent
      setter(prev => prev ? `${prev} ${transcript}` : transcript)
    }

    rec.onerror = () => {
      recognitionRef.current = null
      setRecording(null)
    }

    rec.onend = () => {
      recognitionRef.current = null
      setRecording(prev => prev === field ? null : prev)
    }

    recognitionRef.current = rec
    rec.start()
    setRecording(field)
  }

  async function handleAiAnswer() {
    setAiLoading(true)
    setAiError(null)
    const activeQuestionTypes = Q_TYPES.filter(q => qTypes[q.key]).map(q => q.label)
    const result = await generateCallLogAnswer({
      questionContent: questionContent,
      requesterType: null,
      disabilityType: null,
      activeQuestionTypes,
    })
    setAiLoading(false)
    if (!result.success || !result.answer) {
      setAiError(result.error ?? 'AI 답변 생성에 실패했습니다')
      return
    }
    setAnswerContent(result.answer)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)

    const data: CreateCallLogInput = {
      log_date: fd.get('log_date') as string,
      requester_name: (fd.get('requester_name') as string) || null,
      requester_contact: (fd.get('requester_contact') as string) || null,
      requester_type: (fd.get('requester_type') as string) || null,
      requester_region: (fd.get('requester_region') as string) || null,
      target_name: (fd.get('target_name') as string) || null,
      target_gender: (fd.get('target_gender') as string) || null,
      target_disability_type: (fd.get('target_disability_type') as string) || null,
      target_disability_severity: (fd.get('target_disability_severity') as string) || null,
      target_economic_status: (fd.get('target_economic_status') as string) || null,
      ...qTypes,
      question_content: questionContent || null,
      answer: answerContent || null,
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

  const voiceTextarea = (field: VoiceField, label: string) => {
    const isRecording = recording === field
    const value = field === 'question_content' ? questionContent : answerContent
    const setter = field === 'question_content' ? setQuestionContent : setAnswerContent

    return (
      <div key={field}>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <div className="flex items-center gap-2">
            {field === 'answer' && (
              <button
                type="button"
                onClick={handleAiAnswer}
                disabled={aiLoading || !questionContent.trim()}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50 transition-colors"
              >
                {aiLoading ? (
                  <span className="inline-block w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                AI 초안
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleRecording(field)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                isRecording
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isRecording ? (
                <>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <MicOff className="w-3.5 h-3.5" />
                  녹음 중지
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  음성 입력
                </>
              )}
            </button>
          </div>
        </div>
        <textarea
          name={field}
          rows={3}
          value={value}
          onChange={e => setter(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 resize-none transition-colors ${
            isRecording
              ? 'border-red-300 focus:ring-red-400 bg-red-50'
              : 'focus:ring-blue-500'
          }`}
          placeholder={isRecording ? '음성 인식 중...' : ''}
        />
      </div>
    )
  }

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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">의뢰인 성명</label>
          <input
            type="text"
            name="requester_name"
            defaultValue={defaultValues?.requester_name ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="의뢰인 성명"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">의뢰인 연락처</label>
          <input
            type="text"
            name="requester_contact"
            defaultValue={defaultValues?.requester_contact ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="의뢰인 연락처"
          />
        </div>
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

      {/* 질문내용 + 답변 (음성 입력 + AI 초안 지원) */}
      {voiceTextarea('question_content', '질문 내용')}
      {voiceTextarea('answer', '답변(조치사항)')}
      {aiError && <p className="text-sm text-red-600 -mt-3">{aiError}</p>}

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
