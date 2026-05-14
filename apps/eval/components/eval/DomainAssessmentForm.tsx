'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createDomainAssessment } from '@/actions/assessment-actions'
import type { AssessmentDomainType } from './DomainSelector'
import { DOMAIN_LABELS } from './DomainSelector'
import { WCFields, ADLFields, SFields, SPFields, ECFields, CAFields, LFields, AACFields, AMFields } from './domain-fields'
import { MultiCheck, FUTURE_PLAN_OPTIONS, type DomainData } from './domain-fields/shared'

interface Props {
  applicationId: string
  domain: AssessmentDomainType
  clientId: string
  existingData?: {
    id: string
    evaluation_date: string
    evaluation_data: DomainData | null
    evaluator_opinion: string | null
    recommended_device: string | null
    future_plan: string | null
  } | null
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

export function DomainAssessmentForm({ applicationId, domain, clientId, existingData }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [evalDate, setEvalDate] = useState(
    existingData?.evaluation_date ?? new Date().toISOString().split('T')[0]
  )
  const [evalData, setEvalData] = useState<DomainData>(
    (existingData?.evaluation_data as DomainData) ?? {}
  )
  const [opinion, setOpinion] = useState(existingData?.evaluator_opinion ?? '')
  const [device, setDevice] = useState(existingData?.recommended_device ?? '')
  const [futurePlan, setFuturePlan] = useState<string[]>(
    existingData?.future_plan ? existingData.future_plan.split(', ').filter(Boolean) : []
  )

  function setField(key: string, value: unknown) {
    setEvalData(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = await createDomainAssessment({
        application_id: applicationId,
        domain_type: domain,
        evaluation_date: evalDate,
        evaluation_data: evalData,
        evaluator_opinion: opinion || undefined,
        recommended_device: device || undefined,
        future_plan: futurePlan.length > 0 ? futurePlan.join(', ') : undefined,
      })

      if (!result.success) {
        setError(result.error ?? '저장에 실패했습니다')
        return
      }

      setSaved(true)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="font-semibold text-gray-900 text-base">
          ({domain}) {DOMAIN_LABELS[domain]} 평가
        </h3>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">평가일</label>
          <input type="date" value={evalDate} onChange={e => setEvalDate(e.target.value)}
            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
      )}
      {saved && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">저장되었습니다.</div>
      )}

      {/* Domain-specific fields */}
      <DomainSection domain={domain} data={evalData} set={setField} />

      {/* Common bottom section */}
      <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">기타사항 / 평가자 의견</label>
          <textarea
            value={opinion}
            onChange={e => setOpinion(e.target.value)}
            rows={3}
            placeholder="평가자 의견을 입력하세요"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">추천 보조기기</label>
          <input
            type="text"
            value={device}
            onChange={e => setDevice(e.target.value)}
            placeholder="추천 보조기기명"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>

        <MultiCheck
          label="향후 계획"
          options={FUTURE_PLAN_OPTIONS}
          values={futurePlan}
          onChange={setFuturePlan}
        />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? '저장 중...' : '평가 저장'}
        </button>
      </div>
    </div>
  )
}
