'use client'

import { useState, useTransition } from 'react'
import {
  linkPortalUser,
  linkPortalUserByName,
  unlinkPortalUser,
  type PortalUserInfo,
} from '@/actions/client-actions'
import { Link2, Link2Off, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface Props {
  clientId: string
  linkedUser: PortalUserInfo | null
}

type Mode = 'email' | 'phone' | 'name'

const MODE_LABELS: Record<Mode, string> = {
  email: '이메일',
  phone: '휴대전화',
  name: '이름+생년월일',
}

export function PortalUserLink({ clientId, linkedUser: initial }: Props) {
  const [linkedUser, setLinkedUser] = useState<PortalUserInfo | null>(initial)
  const [mode, setMode] = useState<Mode>('email')
  const [value, setValue] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function resetInputs() {
    setValue('')
    setBirthDate('')
    setError(null)
  }

  function handleLink() {
    if (mode === 'name' && (!value.trim() || !birthDate)) return
    if (mode !== 'name' && !value.trim()) return
    setError(null)

    startTransition(async () => {
      let result: { success: boolean; error?: string }

      if (mode === 'name') {
        result = await linkPortalUserByName(clientId, value.trim(), birthDate)
      } else {
        result = await linkPortalUser(clientId, value.trim(), mode)
      }

      if (!result.success) {
        setError(result.error ?? '연결에 실패했습니다')
        return
      }

      const displayLabel = mode === 'name' ? value.trim() : value.trim()
      setLinkedUser({ id: '', email: displayLabel, fullName: mode === 'name' ? value.trim() : null })
      resetInputs()
    })
  }

  function handleUnlink() {
    setError(null)
    startTransition(async () => {
      const result = await unlinkPortalUser(clientId)
      if (!result.success) {
        setError(result.error ?? '연결 해제에 실패했습니다')
        return
      }
      setLinkedUser(null)
    })
  }

  const canSubmit = isPending
    ? false
    : mode === 'name'
    ? !!value.trim() && !!birthDate
    : !!value.trim()

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-gray-900">포털 계정 연결</h2>
        {linkedUser ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3" />
            연결됨
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            <XCircle className="h-3 w-3" />
            미연결
          </span>
        )}
      </div>

      {linkedUser ? (
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-gray-700">
            <span className="text-gray-500">계정: </span>
            <span className="font-medium">
              {linkedUser.fullName
                ? `${linkedUser.fullName} (${linkedUser.email})`
                : linkedUser.email}
            </span>
          </div>
          <button
            onClick={handleUnlink}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Link2Off className="h-3 w-3" />
            )}
            연결 해제
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            대상자의 포털(gwatc.cloud) 계정을 연결하면 마이페이지에서 본인 서비스 이력을 확인할 수 있습니다.
          </p>

          {/* 검색 방법 탭 */}
          <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg w-fit">
            {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); resetInputs() }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  mode === m
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          {mode === 'name' ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="이름"
                  disabled={isPending}
                  className="flex-1 px-3 py-1.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  disabled={isPending}
                  className="flex-1 px-3 py-1.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              <button
                onClick={handleLink}
                disabled={!canSubmit}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Link2 className="h-3 w-3" />
                )}
                연결
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type={mode === 'email' ? 'email' : 'tel'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLink()}
                placeholder={mode === 'email' ? '이메일 주소' : '010-0000-0000'}
                disabled={isPending}
                className="flex-1 px-3 py-1.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                onClick={handleLink}
                disabled={!canSubmit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Link2 className="h-3 w-3" />
                )}
                연결
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
