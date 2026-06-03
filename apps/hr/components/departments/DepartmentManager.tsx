'use client'

import { useState } from 'react'
import { createDepartment, updateDepartment, deleteDepartment } from '@/actions/department-actions'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import type { HrDepartment } from '@co-at/types'

interface Props {
  initialDepartments: HrDepartment[]
}

export function DepartmentManager({ initialDepartments }: Props) {
  const [departments, setDepartments] = useState(initialDepartments)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ name: string; code: string; description: string }>({ name: '', code: '', description: '' })
  const [newRow, setNewRow] = useState(false)
  const [newValues, setNewValues] = useState({ name: '', code: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startEdit = (d: HrDepartment) => {
    setEditingId(d.id)
    setEditValues({ name: d.name, code: d.code ?? '', description: d.description ?? '' })
  }

  const saveEdit = async (id: string) => {
    setSaving(true)
    const res = await updateDepartment(id, { name: editValues.name, code: editValues.code || undefined, description: editValues.description || undefined })
    setSaving(false)
    if (!res.success) { setError(res.error); return }
    setDepartments(prev => prev.map(d => d.id === id ? res.data : d))
    setEditingId(null)
  }

  const handleCreate = async () => {
    if (!newValues.name.trim()) return
    setSaving(true)
    const res = await createDepartment({ name: newValues.name, code: newValues.code || undefined, description: newValues.description || undefined })
    setSaving(false)
    if (!res.success) { setError(res.error); return }
    setDepartments(prev => [...prev, res.data])
    setNewRow(false)
    setNewValues({ name: '', code: '', description: '' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    const res = await deleteDepartment(id)
    if (!res.success) { setError(res.error ?? '삭제 실패'); return }
    setDepartments(prev => prev.filter(d => d.id !== id))
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
              <th className="px-4 py-3 text-left font-medium text-gray-600">부서명</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">코드</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">설명</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-24">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {departments.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                {editingId === d.id ? (
                  <>
                    <td className="px-4 py-2"><input className="border rounded px-2 py-1 w-full text-sm" value={editValues.name} onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))} /></td>
                    <td className="px-4 py-2"><input className="border rounded px-2 py-1 w-full text-sm" value={editValues.code} onChange={e => setEditValues(v => ({ ...v, code: e.target.value }))} /></td>
                    <td className="px-4 py-2"><input className="border rounded px-2 py-1 w-full text-sm" value={editValues.description} onChange={e => setEditValues(v => ({ ...v, description: e.target.value }))} /></td>
                    <td className="px-4 py-2 text-center space-x-1">
                      <button onClick={() => saveEdit(d.id)} disabled={saving} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4 inline" /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4 inline" /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{d.name}</td>
                    <td className="px-4 py-2.5 text-gray-500">{d.code ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-500 max-w-xs truncate">{d.description ?? '—'}</td>
                    <td className="px-4 py-2.5 text-center space-x-2">
                      <button onClick={() => startEdit(d)} className="text-blue-500 hover:text-blue-700"><Pencil className="w-4 h-4 inline" /></button>
                      <button onClick={() => handleDelete(d.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {newRow && (
              <tr className="bg-violet-50/30">
                <td className="px-4 py-2"><input autoFocus className="border rounded px-2 py-1 w-full text-sm" placeholder="부서명 *" value={newValues.name} onChange={e => setNewValues(v => ({ ...v, name: e.target.value }))} /></td>
                <td className="px-4 py-2"><input className="border rounded px-2 py-1 w-full text-sm" placeholder="코드" value={newValues.code} onChange={e => setNewValues(v => ({ ...v, code: e.target.value }))} /></td>
                <td className="px-4 py-2"><input className="border rounded px-2 py-1 w-full text-sm" placeholder="설명" value={newValues.description} onChange={e => setNewValues(v => ({ ...v, description: e.target.value }))} /></td>
                <td className="px-4 py-2 text-center space-x-1">
                  <button onClick={handleCreate} disabled={saving} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4 inline" /></button>
                  <button onClick={() => setNewRow(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            )}

            {departments.length === 0 && !newRow && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">등록된 부서가 없습니다.</td></tr>
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
          부서 추가
        </button>
      )}
    </div>
  )
}
