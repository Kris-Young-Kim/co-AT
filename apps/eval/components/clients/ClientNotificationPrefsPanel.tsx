'use client'

import { useState, useTransition } from 'react'
import { Bell, Mail } from 'lucide-react'
import { upsertNotificationPreference } from '@/actions/notification-preference-actions'
import type { NotificationPreference } from '@/actions/notification-preference-actions'

interface Props {
  clientId: string
  initialPref?: NotificationPreference
}

export function ClientNotificationPrefsPanel({ clientId, initialPref }: Props) {
  const [emailOptOut, setEmailOptOut] = useState(initialPref?.email_opt_out ?? false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggle(field: 'email_opt_out') {
    const newVal = !emailOptOut
    setEmailOptOut(newVal)
    setError(null)
    startTransition(async () => {
      const res = await upsertNotificationPreference(clientId, { [field]: newVal })
      if (!res.success) {
        setEmailOptOut(!newVal)
        setError(res.error ?? '저장 실패')
      }
    })
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Bell className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700">알림 수신 설정</h3>
      </div>

      <div className="space-y-2">
        <label className="flex items-center justify-between py-2 px-3 rounded-lg border bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-700">이메일 알림</span>
            <span className="text-xs text-gray-400">(대여 확정·반납·연장)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {emailOptOut ? '수신 거부' : '수신 중'}
            </span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => toggle('email_opt_out')}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                emailOptOut ? 'bg-gray-300' : 'bg-blue-600'
              } disabled:opacity-50`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  emailOptOut ? 'translate-x-1' : 'translate-x-5'
                }`}
              />
            </button>
          </div>
        </label>
      </div>

      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  )
}
