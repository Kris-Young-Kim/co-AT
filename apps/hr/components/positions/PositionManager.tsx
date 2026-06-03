'use client'

import { useState } from 'react'
import { createPosition, updatePosition, deletePosition } from '@/actions/position-actions'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import type { HrPosition } from '@co-at/types'

interface Props {
  initialPositions: HrPosition[]
}

export function PositionManager({ initialPositions }: Props) {
  const [positions, setPositions] = useState(initialPositions)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ name: string; code: string; level: string }>({ name: '', code: '', level: '1' })
  const [newRow, setNewRow] = useState(false)
  const [newValues, setNewValues] = useState({ name: '', code: '', level: '1' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startEdit = (p: HrPosition) => {
    setEditingId(p.id)
    setEditValues({ name: p.name, code: p.code ?? '', level: String(p.level) })
  }

  const saveEdit = async (id: string) => {
    setSaving(true)
    const res = await updatePosition(id, { name: editValues.name, code: editValues.code || undefined, level: Number(editValues.level) })
    setSaving(false)
    if (!res.success) { setError(res.error); return }
    setPositions(prev => prev.map(p => p.id === id ? res.data : p))
    setEditingId(null)
  }

  const handleCreate = async () => {
    if (!newValues.name.trim()) return
    setSaving(true)
    const res = await createPosition({ name: newValues.name, code: newValues.code || undefined, level: Number(newValues.level) })
    setSaving(false)
    if (!res.success) { setError(res.error); return }
    setPositions(prev => [...prev, res.data].sort((a, b) => b.level - a.level))
    setNewRow(false)
    setNewValues({ name: '', code: '', level: '1' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    const res = await deletePosition(id)
    if (!res.success) { setError(res.error ?? '삭제 실패'); return }
    setPositions(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">{error}</div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">직급명</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">코드</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-20">레벨</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-24">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {positions.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                {editingId === p.id ? (
                  <>
                    <td className="px-4 py-2"><input className="border rounded px-2 py-1 w-full text-sm" value={editValues.name} onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))} /></td>
                    <td className="px-4 py-2"><input className="border rounded px-2 py-1 w-full text-sm" value={editValues.code} onChange={e => setEditValues(v => ({ ...v, code: e.target.value }))} /></td>
                    <td className="px-4 py-2"><input type="number" min={1} className="border rounded px-2 py-1 w-16 text-sm text-center" value={editValues.level} onChange={e => setEditValues(v => ({ ...v, level: e.target.value }))} /></td>
                    <td className="px-4 py-2 text-center space-x-1">
                      <button onClick={() => saveEdit(p.id)} disabled={saving} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4 inline" /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4 inline" /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-2.5 text-gray-500">{p.code ?? '—'}</td>
                    <td className="px-4 py-2.5 text-center text-gray-500">{p.level}</td>
                    <td className="px-4 py-2.5 text-center space-x-2">
                      <button onClick={() => startEdit(p)} className="text-blue-500 hover:text-blue-700"><Pencil className="w-4 h-4 inline" /></button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {newRow && (
              <tr className="bg-violet-50/30">
                <td className="px-4 py-2"><input autoFocus className="border rounded px-2 py-1 w-full text-sm" placeholder="직급명 *" value={newValues.name} onChange={e => setNewValues(v => ({ ...v, name: e.target.value }))} /></td>
                <td className="px-4 py-2"><input className="border rounded px-2 py-1 w-full text-sm" placeholder="코드" value={newValues.code} onChange={e => setNewValues(v => ({ ...v, code: e.target.value }))} /></td>
                <td className="px-4 py-2"><input type="number" min={1} className="border rounded px-2 py-1 w-16 text-sm text-center" value={newValues.level} onChange={e => setNewValues(v => ({ ...v, level: e.target.value }))} /></td>
                <td className="px-4 py-2 text-center space-x-1">
                  <button onClick={handleCreate} disabled={saving} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4 inline" /></button>
                  <button onClick={() => setNewRow(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            )}

            {positions.length === 0 && !newRow && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">등록된 직급이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {!newRow && (
        <button
          onClick={() => setNewRow(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-md hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" />
          직급 추가
        </button>
      )}
    </div>
  )
}
