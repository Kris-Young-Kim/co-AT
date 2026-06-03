export const dynamic = 'force-dynamic'

import { getEmployees } from '@/actions/employee-actions'
import { getDistinctSalaryMonths } from '@/actions/salary-actions'
import { SalaryGeneratePanel } from '@/components/salary/SalaryGeneratePanel'
import { Zap } from 'lucide-react'

export default async function SalaryGeneratePage() {
  const [employees, months] = await Promise.all([
    getEmployees(),
    getDistinctSalaryMonths(),
  ])

  const today = new Date()
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2">
        <Zap className="h-6 w-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900">급상여 생성</h1>
      </div>
      <p className="text-sm text-gray-500">호봉이 등록된 재직자를 대상으로 월별 급여를 일괄 생성합니다.</p>
      <SalaryGeneratePanel employees={employees} existingMonths={months} currentMonth={currentMonth} />
    </div>
  )
}
