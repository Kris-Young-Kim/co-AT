'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import { createConsultationRecord } from '@/actions/case-record-actions'
import { createDomainAssessment } from '@/actions/assessment-actions'
import type { AssessmentDomainType } from './DomainSelector'
import { DOMAIN_LABELS } from './DomainSelector'
import {
  WCFields, ADLFields, SFields, SPFields, ECFields,
  CAFields, LFields, AACFields, AMFields,
} from './domain-fields'
import { MultiCheck, FUTURE_PLAN_OPTIONS, type DomainData } from './domain-fields/shared'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type FlowStep = 'consult' | 'domains' | 'assessing' | 'done'

const ALL_DOMAINS: AssessmentDomainType[] = ['WC', 'ADL', 'S', 'SP', 'EC', 'CA', 'L', 'AAC', 'AM']

const CONSULT_TYPES = ['방문', '전화', '내방', '기관방문', '이메일', '기타']

interface ConsultForm {
  consultation_date: string
  consultation_type: string
  consultant: string
  purpose: string
  current_situation: string
  content: string
  result: string
  next_plan: string
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function StepBadge({ current, total }: { current: number; total: number }) {
  return (
    <span className="text-xs text-gray-400 font-normal">
      {current} / {total}
    </span>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-600 mb-1">{children}</label>
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
    />
  )
}

function DomainSection({ domain, data, set }: {
  domain: AssessmentDomainType
  data: DomainData
  set: (k: string, v: unknown) => void
}) {
  switch (domain) {
    case 'WC':  return <WCFields  data={data} set={set} />
    case 'ADL': return <ADLFields data={data} set={set} />
    case 'S':   return <SFields   data={data} set={set} />
    case 'SP':  return <SPFields  data={data} set={set} />
    case 'EC':  return <ECFields  data={data} set={set} />
    case 'CA':  return <CAFields  data={data} set={set} />
    case 'L':   return <LFields   data={data} set={set} />
    case 'AAC': return <AACFields data={data} set={set} />
    case 'AM':  return <AMFields  data={data} set={set} />
  }
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function AssessmentSessionFlow({
  clientId,
  clientName,
}: {
  clientId: string
  clientName: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Flow state
  const [step, setStep] = useState<FlowStep>('consult')
  const [consultRecordId, setConsultRecordId] = useState<string | null>(null)
  const [selectedDomains, setSelectedDomains] = useState<AssessmentDomainType[]>([])
  const [domainIdx, setDomainIdx] = useState(0)
  const [completedDomains, setCompletedDomains] = useState<AssessmentDomainType[]>([])

  // ── Step 1: Consultation form state ──
  const today = new Date().toISOString().split('T')[0]
  const [consult, setConsult] = useState<ConsultForm>({
    consultation_date: today,
    consultation_type: '방문',
    consultant: '',
    purpose: '',
    current_situation: '',
    content: '',
    result: '',
    next_plan: '',
  })

  // ── Step 3: Domain assessment state (resets per domain) ──
  const [evalDate, setEvalDate] = useState(today)
  const [evalData, setEvalData] = useState<DomainData>({})
  const [opinion, setOpinion] = useState('')
  const [device, setDevice] = useState('')
  const [futurePlan, setFuturePlan] = useState<string[]>([])

  function setField(key: string, value: unknown) {
    setEvalData(prev => ({ ...prev, [key]: value }))
  }

  // ── Handlers ──

  function handleSaveConsult() {
    if (!consult.consultation_date || !consult.consultation_type) {
      setError('상담일자와 상담유형은 필수입니다')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await createConsultationRecord({
        client_id: clientId,
        consultation_date: consult.consultation_date,
        consultation_type: consult.consultation_type,
        consultant: consult.consultant || null,
        purpose: consult.purpose || null,
        current_situation: consult.current_situation || null,
        content: consult.content || null,
        result: consult.result || null,
        next_plan: consult.next_plan || null,
      })
      if (!result.success || !result.record) {
        setError(result.error ?? '상담기록지 저장에 실패했습니다')
        return
      }
      setConsultRecordId(result.record.id)
      setStep('domains')
    })
  }

  function handleStartAssessing() {
    if (selectedDomains.length === 0) {
      setError('평가 영역을 1개 이상 선택해주세요')
      return
    }
    setError(null)
    setDomainIdx(0)
    setEvalDate(today)
    setEvalData({})
    setOpinion('')
    setDevice('')
    setFuturePlan([])
    setStep('assessing')
  }

  function handleSaveDomain(advance: boolean) {
    if (!consultRecordId) return
    setError(null)
    startTransition(async () => {
      const domain = selectedDomains[domainIdx]
      const result = await createDomainAssessment({
        consultation_record_id: consultRecordId,
        client_id: clientId,
        domain_type: domain,
        evaluation_date: evalDate,
        evaluation_data: evalData,
        evaluator_opinion: opinion || undefined,
        recommended_device: device || undefined,
        future_plan: futurePlan.length > 0 ? futurePlan.join(', ') : undefined,
      })

      if (!result.success) {
        setError(result.error ?? '평가 저장에 실패했습니다')
        return
      }

      setCompletedDomains(prev => [...prev, domain])

      if (!advance || domainIdx + 1 >= selectedDomains.length) {
        setStep('done')
        return
      }

      // Advance to next domain with reset
      setDomainIdx(domainIdx + 1)
      setEvalDate(today)
      setEvalData({})
      setOpinion('')
      setDevice('')
      setFuturePlan([])
    })
  }

  function handleSkipDomain() {
    if (domainIdx + 1 >= selectedDomains.length) {
      setStep('done')
      return
    }
    setDomainIdx(domainIdx + 1)
    setEvalDate(today)
    setEvalData({})
    setOpinion('')
    setDevice('')
    setFuturePlan([])
  }

  // ─────────────────────────────────────────────────────────────
  // Step 1: Consultation Record Form
  // ─────────────────────────────────────────────────────────────
  if (step === 'consult') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            1단계: 상담기록지 입력
          </h2>
          <span className="text-xs text-gray-400">필수 입력 후 다음 단계로 진행</span>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="border rounded-lg p-5 bg-white space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>상담일자 *</FieldLabel>
              <Input
                type="date"
                value={consult.consultation_date}
                onChange={v => setConsult(p => ({ ...p, consultation_date: v }))}
              />
            </div>
            <div>
              <FieldLabel>상담유형 *</FieldLabel>
              <select
                value={consult.consultation_type}
                onChange={e => setConsult(p => ({ ...p, consultation_type: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {CONSULT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <FieldLabel>상담사</FieldLabel>
            <Input
              value={consult.consultant}
              onChange={v => setConsult(p => ({ ...p, consultant: v }))}
              placeholder="상담사 이름"
            />
          </div>

          <div>
            <FieldLabel>상담 목적</FieldLabel>
            <Input
              value={consult.purpose}
              onChange={v => setConsult(p => ({ ...p, purpose: v }))}
              placeholder="상담 목적을 입력하세요"
            />
          </div>

          <div>
            <FieldLabel>현재 상황</FieldLabel>
            <Textarea
              value={consult.current_situation}
              onChange={v => setConsult(p => ({ ...p, current_situation: v }))}
              placeholder="대상자 현재 상황을 입력하세요"
            />
          </div>

          <div>
            <FieldLabel>상담 내용</FieldLabel>
            <Textarea
              value={consult.content}
              onChange={v => setConsult(p => ({ ...p, content: v }))}
              placeholder="상담 내용을 입력하세요"
              rows={4}
            />
          </div>

          <div>
            <FieldLabel>상담 결과</FieldLabel>
            <Textarea
              value={consult.result}
              onChange={v => setConsult(p => ({ ...p, result: v }))}
              placeholder="상담 결과를 입력하세요"
            />
          </div>

          <div>
            <FieldLabel>다음 계획</FieldLabel>
            <Textarea
              value={consult.next_plan}
              onChange={v => setConsult(p => ({ ...p, next_plan: v }))}
              placeholder="향후 계획을 입력하세요"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveConsult}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            저장 후 영역 선택
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // Step 2: Domain Selection
  // ─────────────────────────────────────────────────────────────
  if (step === 'domains') {
    function toggleDomain(domain: AssessmentDomainType) {
      setSelectedDomains(prev =>
        prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]
      )
    }

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">2단계: 평가 영역 선택</h2>
          <span className="text-xs text-gray-400">상담기록지 저장 완료</span>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="border rounded-lg p-5 bg-white">
          <p className="text-sm text-gray-600 mb-4">평가할 영역을 선택하세요 (복수 선택 가능)</p>
          <div className="grid grid-cols-3 gap-3">
            {ALL_DOMAINS.map(domain => {
              const checked = selectedDomains.includes(domain)
              return (
                <button
                  key={domain}
                  type="button"
                  onClick={() => toggleDomain(domain)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    checked
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                    checked ? 'border-blue-600 bg-blue-600' : 'border-gray-400'
                  }`}>
                    {checked && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                        <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="truncate">({domain}) {DOMAIN_LABELS[domain]}</span>
                </button>
              )
            })}
          </div>

          {selectedDomains.length > 0 && (
            <p className="mt-4 text-xs text-gray-500">
              선택된 영역 ({selectedDomains.length}개): {selectedDomains.map(d => DOMAIN_LABELS[d]).join(', ')}
            </p>
          )}
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setStep('consult')}
            className="inline-flex items-center gap-1 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </button>
          <button
            type="button"
            onClick={handleStartAssessing}
            disabled={selectedDomains.length === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            평가 시작
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // Step 3: Domain Assessments
  // ─────────────────────────────────────────────────────────────
  if (step === 'assessing') {
    const currentDomain = selectedDomains[domainIdx]
    const isLast = domainIdx === selectedDomains.length - 1

    return (
      <div className="space-y-5">
        {/* Progress header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            3단계: 영역별 평가
            <span className="ml-2 text-sm font-normal text-gray-400">
              <StepBadge current={domainIdx + 1} total={selectedDomains.length} />
            </span>
          </h2>
          <div className="flex gap-1">
            {selectedDomains.map((d, i) => (
              <span
                key={d}
                className={`inline-block w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium ${
                  completedDomains.includes(d)
                    ? 'bg-green-500 text-white'
                    : i === domainIdx
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
                title={DOMAIN_LABELS[d]}
              >
                {d === 'AAC' ? 'AC' : d}
              </span>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
        )}

        {/* Domain form */}
        <div className="border rounded-lg p-5 bg-white space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-semibold text-gray-900">
              ({currentDomain}) {DOMAIN_LABELS[currentDomain]} 평가
            </h3>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">평가일</label>
              <input
                type="date"
                value={evalDate}
                onChange={e => setEvalDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <DomainSection domain={currentDomain} data={evalData} set={setField} />

          <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
            <div>
              <FieldLabel>평가자 의견</FieldLabel>
              <Textarea
                value={opinion}
                onChange={setOpinion}
                placeholder="평가자 의견을 입력하세요"
              />
            </div>
            <div>
              <FieldLabel>추천 보조기기</FieldLabel>
              <Input
                value={device}
                onChange={setDevice}
                placeholder="추천 보조기기명"
              />
            </div>
            <MultiCheck
              label="향후 계획"
              options={FUTURE_PLAN_OPTIONS}
              values={futurePlan}
              onChange={setFuturePlan}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleSkipDomain}
            className="px-4 py-2 border rounded-lg text-sm text-gray-500 hover:bg-gray-50"
          >
            이 영역 건너뛰기
          </button>
          <button
            type="button"
            onClick={() => handleSaveDomain(!isLast)}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isLast ? '저장 후 완료' : '저장 후 다음 영역'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // Step 4: Done
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="text-center py-10 border rounded-xl bg-white">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">평가 세션 완료</h2>
        <p className="text-sm text-gray-500 mb-1">{clientName}</p>
        {completedDomains.length > 0 && (
          <p className="text-sm text-gray-400">
            저장된 영역: {completedDomains.map(d => `(${d}) ${DOMAIN_LABELS[d]}`).join(', ')}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => router.push(`/clients/${clientId}`)}
          className="w-full px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 text-center"
        >
          대상자 정보로 돌아가기
        </button>
        <button
          type="button"
          onClick={() => {
            setStep('consult')
            setConsultRecordId(null)
            setSelectedDomains([])
            setDomainIdx(0)
            setCompletedDomains([])
            setConsult({
              consultation_date: today,
              consultation_type: '방문',
              consultant: '',
              purpose: '',
              current_situation: '',
              content: '',
              result: '',
              next_plan: '',
            })
          }}
          className="w-full px-4 py-3 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 text-center"
        >
          새 상담 및 평가 세션 시작
        </button>
      </div>
    </div>
  )
}
