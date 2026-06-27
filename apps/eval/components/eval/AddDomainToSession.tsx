'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2, ChevronRight, X } from 'lucide-react'
import { createDomainAssessment } from '@/actions/assessment-actions'
import type { AssessmentDomainType } from './DomainSelector'
import { DOMAIN_LABELS } from './DomainSelector'
import {
  WCFields, ADLFields, SFields, SPFields, ECFields,
  CAFields, LFields, AACFields, AMFields,
} from './domain-fields'
import { MultiCheck, FUTURE_PLAN_OPTIONS, type DomainData } from './domain-fields/shared'
import type { ConsultDomainAssessment } from '@/actions/assessment-actions'

const ALL_DOMAINS: AssessmentDomainType[] = ['WC', 'ADL', 'S', 'SP', 'EC', 'CA', 'L', 'AAC', 'AM']

const DOMAIN_COLORS: Record<string, string> = {
  WC: 'bg-blue-50 text-blue-700 border-blue-200',
  ADL: 'bg-green-50 text-green-700 border-green-200',
  S: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  SP: 'bg-purple-50 text-purple-700 border-purple-200',
  EC: 'bg-orange-50 text-orange-700 border-orange-200',
  CA: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  L: 'bg-pink-50 text-pink-700 border-pink-200',
  AAC: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  AM: 'bg-red-50 text-red-700 border-red-200',
}

interface Props {
  consultRecordId: string
  clientId: string
  existingDomains: string[]
  onAdded: (assessment: ConsultDomainAssessment) => void
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

export function AddDomainToSession({ consultRecordId, clientId, existingDomains, onAdded }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const [step, setStep] = useState<'idle' | 'select' | 'assess'>('idle')
  const [selectedDomain, setSelectedDomain] = useState<AssessmentDomainType | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [evalDate, setEvalDate] = useState(today)
  const [evalData, setEvalData] = useState<DomainData>({})
  const [opinion, setOpinion] = useState('')
  const [device, setDevice] = useState('')
  const [futurePlan, setFuturePlan] = useState<string[]>([])

  const available = ALL_DOMAINS.filter(d => !existingDomains.includes(d))

  if (available.length === 0) return null

  function handleSelectDomain(domain: AssessmentDomainType) {
    setSelectedDomain(domain)
    setEvalDate(today)
    setEvalData({})
    setOpinion('')
    setDevice('')
    setFuturePlan([])
    setError(null)
    setStep('assess')
  }

  function handleSave() {
    if (!selectedDomain) return
    setError(null)
    startTransition(async () => {
      const result = await createDomainAssessment({
        consultation_record_id: consultRecordId,
        client_id: clientId,
        domain_type: selectedDomain,
        evaluation_date: evalDate,
        evaluation_data: evalData,
        evaluator_opinion: opinion || undefined,
        recommended_device: device || undefined,
        future_plan: futurePlan.length > 0 ? futurePlan.join(', ') : undefined,
      })
      if (!result.success || !result.assessmentId) {
        setError(result.error ?? '저장에 실패했습니다')
        return
      }
      // Build the ConsultDomainAssessment object from local state
      const newItem: ConsultDomainAssessment = {
        id: result.assessmentId,
        domain_type: selectedDomain,
        evaluation_date: evalDate,
        consultation_record_id: consultRecordId,
        application_id: null,
        client_id: clientId,
        evaluator_opinion: opinion || null,
        recommended_device: device || null,
        future_plan: futurePlan.length > 0 ? futurePlan.join(', ') : null,
        evaluation_data: evalData,
        measurements: null,
      }
      onAdded(newItem)
      setStep('idle')
      setSelectedDomain(null)
    })
  }

  function handleCancel() {
    setStep('idle')
    setSelectedDomain(null)
    setError(null)
  }

  // ── Idle: show + button ──
  if (step === 'idle') {
    return (
      <button
        type="button"
        onClick={() => setStep('select')}
        className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        <Plus className="h-4 w-4" />
        영역 추가
      </button>
    )
  }

  // ── Select domain ──
  if (step === 'select') {
    return (
      <div className="mt-4 border rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">추가할 영역 선택</p>
          <button type="button" onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {available.map(domain => (
            <button
              key={domain}
              type="button"
              onClick={() => handleSelectDomain(domain)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium hover:shadow-sm transition-all ${DOMAIN_COLORS[domain] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}
            >
              <span className="font-bold text-xs">{domain}</span>
              <span className="text-xs font-normal truncate">{DOMAIN_LABELS[domain]}</span>
              <ChevronRight className="h-3 w-3 ml-auto shrink-0" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Assess ──
  if (!selectedDomain) return null
  return (
    <div className="mt-4 border rounded-lg overflow-hidden bg-white">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${DOMAIN_COLORS[selectedDomain]?.split(' ').slice(0, 2).join(' ') ?? ''}`}>
          {selectedDomain}
        </span>
        <span className="text-sm font-medium text-gray-800">{DOMAIN_LABELS[selectedDomain]} 평가 입력</span>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-gray-500">평가일</label>
          <input type="date" value={evalDate} onChange={e => setEvalDate(e.target.value)}
            className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {error && (
          <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>
        )}

        <DomainSection domain={selectedDomain} data={evalData} set={(k, v) => setEvalData(p => ({ ...p, [k]: v }))} />

        <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">평가자 의견</label>
            <textarea value={opinion} onChange={e => setOpinion(e.target.value)} rows={2}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">추천 보조기기</label>
            <input value={device} onChange={e => setDevice(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <MultiCheck label="향후 계획" options={FUTURE_PLAN_OPTIONS} values={futurePlan} onChange={setFuturePlan} />
        </div>

        <div className="flex justify-between">
          <button type="button" onClick={() => setStep('select')} disabled={isPending}
            className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            영역 다시 선택
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={handleCancel} disabled={isPending}
              className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              취소
            </button>
            <button type="button" onClick={handleSave} disabled={isPending}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
