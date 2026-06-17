"use client"

import { useState, useTransition } from 'react'
import { updateClientLifecycle, addClientTag, removeClientTag } from '@/actions/client-actions'
import type { LifecycleStatus, ClientTag } from '@/actions/client-actions'
import { X, Plus, Loader2 } from 'lucide-react'

const LIFECYCLE_OPTIONS: { value: LifecycleStatus; label: string; className: string }[] = [
  { value: 'active',   label: '활성',       className: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'inactive', label: '장기미접촉', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'closed',   label: '종결',       className: 'bg-gray-100 text-gray-500 border-gray-200' },
  { value: 'readmit',  label: '재접수',     className: 'bg-blue-100 text-blue-700 border-blue-200' },
]

interface Props {
  clientId: string
  initialLifecycle: string
  initialTags: ClientTag[]
}

export function ClientCrmPanel({ clientId, initialLifecycle, initialTags }: Props) {
  const [lifecycle, setLifecycle] = useState(initialLifecycle || 'active')
  const [tags, setTags] = useState<ClientTag[]>(initialTags)
  const [newTag, setNewTag] = useState('')
  const [tagError, setTagError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleLifecycleChange = (value: string) => {
    setLifecycle(value)
    startTransition(async () => {
      await updateClientLifecycle(clientId, value as LifecycleStatus)
    })
  }

  const handleAddTag = () => {
    const trimmed = newTag.trim()
    if (!trimmed) return
    setTagError(null)
    startTransition(async () => {
      const result = await addClientTag(clientId, trimmed)
      if (result.success && result.tag) {
        setTags(prev => [...prev, result.tag!])
        setNewTag('')
      } else {
        setTagError(result.error ?? '태그 추가 실패')
      }
    })
  }

  const handleRemoveTag = (tagId: string) => {
    startTransition(async () => {
      const result = await removeClientTag(tagId, clientId)
      if (result.success) {
        setTags(prev => prev.filter(t => t.id !== tagId))
      }
    })
  }

  const currentOption = LIFECYCLE_OPTIONS.find(o => o.value === lifecycle) ?? LIFECYCLE_OPTIONS[0]

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">생애주기 관리</h3>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-500">상태</span>
        <select
          value={lifecycle}
          onChange={e => handleLifecycleChange(e.target.value)}
          disabled={isPending}
          className="text-sm border rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
        >
          {LIFECYCLE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${currentOption.className}`}>
          {currentOption.label}
        </span>
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-2">태그</p>
        <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
          {tags.length === 0 && (
            <p className="text-xs text-gray-400">등록된 태그 없음</p>
          )}
          {tags.map(t => (
            <span
              key={t.id}
              className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs border border-indigo-100"
            >
              {t.tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(t.id)}
                disabled={isPending}
                className="hover:text-red-500 disabled:opacity-50 leading-none"
                aria-label={`태그 삭제: ${t.tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); handleAddTag() }
            }}
            placeholder="태그 입력 (최대 20자)"
            maxLength={20}
            className="flex-1 text-sm border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={isPending || !newTag.trim()}
            className="flex items-center gap-1 px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            추가
          </button>
        </div>
        {tagError && <p className="text-xs text-red-500 mt-1">{tagError}</p>}
      </div>
    </div>
  )
}
