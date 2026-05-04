'use client'

import { useState, useEffect } from 'react'
import { getAllowanceTypes, createAllowanceType, deactivateAllowanceType } from '@/actions/allowance-type-actions'
import type { HrAllowanceType } from '@co-at/types'
import { Trash2 } from 'lucide-react'

export default function AllowanceTypesPage() {
  const [types, setTypes] = useState<HrAllowanceType[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() { setTypes(await getAllowanceTypes()) }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await createAllowanceType({ name: name.trim() })
    if (!result) { setError('저장에 실패했습니다.'); setLoading(false); return }
    setName('')
    await load()
    setLoading(false)
  }

  async function handleDeactivate(id: string) {
    if (!confirm('비활성화하시겠습니까?')) return
    await deactivateAllowanceType(id)
    await load()
  }

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">수당 유형 설정</h1>

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">수당 유형 추가</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-3">
          <input value={name} onChange={e => setName(e.target.value)} required
            placeholder="예: 교통비"
            className="flex-1 border rounded-md px-3 py-2 text-sm" />
          <button type="submit" disabled={loading}
            className="bg-violet-600 text-white px-4 py-2 rounded-md text-sm hover:bg-violet-700 disabled:opacity-50">
            {loading ? '저장 중...' : '추가'}
          </button>
        </div>
      </form>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['수당명', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {types.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{t.name}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDeactivate(t.id)}
                    className="text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {types.length === 0 && (
              <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-400">등록된 수당 유형이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
