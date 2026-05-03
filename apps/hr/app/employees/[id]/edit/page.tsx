import { notFound } from 'next/navigation'
import { getEmployee } from '@/actions/employee-actions'
import { EmployeeForm } from '@/components/employees/EmployeeForm'

export default async function EditEmployeePage({ params }: { params: { id: string } }) {
  const employee = await getEmployee(params.id)
  if (!employee) notFound()

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">직원 정보 수정</h1>
      <EmployeeForm initial={employee} />
    </div>
  )
}
