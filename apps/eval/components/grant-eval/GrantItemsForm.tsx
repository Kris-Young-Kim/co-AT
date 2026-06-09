'use client'

import { useState, useTransition } from 'react'
import { upsertGrantItem, deleteGrantItem, type GrantItemInput } from '@/actions/grant-item-actions'
import type { GrantAssessmentItem } from '@/actions/grant-assessment-actions'

const ITEM_CATEGORIES = [
  '전동휠체어', '수동휠체어', '전동침대', '목욕의자', '보행차',
  '이동변기', '소변수집장치', '욕창방지방석', '욕창방지매트리스',
  '보청기', '시각보조기기', '의사소통보조기기',
]
const USE_LOCATIONS = ['가정', '직장', '학교', '기타'] as const

interface ItemFormState {
  item_category: string
  item_name: string
  use_plan: string
  use_location: string
  use_location_detail: string
  usage_experience: boolean | null
  self_usage_possible: boolean | null
  support_person: string
}

function toFormState(item?: GrantAssessmentItem): ItemFormState {
  return {
    item_category: item?.item_category ?? '',
    item_name: item?.item_name ?? '',
    use_plan: item?.use_plan ?? '',
    use_location: item?.use_location ?? '',
    use_location_detail: item?.use_location_detail ?? '',
    usage_experience: item?.usage_experience ?? null,
    self_usage_possible: item?.self_usage_possible ?? null,
    support_person: item?.support_person ?? '',
  }
}

interface ItemCardProps {
  assessmentId: string
  order: number
  initial?: GrantAssessmentItem
  onDelete: () => void
}

function ItemCard({ assessmentId, order, initial, onDelete }: ItemCardProps) {
  const [form, setForm] = useState<ItemFormState>(toFormState(initial))
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof ItemFormState, value: string | boolean | null) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const input: GrantItemInput = {
        item_category: form.item_category,
        item_name: form.item_name || null,
        use_plan: form.use_plan || null,
        use_location: form.use_location || null,
        use_location_detail: form.use_location_detail || null,
        usage_experience: form.usage_experience,
        self_usage_possible: form.self_usage_possible,
        support_person: form.support_person || null,
      }
      const result = await upsertGrantItem(assessmentId, order, input)
      if (result.success) { setSaved(true); setError(null) }
      else setError(result.error ?? '저장 실패')
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteGrantItem(assessmentId, order)
      if (result.success) onDelete()
      else setError(result.error ?? '삭제 실패')
    })
  }

  return (
    <div className="border rounded-lg p-5 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">품목 {order}</h3>
        <button type="button" onClick={handleDelete} disabled={isPending}
          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50">삭제</button>
      </div>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">품목 분류 *</label>
            <select
              required
              value={form.item_category}
              onChange={(e) => set('item_category', e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
            >
              <option value="">선택</option>
              {ITEM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">품목명 (모델)</label>
            <input value={form.item_name} onChange={(e) => set('item_name', e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">활용 계획</label>
          <textarea rows={2} value={form.use_plan} onChange={(e) => set('use_plan', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사용 환경</label>
            <select value={form.use_location} onChange={(e) => set('use_location', e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none">
              <option value="">선택</option>
              {USE_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사용 환경 상세</label>
            <input value={form.use_location_detail} onChange={(e) => set('use_location_detail', e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">사용 경험</label>
            <div className="flex gap-3">
              {([true, false] as const).map((v) => (
                <label key={String(v)} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" checked={form.usage_experience === v}
                    onChange={() => set('usage_experience', v)} />
                  {v ? '있음' : '없음'}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">자가 사용 가능</label>
            <div className="flex gap-3">
              {([true, false] as const).map((v) => (
                <label key={String(v)} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" checked={form.self_usage_possible === v}
                    onChange={() => set('self_usage_possible', v)} />
                  {v ? '가능' : '불가'}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">보조인</label>
            <input value={form.support_person} onChange={(e) => set('support_person', e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-600">저장됨</p>}
        <button type="submit" disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {isPending ? '저장 중...' : '품목 저장'}
        </button>
      </form>
    </div>
  )
}

interface Props {
  assessmentId: string
  items: GrantAssessmentItem[]
}

export function GrantItemsForm({ assessmentId, items }: Props) {
  const [localItems, setLocalItems] = useState(items)

  const usedOrders = new Set(localItems.map((i) => i.item_order))
  const nextOrder = ([1, 2, 3] as const).find((o) => !usedOrders.has(o))

  return (
    <div className="space-y-4">
      {localItems.map((item) => (
        <ItemCard
          key={item.item_order}
          assessmentId={assessmentId}
          order={item.item_order}
          initial={item}
          onDelete={() => setLocalItems((prev) => prev.filter((i) => i.item_order !== item.item_order))}
        />
      ))}

      {nextOrder && (
        <button
          type="button"
          onClick={() => setLocalItems((prev) => [...prev, { item_order: nextOrder, item_category: '' } as GrantAssessmentItem])}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600"
        >
          + 품목 추가 (최대 3개)
        </button>
      )}

      {localItems.length === 0 && (
        <p className="text-sm text-gray-400 py-4 text-center">품목을 추가해주세요</p>
      )}
    </div>
  )
}
