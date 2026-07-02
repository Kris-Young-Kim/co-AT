export const dynamic = 'force-dynamic'

import { getSalaryRecordsByMonth } from '@/actions/salary-actions'
import { Shield } from 'lucide-react'

const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))

// 사업주 부담 요율 (2024 기준)
const EMPLOYER_RATES = {
  national_pension:     0.045,   // 4.5%
  health_insurance:     0.03545, // 3.545%
  long_term_care:       0.004545,// 장기요양보험 (건보와 동일 계산)
  employment_insurance: 0.009,   // 0.9%
  industrial_accident:  0.0073,  // 산재보험 0.73% (업종 평균)
}

interface Props {
  searchParams: Promise<{ year?: string }>
}

type SalaryRow = {
  employee_id: string
  base_salary: number
  gross_pay: number
  deductions: {
    national_pension: number
    health_insurance: number
    long_term_care: number
    employment_insurance: number
    income_tax: number
    local_income_tax: number
  }
  hr_employees: { name: string; department: string } | null
}

interface EmpSummary {
  name: string
  dept: string
  grossTotal: number
  empNp: number; empHi: number; empLtc: number; empEi: number
  erpNp: number; erpHi: number; erpLtc: number; erpEi: number; erpIa: number
}

function w(n: number) { return n.toLocaleString('ko-KR') }

export default async function InsurancePage({ searchParams }: Props) {
  const params = await searchParams
  const year = params.year ?? String(new Date().getFullYear())

  const monthlyData = await Promise.all(
    MONTHS.map(m => getSalaryRecordsByMonth(`${year}-${m}`))
  )

  const byEmp = new Map<string, EmpSummary>()
  for (const records of monthlyData) {
    for (const r of records as unknown as SalaryRow[]) {
      const name = r.hr_employees?.name ?? '—'
      const dept = r.hr_employees?.department ?? '—'
      const base = r.base_salary

      const existing = byEmp.get(r.employee_id) ?? {
        name, dept, grossTotal: 0,
        empNp: 0, empHi: 0, empLtc: 0, empEi: 0,
        erpNp: 0, erpHi: 0, erpLtc: 0, erpEi: 0, erpIa: 0,
      }
      existing.grossTotal += r.gross_pay
      existing.empNp  += r.deductions.national_pension
      existing.empHi  += r.deductions.health_insurance
      existing.empLtc += r.deductions.long_term_care
      existing.empEi  += r.deductions.employment_insurance
      existing.erpNp  += Math.round(base * EMPLOYER_RATES.national_pension)
      existing.erpHi  += Math.round(base * EMPLOYER_RATES.health_insurance)
      existing.erpLtc += Math.round(base * EMPLOYER_RATES.long_term_care)
      existing.erpEi  += Math.round(base * EMPLOYER_RATES.employment_insurance)
      existing.erpIa  += Math.round(base * EMPLOYER_RATES.industrial_accident)
      byEmp.set(r.employee_id, existing)
    }
  }

  const rows = [...byEmp.values()].sort((a, b) => a.name.localeCompare(b.name))

  const tot = rows.reduce<EmpSummary>((acc, r) => ({
    name: '', dept: '', grossTotal: acc.grossTotal + r.grossTotal,
    empNp: acc.empNp + r.empNp, empHi: acc.empHi + r.empHi,
    empLtc: acc.empLtc + r.empLtc, empEi: acc.empEi + r.empEi,
    erpNp: acc.erpNp + r.erpNp, erpHi: acc.erpHi + r.erpHi,
    erpLtc: acc.erpLtc + r.erpLtc, erpEi: acc.erpEi + r.erpEi,
    erpIa: acc.erpIa + r.erpIa,
  }), { name: '', dept: '', grossTotal: 0, empNp: 0, empHi: 0, empLtc: 0, empEi: 0, erpNp: 0, erpHi: 0, erpLtc: 0, erpEi: 0, erpIa: 0 })

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-gray-900">4대보험 현황</h1>
        </div>
        <form method="GET">
          <select name="year" defaultValue={year} className="border rounded-md px-3 py-1.5 text-sm">
            {[year, String(Number(year) - 1)].map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
        </form>
      </div>

      {/* 요율 안내 */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: '국민연금', emp: '4.5%', erp: '4.5%' },
          { label: '건강보험', emp: '3.545%', erp: '3.545%' },
          { label: '장기요양', emp: '0.4545%', erp: '0.4545%' },
          { label: '고용보험', emp: '0.9%', erp: '0.9%' },
          { label: '산재보험', emp: '—', erp: '0.73%' },
        ].map(item => (
          <div key={item.label} className="bg-white border rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 font-medium mb-1">{item.label}</p>
            <p className="text-xs text-blue-600">직원 {item.emp}</p>
            <p className="text-xs text-orange-600">사업주 {item.erp}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th rowSpan={2} className="px-4 py-3 text-left font-medium text-gray-600 border-r">성명</th>
              <th rowSpan={2} className="px-4 py-3 text-left font-medium text-gray-600 border-r">부서</th>
              <th rowSpan={2} className="px-4 py-3 text-right font-medium text-gray-600 border-r">연간총급여</th>
              <th colSpan={4} className="px-4 py-2 text-center font-medium text-blue-700 border-r bg-blue-50">직원 부담</th>
              <th colSpan={5} className="px-4 py-2 text-center font-medium text-orange-700 bg-orange-50">사업주 부담</th>
            </tr>
            <tr>
              <th className="px-3 py-2 text-right font-medium text-blue-600 bg-blue-50">국민연금</th>
              <th className="px-3 py-2 text-right font-medium text-blue-600 bg-blue-50">건강보험</th>
              <th className="px-3 py-2 text-right font-medium text-blue-600 bg-blue-50">장기요양</th>
              <th className="px-3 py-2 text-right font-medium text-blue-600 bg-blue-50 border-r">고용보험</th>
              <th className="px-3 py-2 text-right font-medium text-orange-600 bg-orange-50">국민연금</th>
              <th className="px-3 py-2 text-right font-medium text-orange-600 bg-orange-50">건강보험</th>
              <th className="px-3 py-2 text-right font-medium text-orange-600 bg-orange-50">장기요양</th>
              <th className="px-3 py-2 text-right font-medium text-orange-600 bg-orange-50">고용보험</th>
              <th className="px-3 py-2 text-right font-medium text-orange-600 bg-orange-50">산재보험</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-800 border-r">{r.name}</td>
                <td className="px-4 py-2.5 text-gray-600 border-r">{r.dept}</td>
                <td className="px-4 py-2.5 text-right text-gray-700 border-r">{w(r.grossTotal)}원</td>
                <td className="px-3 py-2.5 text-right text-blue-700 bg-blue-50/30">{w(r.empNp)}원</td>
                <td className="px-3 py-2.5 text-right text-blue-700 bg-blue-50/30">{w(r.empHi)}원</td>
                <td className="px-3 py-2.5 text-right text-blue-700 bg-blue-50/30">{w(r.empLtc)}원</td>
                <td className="px-3 py-2.5 text-right text-blue-700 bg-blue-50/30 border-r">{w(r.empEi)}원</td>
                <td className="px-3 py-2.5 text-right text-orange-700 bg-orange-50/30">{w(r.erpNp)}원</td>
                <td className="px-3 py-2.5 text-right text-orange-700 bg-orange-50/30">{w(r.erpHi)}원</td>
                <td className="px-3 py-2.5 text-right text-orange-700 bg-orange-50/30">{w(r.erpLtc)}원</td>
                <td className="px-3 py-2.5 text-right text-orange-700 bg-orange-50/30">{w(r.erpEi)}원</td>
                <td className="px-3 py-2.5 text-right text-orange-700 bg-orange-50/30">{w(r.erpIa)}원</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={12} className="px-5 py-10 text-center text-gray-400">{year}년 급여 데이터가 없습니다.</td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="bg-gray-50 border-t font-semibold">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-gray-700 border-r">합계</td>
                <td className="px-4 py-3 text-right text-gray-800 border-r">{w(tot.grossTotal)}원</td>
                <td className="px-3 py-3 text-right text-blue-700">{w(tot.empNp)}원</td>
                <td className="px-3 py-3 text-right text-blue-700">{w(tot.empHi)}원</td>
                <td className="px-3 py-3 text-right text-blue-700">{w(tot.empLtc)}원</td>
                <td className="px-3 py-3 text-right text-blue-700 border-r">{w(tot.empEi)}원</td>
                <td className="px-3 py-3 text-right text-orange-700">{w(tot.erpNp)}원</td>
                <td className="px-3 py-3 text-right text-orange-700">{w(tot.erpHi)}원</td>
                <td className="px-3 py-3 text-right text-orange-700">{w(tot.erpLtc)}원</td>
                <td className="px-3 py-3 text-right text-orange-700">{w(tot.erpEi)}원</td>
                <td className="px-3 py-3 text-right text-orange-700">{w(tot.erpIa)}원</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
