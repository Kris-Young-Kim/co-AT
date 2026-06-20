'use client'

import { useState, useTransition } from 'react'
import {
  createSegment, updateSegment, deleteSegment, getClientsBySegment,
  type ClientSegment, type SegmentFilters, type SegmentClient,
} from '@/actions/segment-actions'
import { Plus, Trash2, Pencil, Users, Filter, Check, X } from 'lucide-react'
import Link from 'next/link'

const DISABILITY_TYPES = [
  '지체', '뇌병변', '시각', '청각', '언어', '지적', '자폐성', '정신', '신장', '심장', '호흡기', '간', '안면', '장루요루', '뇌전증',
]

const GANGWON_CITIES = [
  '춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시',
  '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군',
  '양구군', '인제군', '고성군', '양양군',
]

const LIFECYCLE_OPTIONS = [
  { value: 'active', label: '활성' },
  { value: 'inactive', label: '비활성' },
  { value: 'closed', label: '종결' },
  { value: 'readmit', label: '재접수' },
]

const SERVICE_TYPE_OPTIONS = [
  { value: 'grant', label: '교부사업 평가' },
  { value: 'rental', label: '대여' },
  { value: 'custom', label: '맞춤제작' },
]

interface Props {
  initialSegments: ClientSegment[]
}

function FilterForm({
  filters,
  onChange,
}: {
  filters: SegmentFilters
  onChange: (f: SegmentFilters) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-gray-600 mb-1">장애유형</label>
        <select
          value={filters.disability_type ?? ''}
          onChange={(e) => onChange({ ...filters, disability_type: e.target.value || undefined })}
          className="w-full px-2.5 py-1.5 border rounded-md text-sm"
        >
          <option value="">전체</option>
          {DISABILITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">거주 시군</label>
        <select
          value={filters.city ?? ''}
          onChange={(e) => onChange({ ...filters, city: e.target.value || undefined })}
          className="w-full px-2.5 py-1.5 border rounded-md text-sm"
        >
          <option value="">전체</option>
          {GANGWON_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">서비스 유형</label>
        <select
          value={filters.service_type ?? ''}
          onChange={(e) => onChange({ ...filters, service_type: (e.target.value as any) || undefined })}
          className="w-full px-2.5 py-1.5 border rounded-md text-sm"
        >
          <option value="">전체</option>
          {SERVICE_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">생애주기</label>
        <select
          value={filters.lifecycle_status ?? ''}
          onChange={(e) => onChange({ ...filters, lifecycle_status: e.target.value || undefined })}
          className="w-full px-2.5 py-1.5 border rounded-md text-sm"
        >
          <option value="">전체</option>
          {LIFECYCLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>
  )
}

export function SegmentManager({ initialSegments }: Props) {
  const [segments, setSegments] = useState(initialSegments)
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [previewResult, setPreviewResult] = useState<{ clients: SegmentClient[]; total: number } | null>(null)
  const [previewSegmentId, setPreviewSegmentId] = useState<string | null>(null)

  const [createForm, setCreateForm] = useState({ name: '', description: '', filters: {} as SegmentFilters })
  const [editForm, setEditForm] = useState<{ name: string; description: string; filters: SegmentFilters } | null>(null)

  function handleCreate() {
    if (!createForm.name.trim()) return
    startTransition(async () => {
      setError(null)
      const res = await createSegment(createForm)
      if (!res.success) { setError(res.error ?? '오류'); return }
      setSegments((prev) => [...prev, res.segment!])
      setCreateForm({ name: '', description: '', filters: {} })
      setShowCreate(false)
    })
  }

  function startEditSegment(seg: ClientSegment) {
    setEditId(seg.id)
    setEditForm({ name: seg.name, description: seg.description ?? '', filters: seg.filters })
  }

  function handleSaveEdit() {
    if (!editId || !editForm) return
    startTransition(async () => {
      setError(null)
      const res = await updateSegment(editId, editForm)
      if (!res.success) { setError(res.error ?? '오류'); return }
      setSegments((prev) => prev.map((s) => s.id === editId ? { ...s, ...editForm } : s))
      setEditId(null)
      setEditForm(null)
    })
  }

  function handleDelete(id: string) {
    if (!confirm('이 세그먼트를 삭제하시겠습니까?')) return
    startTransition(async () => {
      const res = await deleteSegment(id)
      if (!res.success) { setError(res.error ?? '오류'); return }
      setSegments((prev) => prev.filter((s) => s.id !== id))
      if (previewSegmentId === id) { setPreviewResult(null); setPreviewSegmentId(null) }
    })
  }

  function handlePreview(seg: ClientSegment) {
    startTransition(async () => {
      const res = await getClientsBySegment(seg.filters)
      if (!res.success) { setError(res.error ?? '오류'); return }
      setPreviewResult({ clients: res.clients ?? [], total: res.total ?? 0 })
      setPreviewSegmentId(seg.id)
    })
  }

  function describeFilters(filters: SegmentFilters): string {
    const parts: string[] = []
    if (filters.disability_type) parts.push(`장애유형: ${filters.disability_type}`)
    if (filters.city) parts.push(`시군: ${filters.city}`)
    if (filters.service_type) {
      const label = SERVICE_TYPE_OPTIONS.find((o) => o.value === filters.service_type)?.label ?? filters.service_type
      parts.push(`서비스: ${label}`)
    }
    if (filters.lifecycle_status) {
      const label = LIFECYCLE_OPTIONS.find((o) => o.value === filters.lifecycle_status)?.label ?? filters.lifecycle_status
      parts.push(`생애주기: ${label}`)
    }
    return parts.length > 0 ? parts.join(' · ') : '조건 없음 (전체)'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 세그먼트 목록 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">저장된 세그먼트</h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            새 세그먼트
          </button>
        </div>

        {error && <div className="p-3 mb-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>}

        {showCreate && (
          <div className="border rounded-lg p-4 bg-blue-50 mb-4 space-y-3">
            <p className="text-sm font-medium text-blue-900">새 세그먼트 만들기</p>
            <input
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="세그먼트 이름 (예: 우선지원 대상자)"
              className="w-full px-3 py-1.5 border rounded-md text-sm bg-white"
            />
            <input
              value={createForm.description}
              onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="설명 (선택)"
              className="w-full px-3 py-1.5 border rounded-md text-sm bg-white"
            />
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" />
                필터 조건
              </p>
              <FilterForm
                filters={createForm.filters}
                onChange={(f) => setCreateForm((p) => ({ ...p, filters: f }))}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={isPending || !createForm.name.trim()} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md disabled:opacity-50">저장</button>
              <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 border text-sm rounded-md hover:bg-gray-50">취소</button>
            </div>
          </div>
        )}

        {segments.length === 0 && !showCreate ? (
          <div className="border rounded-lg p-8 bg-white text-center">
            <Filter className="h-8 w-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">저장된 세그먼트가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {segments.map((seg) => (
              <div key={seg.id} className="border rounded-lg p-4 bg-white">
                {editId === seg.id && editForm ? (
                  <div className="space-y-3">
                    <input value={editForm.name} onChange={(e) => setEditForm((p) => p ? { ...p, name: e.target.value } : p)} className="w-full px-2.5 py-1.5 border rounded-md text-sm" />
                    <input value={editForm.description} onChange={(e) => setEditForm((p) => p ? { ...p, description: e.target.value } : p)} placeholder="설명" className="w-full px-2.5 py-1.5 border rounded-md text-sm" />
                    <FilterForm filters={editForm.filters} onChange={(f) => setEditForm((p) => p ? { ...p, filters: f } : p)} />
                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} disabled={isPending} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Check className="h-4 w-4" /></button>
                      <button onClick={() => { setEditId(null); setEditForm(null) }} className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"><X className="h-4 w-4" /></button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{seg.name}</p>
                        {seg.description && <p className="text-xs text-gray-500">{seg.description}</p>}
                        <p className="text-xs text-blue-600 mt-1">{describeFilters(seg.filters)}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => startEditSegment(seg)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(seg.id)} disabled={isPending} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePreview(seg)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border rounded-md hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      <Users className="h-3.5 w-3.5" />
                      대상자 조회
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 미리보기 패널 */}
      <div>
        {previewResult ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                조회 결과
                <span className="ml-2 text-sm font-normal text-gray-500">{previewResult.total}명</span>
              </h2>
              <button onClick={() => { setPreviewResult(null); setPreviewSegmentId(null) }} className="text-xs text-gray-400 hover:text-gray-600">닫기</button>
            </div>
            {previewResult.clients.length === 0 ? (
              <div className="border rounded-lg p-8 bg-white text-center">
                <p className="text-sm text-gray-400">조건에 맞는 대상자가 없습니다.</p>
              </div>
            ) : (
              <div className="border rounded-lg divide-y bg-white max-h-[60vh] overflow-y-auto">
                {previewResult.clients.map((c) => (
                  <Link
                    key={c.id}
                    href={`/clients/${c.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500">
                        {c.disability_type ?? '—'} · {c.city ?? '—'}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {c.lifecycle_status ?? 'active'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="border rounded-lg p-8 bg-gray-50 text-center h-full flex flex-col items-center justify-center">
            <Users className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">세그먼트를 선택하면 대상자 목록이 표시됩니다.</p>
          </div>
        )}
      </div>
    </div>
  )
}
