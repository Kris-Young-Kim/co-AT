'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { CreateEmployeeInput, HrEmployee, EmploymentType } from '@co-at/types'
import { createEmployee, updateEmployee } from '@/actions/employee-actions'

interface Props {
  initial?: HrEmployee
}

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'full_time',  label: '정규직' },
  { value: 'part_time',  label: '파트타임' },
  { value: 'contract',   label: '계약직' },
  { value: 'daily',      label: '일용직' },
]

export function EmployeeForm({ initial }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    const input: CreateEmployeeInput = {
      clerk_user_id:   (form.get('clerk_user_id') as string) || undefined,
      name:            form.get('name') as string,
      email:           form.get('email') as string,
      phone:           (form.get('phone') as string) || undefined,
      department:      form.get('department') as string,
      position:        form.get('position') as string,
      employment_type: form.get('employment_type') as EmploymentType,
      hire_date:       form.get('hire_date') as string,
      leave_date:      (form.get('leave_date') as string) || undefined,
    }

    const result = initial
      ? await updateEmployee(initial.id, input)
      : await createEmployee(input)

    if (!result) {
      setError('저장에 실패했습니다.')
      setLoading(false)
      return
    }
    router.push('/employees')
    router.refresh()
  }

  const f = (name: string) => initial ? (initial as any)[name] ?? '' : ''

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Field label="이름" name="name" required defaultValue={f('name')} />
      <Field label="이메일" name="email" type="email" required defaultValue={f('email')} />
      <Field label="전화번호" name="phone" defaultValue={f('phone')} />
      <Field label="Clerk User ID" name="clerk_user_id" defaultValue={f('clerk_user_id')} />
      <Field label="부서" name="department" required defaultValue={f('department')} />
      <Field label="직책" name="position" required defaultValue={f('position')} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">고용 유형</label>
        <select
          name="employment_type"
          defaultValue={f('employment_type') || 'full_time'}
          className="w-full border rounded-md px-3 py-2 text-sm"
          required
        >
          {EMPLOYMENT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <Field label="입사일" name="hire_date" type="date" required defaultValue={f('hire_date')} />
      <Field label="퇴직일" name="leave_date" type="date" defaultValue={f('leave_date')} />

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-violet-600 text-white px-4 py-2 rounded-md text-sm hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? '저장 중...' : initial ? '수정' : '등록'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border px-4 py-2 rounded-md text-sm hover:bg-gray-50"
        >
          취소
        </button>
      </div>
    </form>
  )
}

function Field({
  label, name, type = 'text', required, defaultValue
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  defaultValue?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
      />
    </div>
  )
}
