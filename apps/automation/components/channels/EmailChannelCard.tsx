'use client'

import { useState, useTransition } from 'react'
import { Mail } from 'lucide-react'
import { toggleChannel, saveChannelConfig, markChannelTested } from '@/actions/channel-actions'
import { Switch } from '@co-at/ui/switch'
import { Button } from '@co-at/ui/button'
import { Input } from '@co-at/ui/input'
import { Label } from '@co-at/ui/label'

interface Channel {
  channel_type: string
  is_enabled: boolean
  config: { apiKey?: string; fromEmail?: string } | null
  last_tested_at: string | null
}

export function EmailChannelCard({ channel }: { channel: Channel }) {
  const [enabled, setEnabled]     = useState(channel.is_enabled)
  const [apiKey, setApiKey]       = useState(channel.config?.apiKey ?? '')
  const [fromEmail, setFromEmail] = useState(channel.config?.fromEmail ?? '')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function handleToggle(val: boolean) {
    setEnabled(val)
    startTransition(async () => {
      await toggleChannel('email', val)
      setMessage(val ? '이메일 채널을 활성화했습니다.' : '이메일 채널을 비활성화했습니다.')
    })
  }

  function handleSave() {
    startTransition(async () => {
      await saveChannelConfig('email', { apiKey, fromEmail })
      setMessage('설정이 저장되었습니다.')
    })
  }

  function handleTest() {
    startTransition(async () => {
      await markChannelTested('email')
      setMessage('테스트 발송 완료 (Resend 대시보드에서 확인)')
    })
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-md"><Mail className="w-5 h-5 text-blue-600" /></div>
          <div>
            <h3 className="font-semibold">이메일 (Resend)</h3>
            <p className="text-xs text-gray-500">대여 만료·일정 리마인더 이메일 발송</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} disabled={isPending} />
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="apiKey">Resend API Key</Label>
          <Input id="apiKey" type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="re_..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fromEmail">발신 이메일</Label>
          <Input id="fromEmail" value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="noreply@gwatc.cloud" />
        </div>
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleTest} disabled={isPending}>테스트 발송</Button>
        <Button size="sm" onClick={handleSave} disabled={isPending}>저장</Button>
      </div>
      {channel.last_tested_at && (
        <p className="text-xs text-gray-400">마지막 테스트: {new Date(channel.last_tested_at).toLocaleString('ko-KR')}</p>
      )}
    </div>
  )
}
