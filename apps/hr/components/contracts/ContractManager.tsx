'use client'

import { useState, useTransition } from 'react'
import type {
  HrEmployee,
  CreateContractInput,
  ContractType,
  EmploymentType,
} from '@co-at/types'
import { createContract, updateContract, deleteContract, type ContractWithSign } from '@/actions/contract-actions'
import { ContractSignaturePanel } from './ContractSignaturePanel'

const CONTRACT_LABEL: Record<ContractType, string> = {
  initial:   '최초 계약',
  renewal:   '갱신 계약',
  amendment: '변경 계약',
}
const CONTRACT_COLOR: Record<ContractType, string> = {
  initial:   'bg-violet-100 text-violet-700',
  renewal:   'bg-blue-100 text-blue-700',
  amendment: 'bg-orange-100 text-orange-700',
}
const EMPLOYMENT_LABEL: Record<string, string> = {
  full_time: '정규직',
  part_time: '시간제',
  contract:  '계약직',
  daily:     '일용직',
}

type Props = {
  initialContracts: ContractWithSign[]
  employees: Pick<HrEmployee, 'id' | 'name' | 'department' | 'position'>[]
}

type FormState = {
  employee_id: string; contract_type: ContractType; start_date: string; end_date: string
  employment_type: EmploymentType; position: string; department: string
  base_salary: string; work_hours: string; signed_at: string; note: string
}

const EMPTY_FORM: FormState = {
  employee_id: '', contract_type: 'initial', start_date: '', end_date: '',
  employment_type: 'full_time', position: '', department: '',
  base_salary: '', work_hours: '40', signed_at: '', note: '',
}

function getDaysUntilExpiry(endDate: string | null): number | null {
  if (!endDate) return null
  const diff = new Date(endDate).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const SIGN_STATUS_BADGE: Record<string, string> = {
  draft:            'bg-gray-100 text-gray-500',
  pending_employee: 'bg-orange-100 text-orange-700',
  employee_signed:  'bg-blue-100 text-blue-700',
  completed:        'bg-green-100 text-green-700',
  cancelled:        'bg-gray-100 text-gray-400',
}
const SIGN_STATUS_LABEL: Record<string, string> = {
  draft:            '서명 전',
  pending_employee: '서명 대기',
  employee_signed:  '직원 서명 완료',
  completed:        '서명 완료',
  cancelled:        '취소',
}

export function ContractManager({ initialContracts, employees }: Props) {
  const [contracts, setContracts]       = useState(initialContracts)
  const [showForm, setShowForm]         = useState(false)
  const [editing, setEditing]           = useState<ContractWithSign | null>(null)
  const [signingContract, setSigningContract] = useState<ContractWithSign | null>(null)
  const [form, setForm]             = useState<FormState>(EMPTY_FORM)
  const [error, setError]           = useState('')
  const [isPending, startTrans]     = useTransition()
  const [filter, setFilter]         = useState<string>('')

  function openCreate() {
    setEditing(null); setForm(EMPTY_FORM); setError(''); setShowForm(true)
  }
  function openEdit(c: ContractWithSign) {
    setEditing(c)
    setForm({
      employee_id:     c.employee_id,
      contract_type:   c.contract_type as ContractType,
      start_date:      c.start_date,
      end_date:        c.end_date ?? '',
      employment_type: c.employment_type as EmploymentType,
      position:        c.position,
      department:      c.department,
      base_salary:     String(c.base_salary),
      work_hours:      String(c.work_hours),
      signed_at:       c.signed_at ?? '',
      note:            c.note ?? '',
    })
    setError(''); setShowForm(true)
  }
  function closeForm() { setShowForm(false); setEditing(null) }

  function prefillFromEmployee(empId: string) {
    const emp = employees.find(e => e.id === empId)
    if (emp) {
      setForm(p => ({ ...p, employee_id: empId, department: emp.department, position: emp.position }))
    }
  }

  function handleSubmit() {
    if (!form.employee_id || !form.start_date || !form.position || !form.department) {
      setError('직원, 시작일, 직급, 부서는 필수입니다.'); return
    }
    startTrans(async () => {
      const input: CreateContractInput = {
        employee_id:     form.employee_id,
        contract_type:   form.contract_type,
        start_date:      form.start_date,
        end_date:        form.end_date || undefined,
        employment_type: form.employment_type,
        position:        form.position,
        department:      form.department,
        base_salary:     Number(form.base_salary) || 0,
        work_hours:      Number(form.work_hours) || 40,
        signed_at:       form.signed_at || undefined,
        note:            form.note || undefined,
      }
      if (editing) {
        const { employee_id: _drop, ...updateInput } = input
        const res = await updateContract(editing.id, updateInput)
        if (!res.success) { setError(res.error); return }
        setContracts(prev => prev.map(c => c.id === editing.id ? { ...c, ...res.data } : c))
      } else {
        const res = await createContract(input)
        if (!res.success) { setError(res.error); return }
        const emp = employees.find(e => e.id === form.employee_id)
        const newContract: ContractWithSign = {
          ...res.data,
          status: 'draft',
          employee_token: (res.data as { employee_token?: string }).employee_token ?? '',
          employee_signature_data: null,
          employer_signature_data: null,
          employee_signed_at: null,
          employer_signed_at: null,
          sent_to: null,
          sent_at: null,
          employee: emp ? { name: emp.name, department: emp.department } : null,
        }
        setContracts(prev => [newContract, ...prev])
      }
      closeForm()
    })
  }

  function handleDelete(id: string) {
    if (!confirm('계약서를 삭제하시겠습니까?')) return
    startTrans(async () => {
      const res = await deleteContract(id)
      if (res.success) setContracts(prev => prev.filter(c => c.id !== id))
    })
  }

  const filtered = filter
    ? contracts.filter(c => c.employee?.name.includes(filter) || c.department.includes(filter))
    : contracts

  const expiringSoon = contracts.filter(c => {
    const days = getDaysUntilExpiry(c.end_date)
    return days !== null && days >= 0 && days <= 30
  })

  return (
    <div className="space-y-4">
      {expiringSoon.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <p className="text-sm font-medium text-yellow-800">⚠ 30일 내 계약 만료 예정 ({expiringSoon.length}건)</p>
          <div className="mt-1 space-y-0.5">
            {expiringSoon.map(c => {
              const days = getDaysUntilExpiry(c.end_date)
              return (
                <p key={c.id} className="text-xs text-yellow-700">
                  {c.employee?.name} — {c.end_date} 만료 (D-{days})
                </p>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="직원명 또는 부서 검색"
          className="border rounded-lg px-3 py-2 text-sm flex-1 max-w-xs focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        <button
          onClick={openCreate}
          className="ml-auto px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors"
        >
          + 계약서 등록
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">등록된 계약서가 없습니다.</div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['직원', '부서', '계약 유형', '고용형태', '시작일', '종료일', '기본급', '서명', '관리'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => {
                const days = getDaysUntilExpiry(c.end_date)
                const expiring = days !== null && days >= 0 && days <= 30
                return (
                  <tr key={c.id} className={`hover:bg-gray-50 ${expiring ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.employee?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{c.department}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${CONTRACT_COLOR[c.contract_type as ContractType]}`}>
                        {CONTRACT_LABEL[c.contract_type as ContractType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{EMPLOYMENT_LABEL[c.employment_type] ?? c.employment_type}</td>
                    <td className="px-4 py-3 text-gray-600">{c.start_date}</td>
                    <td className="px-4 py-3">
                      {c.end_date ? (
                        <span className={expiring ? 'text-yellow-700 font-medium' : 'text-gray-600'}>
                          {c.end_date}{expiring && ` (D-${days})`}
                        </span>
                      ) : <span className="text-gray-400">기간 없음</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.base_salary > 0 ? `${c.base_salary.toLocaleString()}원` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${SIGN_STATUS_BADGE[c.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {SIGN_STATUS_LABEL[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSigningContract(c)} className="text-xs text-blue-600 hover:underline">서명</button>
                        <button onClick={() => openEdit(c)} className="text-xs text-violet-600 hover:underline">수정</button>
                        <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 hover:underline">삭제</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Signature Modal */}
      {signingContract && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                전자서명 관리 — {signingContract.employee?.name ?? ''}
              </h2>
              <button onClick={() => setSigningContract(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="px-6 py-4">
              <ContractSignaturePanel
                contract={signingContract}
                employeeName={signingContract.employee?.name ?? ''}
              />
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b">
              <h2 className="font-semibold text-gray-900">{editing ? '계약서 수정' : '계약서 등록'}</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">직원 *</label>
                <select
                  value={form.employee_id}
                  onChange={e => { setForm(p => ({ ...p, employee_id: e.target.value })); prefillFromEmployee(e.target.value) }}
                  disabled={!!editing}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-gray-50"
                >
                  <option value="">직원 선택</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">계약 유형</label>
                  <select
                    value={form.contract_type}
                    onChange={e => setForm(p => ({ ...p, contract_type: e.target.value as ContractType }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  >
                    <option value="initial">최초 계약</option>
                    <option value="renewal">갱신 계약</option>
                    <option value="amendment">변경 계약</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">고용형태</label>
                  <select
                    value={form.employment_type}
                    onChange={e => setForm(p => ({ ...p, employment_type: e.target.value as EmploymentType }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  >
                    <option value="full_time">정규직</option>
                    <option value="part_time">시간제</option>
                    <option value="contract">계약직</option>
                    <option value="daily">일용직</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">부서 *</label>
                  <input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                    placeholder="부서명" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">직위 *</label>
                  <input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
                    placeholder="직위명" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작일 *</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료일 (없으면 공란)</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">기본급 (원)</label>
                  <input type="number" min={0} value={form.base_salary} onChange={e => setForm(p => ({ ...p, base_salary: e.target.value }))}
                    placeholder="2800000" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">주당 소정근로시간</label>
                  <input type="number" min={1} max={52} value={form.work_hours} onChange={e => setForm(p => ({ ...p, work_hours: e.target.value }))}
                    placeholder="40" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">서명일</label>
                <input type="date" value={form.signed_at} onChange={e => setForm(p => ({ ...p, signed_at: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                <textarea rows={2} value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                  placeholder="특이사항"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={closeForm} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">취소</button>
              <button onClick={handleSubmit} disabled={isPending}
                className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50">
                {isPending ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
