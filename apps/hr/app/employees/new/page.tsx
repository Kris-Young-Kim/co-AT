import { EmployeeForm } from '@/components/employees/EmployeeForm'

export default function NewEmployeePage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">직원 등록</h1>
      <EmployeeForm />
    </div>
  )
}
