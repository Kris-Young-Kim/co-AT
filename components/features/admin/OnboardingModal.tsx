'use client'

import { useEffect, useState, useTransition } from 'react'
import { X, Loader2, CheckSquare, Square } from 'lucide-react'

type AppKey = 'eval' | 'inventory' | 'stats' | 'automation' | 'hr' | 'approval' | 'finance'
type UserRole = 'user' | 'staff' | 'manager' | 'admin'

const APP_LABELS: Record<AppKey, string> = {
  eval:       '상담·평가',
  inventory:  '자산·재고',
  stats:      '성과 대시보드',
  automation: '업무 자동화',
  hr:         '인사 관리',
  approval:   '전자결재',
  finance:    '예산·재무',
}

const ROLE_LABELS: Record<UserRole, string> = {
  user:    '일반 사용자',
  staff:   '직원 (STAFF)',
  manager: '매니저 (MANAGER)',
  admin:   '관리자 (ADMIN)',
}

interface Props {
  userId: string
  userName: string | null
  userEmail: string | null
  onClose: () => void
  onSaved: () => void
}

export function OnboardingModal({ userId, userName, userEmail, onClose, onSaved }: Props) {
  const [role, setRole] = useState<UserRole>('staff')
  const [apps, setApps] = useState<AppKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/users/${userId}/permissions`)
      .then(r => r.json())
      .then(data => {
        if (data.role) setRole(data.role as UserRole)
        if (Array.isArray(data.apps)) setApps(data.apps as AppKey[])
      })
      .catch(() => setError('권한 정보를 불러오지 못했습니다'))
      .finally(() => setIsLoading(false))
  }, [userId])

  function toggleApp(key: AppKey) {
    setApps(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key])
  }

  function selectAllApps() {
    setApps(Object.keys(APP_LABELS) as AppKey[])
  }

  function clearAllApps() {
    setApps([])
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, apps }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '저장에 실패했습니다')
        return
      }
      onSaved()
      onClose()
    })
  }

  const isAdmin = role === 'admin'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 mb-1">앱 접근 권한 설정</h2>
        <p className="text-sm text-gray-500 mb-6">
          {userName ?? '—'} · {userEmail ?? '—'}
        </p>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Role selector */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">역할</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                {(Object.keys(ROLE_LABELS) as UserRole[]).map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>

            {/* App access */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">앱 접근 권한</label>
                {!isAdmin && (
                  <div className="flex gap-2 text-xs text-gray-500">
                    <button onClick={selectAllApps} className="hover:text-gray-900">전체 선택</button>
                    <span>·</span>
                    <button onClick={clearAllApps} className="hover:text-gray-900">전체 해제</button>
                  </div>
                )}
              </div>

              {isAdmin ? (
                <p className="text-sm text-blue-600 bg-blue-50 rounded-md px-3 py-2">
                  관리자(ADMIN)는 모든 앱에 자동으로 접근할 수 있습니다.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(APP_LABELS) as [AppKey, string][]).map(([key, label]: [AppKey, string]) => {
                    const checked = apps.includes(key)
                    return (
                      <button
                        key={key}
                        onClick={() => toggleApp(key)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors text-left
                          ${checked
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-200 text-gray-700 hover:border-gray-400'
                          }`}
                      >
                        {checked
                          ? <CheckSquare className="h-4 w-4 shrink-0" />
                          : <Square className="h-4 w-4 shrink-0 text-gray-400" />
                        }
                        {label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {error && (
              <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                저장
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
