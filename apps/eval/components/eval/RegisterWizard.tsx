'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerClient } from '@/actions/client-actions'
import type { Client, StaffMember } from '@/actions/client-actions'

interface RegisterWizardProps {
  client: Client
  nextCode: string
  staffMembers: StaffMember[]
}

export function RegisterWizard({ client, nextCode, staffMembers }: RegisterWizardProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [assignedStaffId, setAssignedStaffId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit() {
    if (!assignedStaffId) {
      setError('담당자를 선택해 주세요')
      return
    }
    setLoading(true)
    setError(null)
    const result = await registerClient(client.id, assignedStaffId)
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? '등록에 실패했습니다')
      return
    }
    router.push(`/clients/${client.id}`)
    router.refresh()
  }

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-2 mb-8">
        <div className={`flex items-center gap-2 text-sm ${step === 1 ? 'text-blue-600 font-medium' : step > 1 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            step > 1 ? 'bg-green-500 text-white' : step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>1</span>
          등록코드 확인
        </div>
        <div className="flex-1 h-px bg-gray-200" />
        <div className={`flex items-center gap-2 text-sm ${step === 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>2</span>
          담당자 지정
        </div>
      </div>

      {step === 1 && (
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-lg font-semibold mb-4">등록코드 자동 생성</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-sm text-blue-600 mb-1">발급 예정 등록코드</p>
            <p className="text-2xl font-bold text-blue-700 font-mono">{nextCode}</p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            등록 완료 시 위 코드가 자동으로 발급됩니다. 동시 등록 시 실제 코드가 달라질 수 있습니다.
          </p>
          <button
            onClick={() => setStep(2)}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            다음
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-lg font-semibold mb-4">담당자 지정</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">담당 직원</label>
            <select
              value={assignedStaffId}
              onChange={e => setAssignedStaffId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">담당자 선택</option>
              {staffMembers.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.fullName ?? staff.email ?? staff.id}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => { setStep(1); setError(null) }}
              className="flex-1 py-2 px-4 border rounded-lg font-medium text-gray-700 hover:bg-gray-50"
            >
              이전
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '처리 중...' : '등록 완료'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
