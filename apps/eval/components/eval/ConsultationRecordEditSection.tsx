'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Loader2, Check, X, Trash2 } from 'lucide-react'
import { updateConsultationRecord, deleteConsultationRecord } from '@/actions/case-record-actions'
import type { ConsultationRecord } from '@/actions/case-record-actions'

const CONSULT_TYPES = ['방문', '전화', '내방', '기관방문', '이메일', '기타']

interface Props {
  record: ConsultationRecord
  clientId: string
}

export function ConsultationRecordEditSection({ record: initial, clientId }: Props) {
  const router = useRouter()
  const [record, setRecord] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Edit form state
  const [form, setForm] = useState({
    consultation_date: record.consultation_date,
    consultation_type: record.consultation_type,
    consultant: record.consultant ?? '',
    purpose: record.purpose ?? '',
    current_situation: record.current_situation ?? '',
    content: record.content ?? '',
    result: record.result ?? '',
    next_plan: record.next_plan ?? '',
  })

  function openEdit() {
    setForm({
      consultation_date: record.consultation_date,
      consultation_type: record.consultation_type,
      consultant: record.consultant ?? '',
      purpose: record.purpose ?? '',
      current_situation: record.current_situation ?? '',
      content: record.content ?? '',
      result: record.result ?? '',
      next_plan: record.next_plan ?? '',
    })
    setError(null)
    setEditing(true)
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await updateConsultationRecord(record.id, clientId, {
        consultation_date: form.consultation_date,
        consultation_type: form.consultation_type,
        consultant: form.consultant || null,
        purpose: form.purpose || null,
        current_situation: form.current_situation || null,
        content: form.content || null,
        result: form.result || null,
        next_plan: form.next_plan || null,
      })
      if (!result.success) {
        setError(result.error ?? '저장에 실패했습니다')
        return
      }
      if (result.record) setRecord(result.record)
      setEditing(false)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteConsultationRecord(record.id, clientId)
      if (!result.success) {
        setError(result.error ?? '삭제에 실패했습니다')
        setConfirmDelete(false)
        return
      }
      router.push(`/clients/${clientId}`)
      router.refresh()
    })
  }

  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="border rounded-lg p-5 bg-white mb-6">
      <div className="flex items-center justify-between mb-4 pb-2 border-b">
        <h2 className="text-sm font-semibold text-gray-700">상담기록지</h2>
        {!editing && !confirmDelete && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={openEdit}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-gray-50 text-gray-600"
            >
              <Pencil className="h-3 w-3" />
              수정
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center px-2 py-1 text-xs border border-red-200 rounded hover:bg-red-50 text-red-500"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 mb-3">{error}</div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-3">
          <p className="text-sm font-medium text-red-800 mb-3">
            이 상담기록지와 연결된 모든 영역 평가가 함께 삭제됩니다. 계속하시겠습니까?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={isPending}
              className="px-3 py-1.5 border rounded text-sm text-gray-600 hover:bg-white"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              세션 전체 삭제
            </button>
          </div>
        </div>
      )}

      {/* Read mode */}
      {!editing && !confirmDelete && (
        <dl className="space-y-3 text-sm">
          <div className="flex gap-4 text-xs text-gray-500">
            <span>{record.consultation_date}</span>
            <span>·</span>
            <span>{record.consultation_type}</span>
            {record.consultant && <><span>·</span><span>{record.consultant}</span></>}
          </div>
          {record.purpose && (
            <div>
              <dt className="text-xs font-medium text-gray-500 mb-0.5">상담 목적</dt>
              <dd className="text-gray-800">{record.purpose}</dd>
            </div>
          )}
          {record.current_situation && (
            <div>
              <dt className="text-xs font-medium text-gray-500 mb-0.5">현재 상황</dt>
              <dd className="text-gray-800 whitespace-pre-wrap">{record.current_situation}</dd>
            </div>
          )}
          {record.content && (
            <div>
              <dt className="text-xs font-medium text-gray-500 mb-0.5">상담 내용</dt>
              <dd className="text-gray-800 whitespace-pre-wrap">{record.content}</dd>
            </div>
          )}
          {record.result && (
            <div>
              <dt className="text-xs font-medium text-gray-500 mb-0.5">상담 결과</dt>
              <dd className="text-gray-800 whitespace-pre-wrap">{record.result}</dd>
            </div>
          )}
          {record.next_plan && (
            <div>
              <dt className="text-xs font-medium text-gray-500 mb-0.5">다음 계획</dt>
              <dd className="text-gray-800 whitespace-pre-wrap">{record.next_plan}</dd>
            </div>
          )}
        </dl>
      )}

      {/* Edit mode */}
      {editing && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">상담일자</label>
              <input type="date" value={form.consultation_date} onChange={e => f('consultation_date')(e.target.value)}
                className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">상담유형</label>
              <select value={form.consultation_type} onChange={e => f('consultation_type')(e.target.value)}
                className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                {CONSULT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {[
            { key: 'consultant', label: '상담사', rows: 0 },
            { key: 'purpose', label: '상담 목적', rows: 0 },
            { key: 'current_situation', label: '현재 상황', rows: 3 },
            { key: 'content', label: '상담 내용', rows: 4 },
            { key: 'result', label: '상담 결과', rows: 2 },
            { key: 'next_plan', label: '다음 계획', rows: 2 },
          ].map(({ key, label, rows }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              {rows === 0 ? (
                <input
                  value={form[key as keyof typeof form]}
                  onChange={e => f(key as keyof typeof form)(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <textarea
                  value={form[key as keyof typeof form]}
                  onChange={e => f(key as keyof typeof form)(e.target.value)}
                  rows={rows}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              )}
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setEditing(false)} disabled={isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              <X className="h-3.5 w-3.5" />취소
            </button>
            <button type="button" onClick={handleSave} disabled={isPending}
              className="inline-flex items-center gap-1 px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
