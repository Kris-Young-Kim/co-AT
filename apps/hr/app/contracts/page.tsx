import { ContractManager } from '@/components/contracts/ContractManager'
import { getAllContracts, getExpiringContracts } from '@/actions/contract-actions'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import type { HrEmployee } from '@co-at/types'

export const dynamic = 'force-dynamic'

export default async function ContractsPage() {
  const supabase = createSupabaseAdmin()
  const { data: empData } = await supabase
    .from('hr_employees')
    .select('id,name,department,position')
    .eq('is_active', true)
    .order('name')

  const employees = (empData ?? []) as Pick<HrEmployee, 'id' | 'name' | 'department' | 'position'>[]

  const result   = await getAllContracts()
  const contracts = result.success ? result.data : []

  const expiringResult = await getExpiringContracts(30)
  const expiring       = expiringResult.success ? expiringResult.data : []

  const totalActive   = contracts.filter(c => c.employee !== null).length
  const noEndDate     = contracts.filter(c => !c.end_date).length

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">근로계약서 관리</h1>
        <p className="text-sm text-gray-500 mt-1">계약 체결·갱신 이력 관리 및 만료 알림</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '전체 계약', value: contracts.length, unit: '건', color: 'text-gray-900' },
          { label: '30일 내 만료', value: expiring.length, unit: '건', color: expiring.length > 0 ? 'text-yellow-700' : 'text-gray-900' },
          { label: '무기한 계약', value: noEndDate, unit: '건', color: 'text-green-700' },
        ].map(card => (
          <div key={card.label} className="bg-white border rounded-xl px-5 py-4">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}<span className="text-sm font-normal ml-1">{card.unit}</span></p>
          </div>
        ))}
      </div>

      {!result.success && (
        <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{result.error}</div>
      )}

      <ContractManager initialContracts={contracts} employees={employees} />
    </div>
  )
}
