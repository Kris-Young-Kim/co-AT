'use client'

import { useState, useEffect, useTransition } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/actions/finance-actions'
import type { FinanceBudgetCategoryWithChildren } from '@co-at/types'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<FinanceBudgetCategoryWithChildren[]>([])
  const [isPending, startTransition] = useTransition()
  const [error, setError]     = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName]   = useState('')
  const [newParent, setNewParent] = useState('')
  const [newName, setNewName]     = useState('')
  const [newCode, setNewCode]     = useState('')
  const [showNewForm, setShowNewForm] = useState(false)

  function reload() {
    startTransition(async () => {
      setCategories(await getCategories())
    })
  }

  useEffect(() => { reload() }, [])

  async function handleCreate() {
    if (!newName.trim()) return
    startTransition(async () => {
      const result = await createCategory({ name: newName.trim(), code: newCode.trim() || undefined, parent_id: newParent || undefined })
      if (result) {
        setNewName(''); setNewCode(''); setNewParent(''); setShowNewForm(false)
        reload()
      } else {
        setError('생성 실패')
      }
    })
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return
    startTransition(async () => {
      const ok = await updateCategory(id, { name: editName.trim() })
      if (ok) { setEditingId(null); reload() }
    })
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCategory(id)
      if (result.ok) {
        reload()
      } else {
        setError(result.error ?? '삭제 실패')
        setTimeout(() => setError(null), 3000)
      }
    })
  }

  const allParents = categories

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">카테고리 관리</h1>
        <button
          onClick={() => setShowNewForm(v => !v)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md text-sm hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          추가
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {showNewForm && (
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <p className="font-medium text-sm">새 카테고리</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">카테고리명 *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="예: 사업비" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">코드</label>
              <input value={newCode} onChange={e => setNewCode(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="예: BUSINESS" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">상위 카테고리 (비워두면 대분류)</label>
            <select value={newParent} onChange={e => setNewParent(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
              <option value="">대분류</option>
              {allParents.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={isPending} className="bg-emerald-600 text-white px-4 py-1.5 rounded text-sm hover:bg-emerald-700 disabled:opacity-50">저장</button>
            <button onClick={() => setShowNewForm(false)} className="border px-4 py-1.5 rounded text-sm hover:bg-gray-50">취소</button>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">카테고리</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">코드</th>
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map(cat => (
              <>
                <tr key={cat.id} className="bg-gray-50">
                  <td className="px-4 py-2.5">
                    {editingId === cat.id ? (
                      <input value={editName} onChange={e => setEditName(e.target.value)} className="border rounded px-2 py-0.5 text-sm w-40" autoFocus />
                    ) : (
                      <span className="font-semibold">{cat.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{cat.code ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-2 justify-end">
                      {editingId === cat.id ? (
                        <>
                          <button onClick={() => handleUpdate(cat.id)} className="text-emerald-600 hover:text-emerald-700"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(cat.id); setEditName(cat.name) }} className="text-gray-400 hover:text-gray-600"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(cat.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {cat.children.map(child => (
                  <tr key={child.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 pl-8">
                      {editingId === child.id ? (
                        <input value={editName} onChange={e => setEditName(e.target.value)} className="border rounded px-2 py-0.5 text-sm w-40" autoFocus />
                      ) : child.name}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{child.code ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-2 justify-end">
                        {editingId === child.id ? (
                          <>
                            <button onClick={() => handleUpdate(child.id)} className="text-emerald-600"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingId(null)} className="text-gray-400"><X className="w-4 h-4" /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditingId(child.id); setEditName(child.name) }} className="text-gray-400 hover:text-gray-600"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDelete(child.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">카테고리가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
