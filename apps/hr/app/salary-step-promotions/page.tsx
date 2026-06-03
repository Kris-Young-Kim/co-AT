export const dynamic = 'force-dynamic'

import { getAllStepHistory } from '@/actions/salary-step-actions'
import { getEmployees } from '@/actions/employee-actions'
import { getSalarySteps } from '@/actions/salary-step-actions'
import { SalaryStepPromotionPanel } from '@/components/salary-steps/SalaryStepPromotionPanel'
import { ArrowUpCircle } from 'lucide-react'

export default async function SalaryStepPromotionsPage() {
  const [histResult, empResult, stepResult] = await Promise.all([
    getAllStepHistory(),
    getEmployees(),
    getSalarySteps(),
  ])

  const history = histResult.success ? histResult.data : []
  const employees = empResult
  const steps = stepResult.success ? stepResult.data : []

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2">
        <ArrowUpCircle className="h-6 w-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900">호봉 승급</h1>
      </div>
      <SalaryStepPromotionPanel history={history} employees={employees} steps={steps} />
    </div>
  )
}
