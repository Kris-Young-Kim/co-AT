'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, ChevronRight, Pencil, Trash2, Plus, X, Check, AlertTriangle, BookText, Phone, Wrench } from 'lucide-react'
import {
  upsertProductKnowledge,
  deleteProductKnowledge,
  type ProductKnowledgeWithStats,
  type UpsertProductKnowledgeInput,
} from '@/actions/knowledge-actions'

interface Props {
  initialItems: ProductKnowledgeWithStats[]
}

const EMPTY_FORM: UpsertProductKnowledgeInput = {
  product_name: '',
  category: null,
  manufacturer: null,
  manufacturer_contact: null,
  as_info: null,
  cautions: null,
  application_notes: null,
  contraindications: null,
}

function KnowledgeForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: UpsertProductKnowledgeInput
  onSave: (data: UpsertProductKnowledgeInput) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<UpsertProductKnowledgeInput>(initial)
  const set = (field: keyof UpsertProductKnowledgeInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value || null }))

  return (
    <div className="space-y-3 py-3">
      {!initial.product_name && (
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">제품명 *</label>
          <input
            value={form.product_name}
            onChange={set('product_name')}
            placeholder="제품명 입력"
            className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">분류</label>
          <input
            value={form.category ?? ''}
            onChange={set('category')}
            placeholder="예: 휠체어, AAC"
            className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">제조사</label>
          <input
            value={form.manufacturer ?? ''}
            onChange={set('manufacturer')}
            placeholder="제조사명"
            className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">제조사 연락처</label>
          <input
            value={form.manufacturer_contact ?? ''}
            onChange={set('manufacturer_contact')}
            placeholder="전화번호 또는 이메일"
            className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">A/S 정보</label>
          <input
            value={form.as_info ?? ''}
            onChange={set('as_info')}
            placeholder="A/S 연락처 또는 절차"
            className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">주의사항</label>
        <textarea
          value={form.cautions ?? ''}
          onChange={set('cautions')}
          rows={2}
          placeholder="사용 시 주의해야 할 사항"
          className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">적용 사례 및 노하우</label>
        <textarea
          value={form.application_notes ?? ''}
          onChange={set('application_notes')}
          rows={2}
          placeholder="효과적인 적용 사례, 피팅 포인트 등"
          className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">금기 사항</label>
        <textarea
          value={form.contraindications ?? ''}
          onChange={set('contraindications')}
          rows={2}
          placeholder="이 제품을 사용하면 안 되는 경우"
          className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(form)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Check className="h-3.5 w-3.5" /> 저장
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <X className="h-3.5 w-3.5" /> 취소
        </button>
      </div>
    </div>
  )
}

function ProductRow({ item, onUpdated, onDeleted }: {
  item: ProductKnowledgeWithStats
  onUpdated: (updated: ProductKnowledgeWithStats) => void
  onDeleted: (productName: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const hasKnowledge = !!item.id

  const handleSave = (form: UpsertProductKnowledgeInput) => {
    if (!form.product_name) return
    startTransition(async () => {
      const result = await upsertProductKnowledge({ ...form, product_name: item.product_name || form.product_name })
      if (result.success && result.item) {
        onUpdated({ ...result.item, service_count: item.service_count })
        setEditing(false)
        setExpanded(true)
      }
    })
  }

  const handleDelete = () => {
    if (!item.id) return
    startTransition(async () => {
      const result = await deleteProductKnowledge(item.id)
      if (result.success) onDeleted(item.product_name)
    })
  }

  return (
    <div className="border-b last:border-b-0">
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
        onClick={() => { setExpanded((v) => !v); setEditing(false) }}
      >
        <span className="text-gray-400">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
          {item.category && <p className="text-xs text-gray-400">{item.category}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-400">{item.service_count}건 사용</span>
          {hasKnowledge ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 font-medium">
              <BookText className="h-3 w-3" /> 등록됨
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-400">
              미등록
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 bg-gray-50 border-t">
          {editing ? (
            <KnowledgeForm
              initial={{
                product_name: item.product_name,
                category: item.category,
                manufacturer: item.manufacturer,
                manufacturer_contact: item.manufacturer_contact,
                as_info: item.as_info,
                cautions: item.cautions,
                application_notes: item.application_notes,
                contraindications: item.contraindications,
              }}
              onSave={handleSave}
              onCancel={() => setEditing(false)}
            />
          ) : hasKnowledge ? (
            <div className="space-y-3 py-3">
              {(item.manufacturer || item.manufacturer_contact || item.as_info) && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <Phone className="h-3 w-3" /> 제조사 정보
                  </p>
                  {item.manufacturer && <p className="text-sm text-gray-700">{item.manufacturer}</p>}
                  {item.manufacturer_contact && <p className="text-sm text-gray-500">{item.manufacturer_contact}</p>}
                  {item.as_info && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Wrench className="h-3 w-3" /> A/S: {item.as_info}
                    </p>
                  )}
                </div>
              )}
              {item.cautions && (
                <div>
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide flex items-center gap-1 mb-1">
                    <AlertTriangle className="h-3 w-3" /> 주의사항
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.cautions}</p>
                </div>
              )}
              {item.application_notes && (
                <div>
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide flex items-center gap-1 mb-1">
                    <BookText className="h-3 w-3" /> 적용 사례 및 노하우
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.application_notes}</p>
                </div>
              )}
              {item.contraindications && (
                <div>
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wide flex items-center gap-1 mb-1">
                    <X className="h-3 w-3" /> 금기 사항
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.contraindications}</p>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditing(true) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 text-gray-600 hover:bg-white transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" /> 수정
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete() }}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> 삭제
                </button>
              </div>
            </div>
          ) : (
            <div className="py-3">
              <p className="text-sm text-gray-400 mb-3">이 제품에 대한 지식베이스 항목이 없습니다.</p>
              <button
                onClick={(e) => { e.stopPropagation(); setEditing(true) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> 지식베이스 등록
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ProductKnowledgePanel({ initialItems }: Props) {
  const [items, setItems] = useState<ProductKnowledgeWithStats[]>(initialItems)
  const [showAddNew, setShowAddNew] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleUpdated = (updated: ProductKnowledgeWithStats) => {
    setItems((prev) =>
      prev.some((i) => i.product_name === updated.product_name)
        ? prev.map((i) => i.product_name === updated.product_name ? updated : i)
        : [updated, ...prev]
    )
  }

  const handleDeleted = (productName: string) => {
    setItems((prev) => prev.map((i) =>
      i.product_name === productName
        ? { ...i, id: '', manufacturer: null, manufacturer_contact: null, as_info: null, cautions: null, application_notes: null, contraindications: null }
        : i
    ))
  }

  const handleAddNew = (form: UpsertProductKnowledgeInput) => {
    if (!form.product_name) return
    startTransition(async () => {
      const result = await upsertProductKnowledge(form)
      if (result.success && result.item) {
        handleUpdated({ ...result.item, service_count: 0 })
        setShowAddNew(false)
      }
    })
  }

  const knowledgeCount = items.filter((i) => !!i.id).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          전체 {items.length}개 제품 · 지식베이스 등록 {knowledgeCount}개
        </p>
        <button
          onClick={() => setShowAddNew((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          신규 제품 등록
        </button>
      </div>

      {showAddNew && (
        <div className="border rounded-lg bg-blue-50 px-4 py-3 mb-4">
          <p className="text-xs font-semibold text-blue-700 mb-2">신규 제품 지식베이스 등록</p>
          <KnowledgeForm
            initial={EMPTY_FORM}
            onSave={handleAddNew}
            onCancel={() => setShowAddNew(false)}
          />
        </div>
      )}

      {items.length === 0 ? (
        <div className="border rounded-lg p-8 bg-white text-center text-sm text-gray-400">
          제품 데이터가 없습니다.
        </div>
      ) : (
        <div className="border rounded-lg bg-white overflow-hidden">
          {items.map((item) => (
            <ProductRow
              key={item.product_name}
              item={item}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
