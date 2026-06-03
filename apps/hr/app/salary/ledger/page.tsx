export const dynamic = 'force-dynamic'

import { getSalaryRecordsByMonth } from '@/actions/salary-actions'
import { getDistinctSalaryMonths } from '@/actions/salary-actions'
import { SalaryLedger } from '@/components/salary/SalaryLedger'
import { BookOpen } from 'lucide-react'

interface Props {
  searchParams: Promise<{ month?: string }>
}

export default async function SalaryLedgerPage({ searchParams }: Props) {
  const params = await searchParams
  const months = await getDistinctSalaryMonths()
  const today = new Date()
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const selectedMonth = params.month ?? months[0] ?? defaultMonth

  const records = await getSalaryRecordsByMonth(selectedMonth)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="h-6 w-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900">급여대장</h1>
      </div>
      <SalaryLedger records={records as SalaryRecordWithEmployee[]} months={months} selectedMonth={selectedMonth} />
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SalaryRecordWithEmployee = any
