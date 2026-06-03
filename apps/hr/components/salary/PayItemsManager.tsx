'use client'

import { useState } from 'react'
import { createPayItem, updatePayItem, deletePayItem, type PayItemRow } from '@/actions/pay-item-actions'

interface Props {
  initialItems: PayItemRow[]
}

const EMPTY: Omit<PayItemRow, 'id'> = {
  name: '', type: 'pay', is_statutory: false, rate: null, fixed_amount: null, is_active: true,
}

type EditState = { [id: string]: Partial<Omit<PayItemRow, 'id' | 'is_statutory'>> }

export function PayItemsManager({ initialItems }: Props) {
  const [items, setItems] = useState<PayItemRow[]>(initialItems)
  const [adding, setAdding] = useState(false)
  const [newRow, setNewRow] = useState<Omit<PayItemRow, 'id'>>(EMPTY)
  const [edits, setEdits] = useState<EditState>({})
  const [saving, setSaving] = useState<string | null>(null)

  const payItems = items.filter(i => i.type === 'pay')
  const dedItems = items.filter(i => i.type === 'deduction')

  const handleAdd = async () => {
    if (!newRow.name.trim()) return
    setSaving('new')
    const created = await createPayItem(newRow)
    if (created) {
      setItems(prev => [...prev, created])
      setNewRow(EMPTY)
      setAdding(false)
    }
    setSaving(null)
  }

  const handleEdit = (id: string, field: string, value: unknown) => {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const handleSave = async (id: string) => {
    const patch = edits[id]
    if (!patch || Object.keys(patch).length === 0) { setEdits(prev => { const n = { ...prev }; delete n[id]; return n }); return }
    setSaving(id)
    const ok = await updatePayItem(id, patch)
    if (ok) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
      setEdits(prev => { const n = { ...prev }; delete n[id]; return n })
    }
    setSaving(null)
  }

  const handleToggleActive = async (item: PayItemRow) => {
    setSaving(item.id)
    const ok = await updatePayItem(item.id, { is_active: !item.is_active })
    if (ok) setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !item.is_active } : i))
    setSaving(null)
  }

  const handleDelete = async (item: PayItemRow) => {
    if (item.is_statutory) return
    if (!confirm(`'${item.name}' 항목을 삭제합니까?`)) return
    setSaving(item.id)
    const ok = await deletePayItem(item.id)
    if (ok) setItems(prev => prev.filter(i => i.id !== item.id))
    setSaving(null)
  }

  const fmtRate = (rate: number | null) => rate != null ? `${(rate * 100).toFixed(2)}%` : '—'
  const fmtAmt  = (amt:  number | null) => amt  != null ? amt.toLocaleString('ko-KR') + '원' : '—'

  const getVal = (item: PayItemRow, field: keyof PayItemRow) =>
    edits[item.id]?.[field as keyof Omit<PayItemRow, 'id' | 'is_statutory'>] ?? item[field]

  return (
    <div className="space-y-8">
      {/* 지급 항목 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800">지급 항목</h2>
          <button
            onClick={() => { setAdding(true); setNewRow({ ...EMPTY, type: 'pay' }) }}
            className="text-sm px-3 py-1.5 bg-violet-600 text-white rounded-md hover:bg-violet-700"
          >
            + 추가
          </button>
        </div>
        <ItemTable
          items={payItems}
          adding={adding && newRow.type === 'pay'}
          newRow={newRow}
          setNewRow={setNewRow}
          edits={edits}
          saving={saving}
          getVal={getVal}
          onEdit={handleEdit}
          onSave={handleSave}
          onAdd={handleAdd}
          onCancelAdd={() => setAdding(false)}
          onToggleActive={handleToggleActive}
          onDelete={handleDelete}
          fmtRate={fmtRate}
          fmtAmt={fmtAmt}
        />
      </section>

      {/* 공제 항목 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800">공제 항목</h2>
          <button
            onClick={() => { setAdding(true); setNewRow({ ...EMPTY, type: 'deduction' }) }}
            className="text-sm px-3 py-1.5 bg-violet-600 text-white rounded-md hover:bg-violet-700"
          >
            + 추가
          </button>
        </div>
        <ItemTable
          items={dedItems}
          adding={adding && newRow.type === 'deduction'}
          newRow={newRow}
          setNewRow={setNewRow}
          edits={edits}
          saving={saving}
          getVal={getVal}
          onEdit={handleEdit}
          onSave={handleSave}
          onAdd={handleAdd}
          onCancelAdd={() => setAdding(false)}
          onToggleActive={handleToggleActive}
          onDelete={handleDelete}
          fmtRate={fmtRate}
          fmtAmt={fmtAmt}
        />
      </section>
    </div>
  )
}

interface TableProps {
  items: PayItemRow[]
  adding: boolean
  newRow: Omit<PayItemRow, 'id'>
  setNewRow: (r: Omit<PayItemRow, 'id'>) => void
  edits: EditState
  saving: string | null
  getVal: (item: PayItemRow, field: keyof PayItemRow) => unknown
  onEdit: (id: string, field: string, value: unknown) => void
  onSave: (id: string) => void
  onAdd: () => void
  onCancelAdd: () => void
  onToggleActive: (item: PayItemRow) => void
  onDelete: (item: PayItemRow) => void
  fmtRate: (r: number | null) => string
  fmtAmt:  (a: number | null) => string
}

function ItemTable({ items, adding, newRow, setNewRow, edits, saving, getVal, onEdit, onSave, onAdd, onCancelAdd, onToggleActive, onDelete, fmtRate, fmtAmt }: TableProps) {
  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600 w-48">항목명</th>
            <th className="px-4 py-3 text-center font-medium text-gray-600 w-20">법정여부</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600 w-28">요율</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600 w-32">고정금액</th>
            <th className="px-4 py-3 text-center font-medium text-gray-600 w-20">사용</th>
            <th className="px-4 py-3 text-center font-medium text-gray-600 w-28">관리</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map(item => {
            const isDirty = !!edits[item.id] && Object.keys(edits[item.id]).length > 0
            return (
              <tr key={item.id} className={`hover:bg-gray-50 ${!item.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-2.5">
                  {item.is_statutory ? (
                    <span className="text-gray-700">{item.name}</span>
                  ) : (
                    <input
                      className="border rounded px-2 py-1 text-sm w-full"
                      value={String(getVal(item, 'name'))}
                      onChange={e => onEdit(item.id, 'name', e.target.value)}
                    />
                  )}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_statutory ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {item.is_statutory ? '법정' : '임의'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {item.is_statutory ? (
                    <span className="text-gray-700">{fmtRate(item.rate)}</span>
                  ) : (
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="0.0000"
                      className="border rounded px-2 py-1 text-sm w-24 text-right"
                      value={getVal(item, 'rate') != null ? String(getVal(item, 'rate')) : ''}
                      onChange={e => onEdit(item.id, 'rate', e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {item.is_statutory ? (
                    <span className="text-gray-700">{fmtAmt(item.fixed_amount)}</span>
                  ) : (
                    <input
                      type="number"
                      placeholder="0"
                      className="border rounded px-2 py-1 text-sm w-28 text-right"
                      value={getVal(item, 'fixed_amount') != null ? String(getVal(item, 'fixed_amount')) : ''}
                      onChange={e => onEdit(item.id, 'fixed_amount', e.target.value ? parseInt(e.target.value, 10) : null)}
                    />
                  )}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <button
                    onClick={() => onToggleActive(item)}
                    disabled={saving === item.id}
                    className={`text-xs px-2 py-0.5 rounded-full border ${item.is_active ? 'border-green-300 text-green-700' : 'border-gray-300 text-gray-500'}`}
                  >
                    {item.is_active ? '사용' : '중지'}
                  </button>
                </td>
                <td className="px-4 py-2.5 text-center space-x-1">
                  {!item.is_statutory && (
                    <>
                      {isDirty && (
                        <button
                          onClick={() => onSave(item.id)}
                          disabled={saving === item.id}
                          className="text-xs px-2 py-1 bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50"
                        >
                          저장
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(item)}
                        disabled={saving === item.id}
                        className="text-xs px-2 py-1 text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </>
                  )}
                </td>
              </tr>
            )
          })}

          {adding && (
            <tr className="bg-violet-50">
              <td className="px-4 py-2.5">
                <input
                  autoFocus
                  className="border rounded px-2 py-1 text-sm w-full"
                  placeholder="항목명"
                  value={newRow.name}
                  onChange={e => setNewRow({ ...newRow, name: e.target.value })}
                />
              </td>
              <td className="px-4 py-2.5 text-center">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">임의</span>
              </td>
              <td className="px-4 py-2.5 text-right">
                <input
                  type="number"
                  step="0.0001"
                  placeholder="0.0000"
                  className="border rounded px-2 py-1 text-sm w-24 text-right"
                  value={newRow.rate ?? ''}
                  onChange={e => setNewRow({ ...newRow, rate: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </td>
              <td className="px-4 py-2.5 text-right">
                <input
                  type="number"
                  placeholder="0"
                  className="border rounded px-2 py-1 text-sm w-28 text-right"
                  value={newRow.fixed_amount ?? ''}
                  onChange={e => setNewRow({ ...newRow, fixed_amount: e.target.value ? parseInt(e.target.value, 10) : null })}
                />
              </td>
              <td />
              <td className="px-4 py-2.5 text-center space-x-1">
                <button
                  onClick={onAdd}
                  disabled={saving === 'new'}
                  className="text-xs px-2 py-1 bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50"
                >
                  저장
                </button>
                <button
                  onClick={onCancelAdd}
                  className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
                >
                  취소
                </button>
              </td>
            </tr>
          )}

          {items.length === 0 && !adding && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                등록된 항목이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
