'use client'

import { useState } from 'react'
import { DomainAssessmentEditCard } from './DomainAssessmentEditCard'
import type { ConsultDomainAssessment } from '@/actions/assessment-actions'

interface Props {
  initialItems: ConsultDomainAssessment[]
}

export function SessionDomainList({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems)

  function handleDeleted(id: string) {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-6 text-center border rounded-lg bg-gray-50">
        모든 영역 평가가 삭제되었습니다
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <DomainAssessmentEditCard
          key={item.id}
          assessment={item}
          onDeleted={handleDeleted}
        />
      ))}
    </div>
  )
}
