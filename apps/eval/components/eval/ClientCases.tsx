'use client'

import { useState, useTransition } from 'react'
import { createCase, deleteCase, EvalCase } from '@/actions/case-actions'

interface Props {
  initialCases: EvalCase[]
  clientId: string
}

interface CaseCardProps {
  caseItem: EvalCase
  clientId: string
  onDelete: (caseId: string) => void
}

const CASE_TYPE_LABELS: Record<string, string> = {
  multi: '다중 서비스',
  grant_eval: '교부사업',
  rental: '대여',
  custom_make: '맞춤제작',
  other: '기타',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

function CaseCard({ caseItem, onDelete }: CaseCardProps) {
  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-gray-900">{caseItem.title}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[caseItem.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {caseItem.status === 'active' ? '진행중' : caseItem.status === 'completed' ? '완료' : '취소'}
            </span>
            <span className="text-xs text-gray-400">
              {CASE_TYPE_LABELS[caseItem.case_type] ?? caseItem.case_type}
            </span>
          </div>
          {caseItem.notes && (
            <p className="text-xs text-gray-500 mt-1">{caseItem.notes}</p>
          )}
          {caseItem.services.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {caseItem.services.map((svc, i) => (
                <span key={i} className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded">
                  {svc.label}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1.5">
            {new Date(caseItem.created_at).toLocaleDateString('ko-KR')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(caseItem.id)}
          className="text-xs text-red-400 hover:text-red-600 shrink-0"
        >
          삭제
        </button>
      </div>
    </div>
  )
}

export function ClientCases({ initialCases, clientId }: Props) {
  const [cases, setCases] = useState<EvalCase[]>(initialCases)
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState('multi')
  const [newNotes, setNewNotes] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createCase(clientId, {
        title: newTitle,
        case_type: newType,
        notes: newNotes || null,
      })
      if (result.success && result.id) {
        setCases((prev) => [{
          id: result.id!,
          client_id: clientId,
          title: newTitle,
          case_type: newType,
          status: 'active',
          services: [],
          notes: newNotes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, ...prev])
        setNewTitle('')
        setNewType('multi')
        setNewNotes('')
        setShowForm(false)
      } else {
        setError(result.error ?? '케이스 추가에 실패했습니다')
      }
    })
  }

  async function handleDelete(caseId: string) {
    startTransition(async () => {
      const result = await deleteCase(caseId, clientId)
      if (result.success) {
        setCases((prev) => prev.filter((c) => c.id !== caseId))
      }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900">
          케이스 관리
          {cases.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">({cases.length}건)</span>
          )}
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          {showForm ? '취소' : '+ 케이스 추가'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 p-4 border rounded-lg bg-gray-50 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">케이스 제목 *</label>
            <input
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="예: 전동휠체어 교부 + 임시대여 연계"
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">케이스 유형</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm focus:outline-none"
            >
              <option value="multi">다중 서비스</option>
              <option value="grant_eval">교부사업 평가</option>
              <option value="rental">대여</option>
              <option value="custom_make">맞춤제작</option>
              <option value="other">기타</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">비고</label>
            <textarea
              rows={2}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? '저장 중...' : '케이스 추가'}
          </button>
        </form>
      )}

      {cases.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6 border rounded-lg bg-gray-50">
          케이스가 없습니다
        </p>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <CaseCard key={c.id} caseItem={c} clientId={clientId} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
