'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createReferrer, updateReferrer,
  REFERRER_TYPE_LABELS,
  type Referrer, type CreateReferrerInput, type ReferrerType,
} from '@/actions/referrer-actions'

const TYPE_OPTIONS = Object.entries(REFERRER_TYPE_LABELS) as [ReferrerType, string][]

interface Props {
  defaultValues?: Partial<Referrer>
  mode?: 'create' | 'edit'
}

export function ReferrerForm({ defaultValues, mode = 'create' }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    const input: CreateReferrerInput = {
      name:    (fd.get('name') as string).trim(),
      type:    fd.get('type') as ReferrerType,
      address: (fd.get('address') as string).trim() || undefined,
      phone:   (fd.get('phone') as string).trim() || undefined,
      email:   (fd.get('email') as string).trim() || undefined,
      website: (fd.get('website') as string).trim() || undefined,
      notes:   (fd.get('notes') as string).trim() || undefined,
    }

    startTransition(async () => {
      setError(null)
      let res
      if (mode === 'edit' && defaultValues?.id) {
        res = await updateReferrer(defaultValues.id, input)
      } else {
        res = await createReferrer(input)
      }

      if (!res.success) {
        setError(res.error ?? '저장에 실패했습니다')
        return
      }

      if (mode === 'create' && 'referrer' in res && res.referrer) {
        router.push(`/referrers/${(res.referrer as Referrer).id}`)
      } else {
        router.push('/referrers')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            기관명 <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            required
            defaultValue={defaultValues?.name}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="기관명을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            기관 유형 <span className="text-red-500">*</span>
          </label>
          <select
            name="type"
            required
            defaultValue={defaultValues?.type}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">선택하세요</option>
            {TYPE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
          <input
            name="phone"
            defaultValue={defaultValues?.phone ?? ''}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="033-000-0000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
          <input
            name="email"
            type="email"
            defaultValue={defaultValues?.email ?? ''}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="contact@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">웹사이트</label>
          <input
            name="website"
            defaultValue={defaultValues?.website ?? ''}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://..."
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
          <input
            name="address"
            defaultValue={defaultValues?.address ?? ''}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="강원특별자치도 ..."
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
          <textarea
            name="notes"
            defaultValue={defaultValues?.notes ?? ''}
            rows={3}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="특이사항 등 자유 기재"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? '저장 중...' : mode === 'create' ? '등록' : '수정 저장'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 border text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
      </div>
    </form>
  )
}
