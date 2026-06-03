export const dynamic = 'force-dynamic'

import { getEmployees } from '@/actions/employee-actions'
import { getDepartments } from '@/actions/department-actions'
import { BarChart3, Users, UserCheck, UserX } from 'lucide-react'
import type { HrEmployee } from '@co-at/types'

const TYPE_LABEL: Record<string, string> = {
  full_time: '정규직',
  part_time: '파트타임',
  contract: '계약직',
  daily: '일용직',
}

export default async function EmployeeStatusPage() {
  const [activeEmployees, deptResult] = await Promise.all([
    getEmployees(),           // is_active = true only
    getDepartments(),
  ])

  const departments = deptResult.success ? deptResult.data : []

  // 고용형태별 집계
  const byType: Record<string, number> = {}
  for (const e of activeEmployees) {
    byType[e.employment_type] = (byType[e.employment_type] ?? 0) + 1
  }

  // 부서별 집계 (text 기반 department 컬럼)
  const byDept: Record<string, number> = {}
  for (const e of activeEmployees) {
    const key = e.department || '미지정'
    byDept[key] = (byDept[key] ?? 0) + 1
  }

  const total = activeEmployees.length

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900">인사정보 현황</h1>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-2"><Users className="w-4 h-4" />재직 인원</div>
          <p className="text-3xl font-bold text-violet-700">{total}<span className="text-sm font-normal ml-1 text-gray-500">명</span></p>
        </div>
        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-2"><UserCheck className="w-4 h-4" />정규직</div>
          <p className="text-3xl font-bold text-gray-900">{byType['full_time'] ?? 0}<span className="text-sm font-normal ml-1 text-gray-500">명</span></p>
        </div>
        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-2"><UserX className="w-4 h-4" />등록 부서</div>
          <p className="text-3xl font-bold text-gray-900">{departments.length}<span className="text-sm font-normal ml-1 text-gray-500">개</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 부서별 현황 */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">부서별 인원 현황</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-gray-600">부서</th>
                <th className="px-5 py-3 text-right font-medium text-gray-600">인원</th>
                <th className="px-5 py-3 text-right font-medium text-gray-600">비율</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(byDept).sort((a, b) => b[1] - a[1]).map(([dept, cnt]) => (
                <tr key={dept} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-800">{dept}</td>
                  <td className="px-5 py-3 text-right font-medium text-violet-700">{cnt}명</td>
                  <td className="px-5 py-3 text-right text-gray-500">{total > 0 ? Math.round(cnt / total * 100) : 0}%</td>
                </tr>
              ))}
              {Object.keys(byDept).length === 0 && (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-400">데이터 없음</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 고용형태별 현황 */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">고용형태별 현황</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-gray-600">고용형태</th>
                <th className="px-5 py-3 text-right font-medium text-gray-600">인원</th>
                <th className="px-5 py-3 text-right font-medium text-gray-600">비율</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, cnt]) => (
                <tr key={type} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-800">{TYPE_LABEL[type] ?? type}</td>
                  <td className="px-5 py-3 text-right font-medium text-violet-700">{cnt}명</td>
                  <td className="px-5 py-3 text-right text-gray-500">{total > 0 ? Math.round(cnt / total * 100) : 0}%</td>
                </tr>
              ))}
              {Object.keys(byType).length === 0 && (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-400">데이터 없음</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 재직자 명단 */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">재직자 명단</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-gray-600">이름</th>
              <th className="px-5 py-3 text-left font-medium text-gray-600">부서</th>
              <th className="px-5 py-3 text-left font-medium text-gray-600">직급</th>
              <th className="px-5 py-3 text-left font-medium text-gray-600">고용형태</th>
              <th className="px-5 py-3 text-left font-medium text-gray-600">입사일</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {activeEmployees.map((e: HrEmployee) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-5 py-2.5 font-medium text-gray-800">{e.name}</td>
                <td className="px-5 py-2.5 text-gray-600">{e.department || '—'}</td>
                <td className="px-5 py-2.5 text-gray-600">{e.position || '—'}</td>
                <td className="px-5 py-2.5 text-gray-500">{TYPE_LABEL[e.employment_type] ?? e.employment_type}</td>
                <td className="px-5 py-2.5 text-gray-500 text-xs">{e.hire_date}</td>
              </tr>
            ))}
            {activeEmployees.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">재직자가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
