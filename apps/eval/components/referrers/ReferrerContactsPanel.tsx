'use client'

import { useState, useTransition } from 'react'
import {
  createContact, updateContact, deleteContact,
  type ReferrerContact, type CreateContactInput,
} from '@/actions/referrer-actions'
import { UserPlus, UserX, Pencil, Check, X } from 'lucide-react'

interface Props {
  referrerId: string
  initialContacts: ReferrerContact[]
}

interface EditState {
  id: string
  name: string
  position: string
  phone: string
  email: string
  notes: string
}

export function ReferrerContactsPanel({ referrerId, initialContacts }: Props) {
  const [contacts, setContacts] = useState(initialContacts)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [newForm, setNewForm] = useState<Omit<CreateContactInput, 'referrer_id'>>({
    name: '', position: '', phone: '', email: '', notes: '',
  })

  function handleAdd() {
    if (!newForm.name.trim()) return
    startTransition(async () => {
      setError(null)
      const res = await createContact({ referrer_id: referrerId, ...newForm })
      if (!res.success) { setError(res.error ?? '오류'); return }
      setContacts((prev) => [...prev, res.contact!])
      setNewForm({ name: '', position: '', phone: '', email: '', notes: '' })
      setShowAddForm(false)
    })
  }

  function handleDeactivate(id: string) {
    startTransition(async () => {
      const res = await updateContact(id, referrerId, { is_active: false })
      if (!res.success) { setError(res.error ?? '오류'); return }
      setContacts((prev) => prev.map((c) => c.id === id ? { ...c, is_active: false } : c))
    })
  }

  function handleReactivate(id: string) {
    startTransition(async () => {
      const res = await updateContact(id, referrerId, { is_active: true })
      if (!res.success) { setError(res.error ?? '오류'); return }
      setContacts((prev) => prev.map((c) => c.id === id ? { ...c, is_active: true } : c))
    })
  }

  function startEdit(c: ReferrerContact) {
    setEditState({
      id: c.id,
      name: c.name,
      position: c.position ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      notes: c.notes ?? '',
    })
  }

  function handleSaveEdit() {
    if (!editState) return
    startTransition(async () => {
      const { id, ...rest } = editState
      const res = await updateContact(id, referrerId, {
        name: rest.name,
        position: rest.position || undefined,
        phone: rest.phone || undefined,
        email: rest.email || undefined,
        notes: rest.notes || undefined,
      })
      if (!res.success) { setError(res.error ?? '오류'); return }
      setContacts((prev) => prev.map((c) =>
        c.id === id ? { ...c, ...rest, position: rest.position || null, phone: rest.phone || null, email: rest.email || null, notes: rest.notes || null } : c
      ))
      setEditState(null)
    })
  }

  const active = contacts.filter((c) => c.is_active)
  const inactive = contacts.filter((c) => !c.is_active)

  return (
    <div className="space-y-4">
      {error && <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>}

      <div className="flex justify-end">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          담당자 추가
        </button>
      </div>

      {showAddForm && (
        <div className="border rounded-lg p-4 bg-blue-50 space-y-3">
          <p className="text-sm font-medium text-blue-900">새 담당자</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={newForm.name}
              onChange={(e) => setNewForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="이름 *"
              className="px-3 py-1.5 border rounded-md text-sm bg-white"
            />
            <input
              value={newForm.position}
              onChange={(e) => setNewForm((p) => ({ ...p, position: e.target.value }))}
              placeholder="직위"
              className="px-3 py-1.5 border rounded-md text-sm bg-white"
            />
            <input
              value={newForm.phone}
              onChange={(e) => setNewForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="전화번호"
              className="px-3 py-1.5 border rounded-md text-sm bg-white"
            />
            <input
              value={newForm.email}
              onChange={(e) => setNewForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="이메일"
              className="px-3 py-1.5 border rounded-md text-sm bg-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={isPending || !newForm.name.trim()}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md disabled:opacity-50"
            >
              추가
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 border text-sm rounded-md hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {active.length === 0 && !showAddForm && (
        <p className="text-sm text-gray-400 text-center py-4">등록된 담당자가 없습니다.</p>
      )}

      <div className="space-y-2">
        {active.map((c) => (
          <div key={c.id} className="border rounded-lg p-4 bg-white">
            {editState?.id === c.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input value={editState.name} onChange={(e) => setEditState((p) => p ? { ...p, name: e.target.value } : p)} placeholder="이름" className="px-2 py-1 border rounded text-sm" />
                  <input value={editState.position} onChange={(e) => setEditState((p) => p ? { ...p, position: e.target.value } : p)} placeholder="직위" className="px-2 py-1 border rounded text-sm" />
                  <input value={editState.phone} onChange={(e) => setEditState((p) => p ? { ...p, phone: e.target.value } : p)} placeholder="전화번호" className="px-2 py-1 border rounded text-sm" />
                  <input value={editState.email} onChange={(e) => setEditState((p) => p ? { ...p, email: e.target.value } : p)} placeholder="이메일" className="px-2 py-1 border rounded text-sm" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} disabled={isPending} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setEditState(null)} className="p-1.5 text-gray-500 hover:bg-gray-50 rounded"><X className="h-4 w-4" /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-900">{c.name}
                    {c.position && <span className="ml-1.5 text-gray-400 font-normal">· {c.position}</span>}
                  </p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    {c.phone && <span>{c.phone}</span>}
                    {c.email && <span>{c.email}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDeactivate(c.id)} disabled={isPending} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><UserX className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {inactive.length > 0 && (
        <details className="mt-4">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
            비활성 담당자 {inactive.length}명 보기
          </summary>
          <div className="mt-2 space-y-2">
            {inactive.map((c) => (
              <div key={c.id} className="border rounded-lg p-3 bg-gray-50 flex items-center justify-between opacity-60">
                <div>
                  <p className="text-sm text-gray-600">{c.name} {c.position && `· ${c.position}`}</p>
                  <p className="text-xs text-gray-400">{c.phone} {c.email}</p>
                </div>
                <button
                  onClick={() => handleReactivate(c.id)}
                  disabled={isPending}
                  className="text-xs text-blue-600 hover:underline"
                >
                  복구
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
