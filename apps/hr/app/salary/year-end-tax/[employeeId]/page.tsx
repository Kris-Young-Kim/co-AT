export const dynamic = 'force-dynamic'

import { getYearEndTax, getActiveEmployees } from '@/actions/year-end-tax-actions'
import { getSalaryRecordsByMonth } from '@/actions/salary-actions'
import { YearEndTaxForm } from '@/components/year-end-tax/YearEndTaxForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))

interface Props {
  params: Promise<{ employeeId: string }>
  searchParams: Promise<{ year?: string }>
}

export default async function YearEndTaxDetailPage({ params, searchParams }: Props) {
  const { employeeId } = await params
  const sp = await searchParams
  const year = sp.year ?? String(new Date().getFullYear())
  const taxYear = parseInt(year)

  const [employees, existing] = await Promise.all([
    getActiveEmployees(),
    getYearEndTax(employeeId, taxYear),
  ])

  const employee = employees.find(e => e.id === employeeId)
  if (!employee) notFound()

  // 연간 급여 집계
  const monthlyData = await Promise.all(
    MONTHS.map(m => getSalaryRecordsByMonth(`${year}-${m}`))
  )

  let grossIncome = 0
  let prepaidIncomeTax = 0
  let prepaidLocalTax = 0

  for (const records of monthlyData) {
    for (const r of records as unknown as Array<{
      employee_id: string
      gross_pay: number
      deductions: { income_tax: number; local_income_tax: number }
    }>) {
      if (r.employee_id !== employeeId) continue
      grossIncome += r.gross_pay
      prepaidIncomeTax += r.deductions.income_tax
      prepaidLocalTax += r.deductions.local_income_tax
    }
  }

  function w(n: number) { return n.toLocaleString('ko-KR') }

  return (
    <div className="p-8 max-w-2xl">
      <Link
        href={`/salary/year-end-tax?year=${year}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        연말정산 목록
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{employee.name} · {taxYear}년 연말정산</h1>
        <p className="text-sm text-gray-500 mt-1">{employee.department}</p>
      </div>

      {grossIncome === 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
          {year}년 급여 데이터가 없습니다. 공제항목을 입력해도 세액 계산이 0원으로 표시될 수 있습니다.
        </div>
      )}

      <YearEndTaxForm
        employeeId={employeeId}
        taxYear={taxYear}
        grossIncome={grossIncome}
        prepaidIncomeTax={prepaidIncomeTax}
        prepaidLocalTax={prepaidLocalTax}
        existing={existing}
      />
    </div>
  )
}
