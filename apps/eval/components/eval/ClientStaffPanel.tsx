'use client'

import { useState, useTransition } from 'react'
import { UserCog, Check, X, ChevronDown } from 'lucide-react'
import { changeAssignedStaff, type StaffMember } from '@/actions/client-actions'

interface Props {
  clientId: string
  initialStaffId: string | null
  staffMembers: StaffMember[]
}

export function ClientStaffPanel({ clientId, initialStaffId, staffMembers }: Props) {
  const [staffId, setStaffId] = useState<string | null>(initialStaffId)
  const [editing, setEditing] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(initialStaffId)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>('')

  const currentStaff = staffMembers.find((s) => s.id === staffId)

  const handleSave = () => {
    setError('')
    startTransition(async () => {
      const result = await changeAssignedStaff(clientId, pendingId)
      if (result.success) {
        setStaffId(pendingId)
        setEditing(false)
      } else {
        setError(result.error ?? '변경에 실패했습니다')
      }
    })
  }

  const handleCancel = () => {
    setPendingId(staffId)
    setEditing(false)
    setError('')
  }

  return (
    <div className="border rounded-lg p-5 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <UserCog className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">담당자</h3>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:underline"
          >
            변경
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="relative">
            <select
              value={pendingId ?? ''}
              onChange={(e) => setPendingId(e.target.value || null)}
              className="w-full appearance-none border rounded-md px-3 py-2 pr-8 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">담당자 없음</option>
              {staffMembers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName ?? s.email ?? s.id}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              {isPending ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              취소
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-700">
          {currentStaff
            ? (currentStaff.fullName ?? currentStaff.email ?? '—')
            : <span className="text-gray-400">담당자 미배정</span>}
        </p>
      )}
    </div>
  )
}
