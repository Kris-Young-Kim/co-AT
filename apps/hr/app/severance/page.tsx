export const dynamic = 'force-dynamic'

import {
  getSeveranceRecords,
  previewSeverance,
  createSeveranceRecord,
} from '@/actions/severance-actions'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { HandCoins, Calculator } from 'lucide-react'
import { redirect } from 'next/navigation'

interface Props {
  searchParams: Promise<{ preview_emp?: string; preview_date?: string }>
}

export default async function SeverancePage({ searchParams }: Props) {
  const params = await searchParams
  const records = await getSeveranceRecords()

  // 재직 직원 목록 (퇴직금 계산 대상)
  const supabase = createSupabaseAdmin()
  const { data: employees } = await supabase
    .from('hr_employees')
    .select('id, name, department, hire_date')
    .eq('is_active', true)
    .order('name')

  // 미리보기 계산
  let preview: Awaited<ReturnType<typeof previewSeverance>> = null
  if (params.preview_emp && params.preview_date) {
    preview = await previewSeverance(params.preview_emp, params.preview_date)
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2">
        <HandCoins className="h-6 w-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900">퇴직금 정산</h1>
      </div>

      {/* 계산기 */}
      <div className="bg-white border rounded-lg p-5 space-y-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <Calculator className="h-4 w-4 text-violet-500" />
          퇴직금 계산
        </h2>

        <form method="GET" className="flex gap-3 flex-wrap">
          <select name="preview_emp" defaultValue={params.preview_emp ?? ''}
            className="border rounded-md px-3 py-2 text-sm flex-1 min-w-[160px]">
            <option value="">직원 선택</option>
            {(employees ?? []).map((e: { id: string; name: string; hire_date: string; department: string }) => (
              <option key={e.id as string} value={e.id as string}>
                {e.name as string} ({e.department as string}, 입사 {e.hire_date as string})
              </option>
            ))}
          </select>
          <input name="preview_date" type="date" defaultValue={params.preview_date ?? ''}
            placeholder="퇴직일"
            className="border rounded-md px-3 py-2 text-sm" />
          <button type="submit"
            className="px-4 py-2 bg-violet-600 text-white text-sm rounded-md hover:bg-violet-700">
            계산
          </button>
        </form>

        {preview && (
          <div className="bg-violet-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                { label: '계속근로연수', value: `${preview.service_years}년` },
                { label: '1일 평균임금', value: `${preview.avg_daily_wage.toLocaleString('ko-KR')}원` },
                { label: '퇴직금', value: `${preview.severance_pay.toLocaleString('ko-KR')}원` },
                { label: '실지급액', value: `${preview.net.toLocaleString('ko-KR')}원` },
              ].map(item => (
                <div key={item.label} className="bg-white rounded-md p-3">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-base font-bold text-violet-700 mt-1">{item.value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">퇴직소득세 공제: {preview.tax.toLocaleString('ko-KR')}원 (5.5% 단순 적용)</p>

            <form action={async () => {
              'use server'
              await createSeveranceRecord({
                employee_id: params.preview_emp!,
                leave_date: params.preview_date!,
                avg_daily_wage: preview!.avg_daily_wage,
              })
              redirect('/severance')
            }}>
              <button type="submit"
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">
                퇴직금 정산 저장
              </button>
            </form>
          </div>
        )}

        {params.preview_emp && params.preview_date && !preview && (
          <p className="text-sm text-red-600">
            계속근로기간이 1년 미만이거나 급여 데이터가 부족합니다.
          </p>
        )}
      </div>

      {/* 정산 이력 */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">퇴직정산 이력</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-gray-600">성명</th>
              <th className="px-5 py-3 text-left font-medium text-gray-600">부서</th>
              <th className="px-5 py-3 text-center font-medium text-gray-600">퇴직일</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">근속연수</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">1일평균임금</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">퇴직금</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">세금</th>
              <th className="px-5 py-3 text-right font-medium text-violet-600">실지급액</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {records.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-5 py-2.5 font-medium text-gray-800">
                  {r.hr_employees?.name ?? '—'}
                </td>
                <td className="px-5 py-2.5 text-gray-600">{r.hr_employees?.department ?? '—'}</td>
                <td className="px-5 py-2.5 text-center text-gray-700">{r.leave_date}</td>
                <td className="px-5 py-2.5 text-right text-gray-700">{r.service_years}년</td>
                <td className="px-5 py-2.5 text-right text-gray-700">{r.avg_daily_wage.toLocaleString('ko-KR')}원</td>
                <td className="px-5 py-2.5 text-right text-gray-700">{r.severance_pay.toLocaleString('ko-KR')}원</td>
                <td className="px-5 py-2.5 text-right text-gray-500">{r.tax_deducted.toLocaleString('ko-KR')}원</td>
                <td className="px-5 py-2.5 text-right font-bold text-violet-700">{r.net_severance.toLocaleString('ko-KR')}원</td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-gray-400">
                  퇴직정산 이력이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        * 퇴직금 = 1일 평균임금 × 30 × 계속근로연수 (근로기준법 제34조, 퇴직급여법 제8조)
      </p>
    </div>
  )
}
