'use client'

import { useState, useTransition } from 'react'
import {
  createGuardian, updateGuardian, deleteGuardian, setPrimaryGuardian,
  type Guardian, type CreateGuardianInput, type GuardianRelationship,
} from '@/actions/guardian-actions'
import { UserPlus, Trash2, Crown, Pencil, Check, X } from 'lucide-react'

const RELATIONSHIPS: GuardianRelationship[] = [
  '부모', '배우자', '자녀', '형제자매',
  '법정후견인', '요양보호사', '사회복지사', '활동지원사', '기타',
]

interface Props {
  clientId: string
  initialGuardians: Guardian[]
}

interface EditState {
  id: string
  name: string
  relationship: GuardianRelationship
  phone: string
  email: string
  notes: string
}

export function ClientGuardiansPanel({ clientId, initialGuardians }: Props) {
  const [guardians, setGuardians] = useState(initialGuardians)
  const [showForm, setShowForm] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<Omit<CreateGuardianInput, 'client_id'>>({
    name: '',
    relationship: '부모',
    phone: '',
    email: '',
    is_primary: false,
    notes: '',
  })

  function handleAdd() {
    if (!form.name.trim()) return
    startTransition(async () => {
      setError(null)
      const res = await createGuardian({ client_id: clientId, ...form })
      if (!res.success) { setError(res.error ?? '오류'); return }
      // if new guardian is primary, clear existing primary
      const updated = guardians.map((g) => form.is_primary ? { ...g, is_primary: false } : g)
      setGuardians([...updated, res.guardian!])
      setForm({ name: '', relationship: '부모', phone: '', email: '', is_primary: false, notes: '' })
      setShowForm(false)
    })
  }

  function handleDelete(id: string) {
    if (!confirm('이 보호자 정보를 삭제하시겠습니까?')) return
    startTransition(async () => {
      const res = await deleteGuardian(id, clientId)
      if (!res.success) { setError(res.error ?? '오류'); return }
      setGuardians((prev) => prev.filter((g) => g.id !== id))
    })
  }

  function handleSetPrimary(id: string) {
    startTransition(async () => {
      const res = await setPrimaryGuardian(id, clientId)
      if (!res.success) { setError(res.error ?? '오류'); return }
      setGuardians((prev) => prev.map((g) => ({ ...g, is_primary: g.id === id })))
    })
  }

  function startEdit(g: Guardian) {
    setEditState({
      id: g.id,
      name: g.name,
      relationship: g.relationship,
      phone: g.phone ?? '',
      email: g.email ?? '',
      notes: g.notes ?? '',
    })
  }

  function handleSaveEdit() {
    if (!editState) return
    startTransition(async () => {
      const { id, ...rest } = editState
      const res = await updateGuardian(id, clientId, {
        name: rest.name,
        relationship: rest.relationship,
        phone: rest.phone || undefined,
        email: rest.email || undefined,
        notes: rest.notes || undefined,
      })
      if (!res.success) { setError(res.error ?? '오류'); return }
      setGuardians((prev) => prev.map((g) =>
        g.id === id
          ? { ...g, ...rest, phone: rest.phone || null, email: rest.email || null, notes: rest.notes || null }
          : g
      ))
      setEditState(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">보호자 · 연락처</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-md hover:bg-gray-50 transition-colors"
        >
          <UserPlus className="h-3.5 w-3.5" />
          추가
        </button>
      </div>

      {error && <div className="p-2 rounded bg-red-50 text-red-700 text-xs">{error}</div>}

      {showForm && (
        <div className="border rounded-lg p-4 bg-blue-50 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="이름 *"
              className="px-2.5 py-1.5 border rounded-md text-sm bg-white"
            />
            <select
              value={form.relationship}
              onChange={(e) => setForm((p) => ({ ...p, relationship: e.target.value as GuardianRelationship }))}
              className="px-2.5 py-1.5 border rounded-md text-sm bg-white"
            >
              {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="전화번호"
              className="px-2.5 py-1.5 border rounded-md text-sm bg-white"
            />
            <input
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="이메일"
              className="px-2.5 py-1.5 border rounded-md text-sm bg-white"
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_primary ?? false}
              onChange={(e) => setForm((p) => ({ ...p, is_primary: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm text-gray-700">주 보호자로 지정</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={isPending || !form.name.trim()}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md disabled:opacity-50"
            >
              추가
            </button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 border text-sm rounded-md hover:bg-gray-50">취소</button>
          </div>
        </div>
      )}

      {guardians.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 py-3 text-center">등록된 보호자가 없습니다.</p>
      )}

      <div className="space-y-2">
        {guardians.map((g) => (
          <div
            key={g.id}
            className={[
              'border rounded-lg p-3',
              g.is_primary ? 'border-blue-200 bg-blue-50' : 'bg-white',
            ].join(' ')}
          >
            {editState?.id === g.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input value={editState.name} onChange={(e) => setEditState((p) => p ? { ...p, name: e.target.value } : p)} className="px-2 py-1 border rounded text-sm" />
                  <select value={editState.relationship} onChange={(e) => setEditState((p) => p ? { ...p, relationship: e.target.value as GuardianRelationship } : p)} className="px-2 py-1 border rounded text-sm">
                    {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input value={editState.phone} onChange={(e) => setEditState((p) => p ? { ...p, phone: e.target.value } : p)} placeholder="전화번호" className="px-2 py-1 border rounded text-sm" />
                  <input value={editState.email} onChange={(e) => setEditState((p) => p ? { ...p, email: e.target.value } : p)} placeholder="이메일" className="px-2 py-1 border rounded text-sm" />
                </div>
                <div className="flex gap-1.5">
                  <button onClick={handleSaveEdit} disabled={isPending} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setEditState(null)} className="p-1 text-gray-400 hover:bg-gray-50 rounded"><X className="h-4 w-4" /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    {g.is_primary && <Crown className="h-3.5 w-3.5 text-blue-500" />}
                    <span className="font-medium text-sm text-gray-900">{g.name}</span>
                    <span className="text-xs text-gray-400">· {g.relationship}</span>
                  </div>
                  <div className="flex gap-3 mt-0.5 text-xs text-gray-500">
                    {g.phone && <span>{g.phone}</span>}
                    {g.email && <span>{g.email}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!g.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(g.id)}
                      disabled={isPending}
                      title="주 보호자로 지정"
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Crown className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => startEdit(g)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(g.id)} disabled={isPending} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
