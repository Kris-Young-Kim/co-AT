export const dynamic = 'force-dynamic'

import { getDepartments } from '@/actions/department-actions'
import { DepartmentManager } from '@/components/departments/DepartmentManager'
import { Building2 } from 'lucide-react'

export default async function DepartmentsPage() {
  const result = await getDepartments()
  const departments = result.success ? result.data : []

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-6 w-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900">부서 등록</h1>
      </div>
      <DepartmentManager initialDepartments={departments} />
    </div>
  )
}
