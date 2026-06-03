export const dynamic = 'force-dynamic'

import { getEmployees } from '@/actions/employee-actions'
import { getSalaryRecordsByEmployee } from '@/actions/salary-actions'
import { getDistinctSalaryMonths } from '@/actions/salary-actions'
import { SalarySlipList } from '@/components/salary/SalarySlipList'
import { ScrollText } from 'lucide-react'

interface Props {
  searchParams: Promise<{ employeeId?: string }>
}

export default async function SalarySlipsPage({ searchParams }: Props) {
  const params = await searchParams
  const employees = await getEmployees()

  const selectedEmpId = params.employeeId ?? employees[0]?.id ?? ''
  const [records, months] = await Promise.all([
    selectedEmpId ? getSalaryRecordsByEmployee(selectedEmpId) : Promise.resolve([]),
    getDistinctSalaryMonths(),
  ])

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2">
        <ScrollText className="h-6 w-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900">사원별 급여명세서</h1>
      </div>
      <SalarySlipList employees={employees} records={records} months={months} selectedEmpId={selectedEmpId} />
    </div>
  )
}
