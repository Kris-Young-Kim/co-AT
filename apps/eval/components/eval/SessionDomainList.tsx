'use client'

import { useState } from 'react'
import { DomainAssessmentEditCard } from './DomainAssessmentEditCard'
import { AddDomainToSession } from './AddDomainToSession'
import type { ConsultDomainAssessment } from '@/actions/assessment-actions'

interface Props {
  initialItems: ConsultDomainAssessment[]
  consultRecordId: string
  clientId: string
}

export function SessionDomainList({ initialItems, consultRecordId, clientId }: Props) {
  const [items, setItems] = useState(initialItems)

  function handleDeleted(id: string) {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  function handleAdded(assessment: ConsultDomainAssessment) {
    setItems(prev => [...prev, assessment])
  }

  const existingDomains = items.map(i => i.domain_type)

  return (
    <div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center border rounded-lg bg-gray-50">
          영역 평가가 없습니다 — 아래에서 추가하세요
        </p>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <DomainAssessmentEditCard
              key={item.id}
              assessment={item}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      <AddDomainToSession
        consultRecordId={consultRecordId}
        clientId={clientId}
        existingDomains={existingDomains}
        onAdded={handleAdded}
      />
    </div>
  )
}
