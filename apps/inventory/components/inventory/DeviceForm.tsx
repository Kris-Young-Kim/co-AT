'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { InventoryItem } from '@/actions/inventory-actions'

interface DeviceFormProps {
  defaultValues?: Partial<InventoryItem>
  onSubmit: (data: Partial<InventoryItem>) => Promise<{ success: boolean; error?: string; item?: InventoryItem }>
  submitLabel?: string
}

export function DeviceForm({ defaultValues, onSubmit, submitLabel = '저장' }: DeviceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const data: Partial<InventoryItem> = {
      name: fd.get('name') as string,
      asset_code: (fd.get('asset_code') as string) || null,
      category: (fd.get('category') as string) || null,
      status: (fd.get('status') as string) || '보관',
      manufacturer: (fd.get('manufacturer') as string) || null,
      model: (fd.get('model') as string) || null,
      purchase_date: (fd.get('purchase_date') as string) || null,
      purchase_price: fd.get('purchase_price') ? Number(fd.get('purchase_price')) : null,
      barcode: (fd.get('barcode') as string) || null,
      is_rental_available: fd.get('is_rental_available') === 'true',
    }

    const result = await onSubmit(data)
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? '저장에 실패했습니다')
      return
    }

    router.push(result.item ? `/devices/${result.item.id}` : '/devices')
    router.refresh()
  }

  const field = (
    name: string,
    label: string,
    opts?: { type?: string; required?: boolean; defaultValue?: string | number | null }
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{opts?.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        name={name}
        type={opts?.type ?? 'text'}
        defaultValue={opts?.defaultValue ?? undefined}
        required={opts?.required}
        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {field('name', '기기명', { required: true, defaultValue: defaultValues?.name })}
      {field('asset_code', '자산번호', { defaultValue: defaultValues?.asset_code })}
      {field('category', '카테고리', { defaultValue: defaultValues?.category })}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
        <select
          name="status"
          defaultValue={defaultValues?.status ?? '보관'}
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
        >
          {['보관', '대여중', '수리중', '소독중', '폐기'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {field('manufacturer', '제조사', { defaultValue: defaultValues?.manufacturer })}
      {field('model', '모델명', { defaultValue: defaultValues?.model })}
      {field('purchase_date', '구입일', { type: 'date', defaultValue: defaultValues?.purchase_date })}
      {field('purchase_price', '구입가격 (원)', { type: 'number', defaultValue: defaultValues?.purchase_price ?? undefined })}
      {field('barcode', '바코드', { defaultValue: defaultValues?.barcode })}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">대여 가능</label>
        <select
          name="is_rental_available"
          defaultValue={String(defaultValues?.is_rental_available ?? true)}
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
        >
          <option value="true">가능</option>
          <option value="false">불가</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '저장 중...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 border text-sm font-medium rounded-md hover:bg-gray-50"
        >
          취소
        </button>
      </div>
    </form>
  )
}
