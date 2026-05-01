'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export type AssessmentDomainType = 'WC' | 'ADL' | 'S' | 'SP' | 'EC' | 'CA' | 'L' | 'AAC' | 'AM'

export const DOMAIN_LABELS: Record<AssessmentDomainType, string> = {
  WC: '휠체어',
  ADL: '일상생활',
  S: '착석/자세',
  SP: '서기/보행',
  EC: '환경제어',
  CA: '의사소통보조',
  L: '여가/스포츠',
  AAC: '보완대체의사소통',
  AM: '상지보조기기',
}

const DOMAINS: AssessmentDomainType[] = ['WC', 'ADL', 'S', 'SP', 'EC', 'CA', 'L', 'AAC', 'AM']

interface DomainSelectorProps {
  selectedDomain: AssessmentDomainType
  completedDomains: AssessmentDomainType[]
}

export function DomainSelector({ selectedDomain, completedDomains }: DomainSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function selectDomain(domain: AssessmentDomainType) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('domain', domain)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {DOMAINS.map(domain => {
        const isSelected = selectedDomain === domain
        const isCompleted = completedDomains.includes(domain)
        const baseClass = 'px-3 py-1.5 rounded-md text-sm font-medium border transition-colors'
        const stateClass = isSelected
          ? 'bg-blue-600 text-white border-blue-600'
          : isCompleted
          ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'

        return (
          <button key={domain} onClick={() => selectDomain(domain)} className={`${baseClass} ${stateClass}`}>
            {domain}
            <span className="ml-1 text-xs opacity-75">({DOMAIN_LABELS[domain]})</span>
            {isCompleted && <span className="ml-1">✓</span>}
          </button>
        )
      })}
    </div>
  )
}
