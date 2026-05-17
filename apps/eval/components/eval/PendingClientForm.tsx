'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPendingClient } from '@/actions/client-actions'

const DISABILITY_OPTIONS = [
  { value: 'physical', label: '지체' },
  { value: 'brain_lesion', label: '뇌병변' },
  { value: 'visual', label: '시각' },
  { value: 'hearing', label: '청각' },
  { value: 'language', label: '언어' },
  { value: 'intellectual', label: '지적' },
  { value: 'autism', label: '자폐성' },
  { value: 'mental', label: '정신' },
  { value: 'kidney', label: '신장' },
  { value: 'cardiac', label: '심장' },
  { value: 'respiratory', label: '호흡기' },
  { value: 'liver', label: '간' },
  { value: 'face', label: '안면' },
  { value: 'intestine', label: '장루·요루' },
  { value: 'epilepsy', label: '뇌전증' },
]

export function PendingClientForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    birth_date: '',
    gender: '',
    contact: '',
    guardian_contact: '',
    disability_type: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('이름은 필수 입력 항목입니다')
      return
    }
    setLoading(true)
    setError(null)
    const result = await createPendingClient({
      name: form.name.trim(),
      birth_date: form.birth_date || null,
      gender: form.gender || null,
      contact: form.contact || null,
      guardian_contact: form.guardian_contact || null,
      disability_type: form.disability_type || null,
    })
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? '저장에 실패했습니다')
      return
    }
    router.push('/clients/pending')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="홍길동"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
          <input
            name="birth_date"
            type="date"
            value={form.birth_date}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">선택</option>
            <option value="male">남</option>
            <option value="female">여</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
        <input
          name="contact"
          value={form.contact}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="010-0000-0000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">보호자 연락처</label>
        <input
          name="guardian_contact"
          value={form.guardian_contact}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="010-0000-0000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">장애유형</label>
        <select
          name="disability_type"
          value={form.disability_type}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">선택</option>
          {DISABILITY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-2 px-4 border rounded-lg font-medium text-gray-700 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '저장 중...' : '임시 저장'}
        </button>
      </div>
    </form>
  )
}
