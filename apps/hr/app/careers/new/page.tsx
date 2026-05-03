'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createCareer } from '@/actions/career-actions'
import type { CreateCareerInput } from '@co-at/types'

export default function NewCareerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultEmployeeId = searchParams.get('employeeId') ?? ''

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    const input: CreateCareerInput = {
      employee_id:  form.get('employee_id') as string,
      organization: form.get('organization') as string,
      position:     form.get('position') as string,
      start_date:   form.get('start_date') as string,
      end_date:     (form.get('end_date') as string) || undefined,
      description:  (form.get('description') as string) || undefined,
    }
    const result = await createCareer(input)
    if (!result) {
      setError('저장에 실패했습니다.')
      setLoading(false)
      return
    }
    router.back()
    router.refresh()
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">경력 등록</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Field label="직원 ID" name="employee_id" required defaultValue={defaultEmployeeId} />
        <Field label="기관/회사명" name="organization" required />
        <Field label="직책" name="position" required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="시작일" name="start_date" type="date" required />
          <Field label="종료일" name="end_date" type="date" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
          <textarea name="description" rows={3}
            className="w-full border rounded-md px-3 py-2 text-sm resize-none" />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className="bg-violet-600 text-white px-4 py-2 rounded-md text-sm hover:bg-violet-700 disabled:opacity-50">
            {loading ? '저장 중...' : '등록'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="border px-4 py-2 rounded-md text-sm hover:bg-gray-50">
            취소
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, name, type = 'text', required, defaultValue }: {
  label: string; name: string; type?: string; required?: boolean; defaultValue?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input name={name} type={type} defaultValue={defaultValue} required={required}
        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
    </div>
  )
}
