'use client'

import { useState, useTransition } from 'react'
import { Button } from '@co-at/ui/button'
import { Input } from '@co-at/ui/input'
import { Textarea } from '@co-at/ui/textarea'
import { Label } from '@co-at/ui/label'

interface Profile {
  id: string
  name: string
  role: string
}

interface Props {
  profiles: Profile[]
}

export function SendForm({ profiles }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [title, setTitle]             = useState('')
  const [body, setBody]               = useState('')
  const [result, setResult]           = useState<{ successCount: number; failCount: number } | null>(null)
  const [isPending, startTransition]  = useTransition()

  function toggleAll() {
    setSelectedIds(selectedIds.length === profiles.length ? [] : profiles.map(p => p.id))
  }

  function toggleOne(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleSubmit() {
    if (!title || !body || selectedIds.length === 0) return
    startTransition(async () => {
      const res = await fetch('/api/notify/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedIds, title, body }),
      })
      const data = await res.json() as { successCount: number; failCount: number }
      setResult(data)
      setTitle('')
      setBody('')
      setSelectedIds([])
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="font-semibold">대상 선택 ({selectedIds.length}/{profiles.length}명)</h2>
        <div className="flex items-center gap-2 mb-2">
          <input type="checkbox" id="all" checked={selectedIds.length === profiles.length && profiles.length > 0} onChange={toggleAll} className="w-4 h-4" />
          <label htmlFor="all" className="text-sm cursor-pointer">전체 선택</label>
        </div>
        <div className="max-h-48 overflow-y-auto space-y-1 border rounded p-2">
          {profiles.map(p => (
            <div key={p.id} className="flex items-center gap-2">
              <input type="checkbox" id={p.id} checked={selectedIds.includes(p.id)} onChange={() => toggleOne(p.id)} className="w-4 h-4" />
              <label htmlFor={p.id} className="text-sm cursor-pointer">{p.name} <span className="text-gray-400">({p.role})</span></label>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="font-semibold">알림 내용</h2>
        <div className="space-y-1.5">
          <Label htmlFor="title">제목</Label>
          <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="알림 제목" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="body">내용</Label>
          <Textarea id="body" value={body} onChange={e => setBody(e.target.value)} placeholder="알림 내용" rows={4} />
        </div>
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded p-4 text-sm">
          발송 완료 — 성공: {result.successCount}건, 실패: {result.failCount}건
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isPending || !title || !body || selectedIds.length === 0}
        className="w-full"
      >
        {isPending ? '발송 중...' : `${selectedIds.length}명에게 발송`}
      </Button>
    </div>
  )
}
