export const dynamic = 'force-dynamic'

import { getSalarySteps } from '@/actions/salary-step-actions'
import { SalaryStepManager } from '@/components/salary-steps/SalaryStepManager'
import { TrendingUp } from 'lucide-react'

export default async function SalaryStepsPage() {
  const result = await getSalarySteps()
  const steps = result.success ? result.data : []

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900">호봉 등록</h1>
      </div>
      <SalaryStepManager initialSteps={steps} />
    </div>
  )
}
