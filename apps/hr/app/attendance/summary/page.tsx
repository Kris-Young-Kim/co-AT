export const dynamic = 'force-dynamic'

import { getEmployees } from '@/actions/employee-actions'
import { getAllAttendance } from '@/actions/attendance-actions'
import { getOvertimeByMonth } from '@/actions/overtime-actions'
import { getAbsenceSummaryByMonth } from '@/actions/daily-absence-actions'
import { Activity } from 'lucide-react'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ month?: string }>
}

const WORK_START_MIN = 9 * 60   // 09:00
const WORK_END_MIN   = 18 * 60  // 18:00

function parseHHMM(t: string | null): number | null {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export default async function AttendanceSummaryPage({ searchParams }: Props) {
  const params = await searchParams
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const month = params.month ?? defaultMonth

  const [employees, records, overtimeRows, absenceMap] = await Promise.all([
    getEmployees(),
    getAllAttendance(month),
    getOvertimeByMonth(month),
    getAbsenceSummaryByMonth(month),
  ])

  const activeEmployees = employees.filter((e: { is_active: boolean }) => e.is_active)

  const year = parseInt(month.slice(0, 4))
  const mon = parseInt(month.slice(5, 7))
  const daysInMonth = new Date(year, mon, 0).getDate()

  type AttRec = { employee_id: string; date: string; check_in: string | null; check_out: string | null }
  type OtRec = { employee_id: string; overtime_minutes: number }

  const recMap = new Map<string, AttRec>()
  for (const r of records as unknown as AttRec[]) {
    recMap.set(`${r.employee_id}_${r.date}`, r)
  }

  const overtimeMap = new Map<string, number>()
  for (const r of overtimeRows as unknown as OtRec[]) {
    overtimeMap.set(r.employee_id, (overtimeMap.get(r.employee_id) ?? 0) + r.overtime_minutes)
  }

  type EmpType = { id: string; name: string; department: string }

  const months: string[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const summary = activeEmployees.map((emp: EmpType) => {
    let present = 0, earlyLeave = 0, absent = 0
    const abs = absenceMap.get(emp.id) ?? { outing: 0, half_am: 0, half_pm: 0, late: 0, outing_minutes: 0, late_minutes: 0 }

    // 지참(지연출근): 출근기록 check_in > 09:00이고 지참 승인기록이 없는 경우 = 지각
    // 지참 승인기록이 있으면 지참(공식)으로 집계
    let lateAuto = 0  // 미신고 지각

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${month}-${String(d).padStart(2, '0')}`
      const dow = new Date(dateStr).getDay()
      if (dow === 0 || dow === 6) continue

      const rec = recMap.get(`${emp.id}_${dateStr}`)
      if (!rec || !rec.check_in) {
        // 오전반차인 경우 반차 반일 출근으로 처리
        const hasHalfAm = abs.half_am > 0
        if (!hasHalfAm) absent++
      } else {
        present++
        const checkInMin = parseHHMM(rec.check_in)
        const checkOutMin = parseHHMM(rec.check_out)

        // 미신고 지각 (지참 승인 없이 늦게 온 경우)
        if (checkInMin !== null && checkInMin > WORK_START_MIN) lateAuto++
        // 미신고 조퇴
        if (checkOutMin !== null && checkOutMin < WORK_END_MIN) earlyLeave++
      }
    }

    const overtimeMin = overtimeMap.get(emp.id) ?? 0
    return {
      ...emp,
      present,
      lateAuto,     // 미신고 지각
      lateOfficial: abs.late,  // 지참(공식)
      earlyLeave,
      absent,
      half_am: abs.half_am,
      half_pm: abs.half_pm,
      outing: abs.outing,
      outing_minutes: abs.outing_minutes,
      late_minutes: abs.late_minutes,
      overtimeMin,
    }
  })

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-gray-900">근무현황</h1>
        </div>
        <div className="flex items-center gap-3">
          <form method="GET">
            <select name="month" defaultValue={month}
              className="border rounded-md px-3 py-1.5 text-sm">
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </form>
          <Link href="/attendance/absences"
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 text-gray-700">
            외출·반차·지참 관리 →
          </Link>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '총 출근일',  value: summary.reduce((s, r) => s + r.present, 0),       color: 'text-green-600' },
          { label: '외출 합계',  value: summary.reduce((s, r) => s + r.outing, 0),        color: 'text-sky-600'   },
          { label: '반차 합계',  value: summary.reduce((s, r) => s + r.half_am + r.half_pm, 0), color: 'text-violet-600' },
          { label: '결근 합계',  value: summary.reduce((s, r) => s + r.absent, 0),        color: 'text-red-600'   },
        ].map(item => (
          <div key={item.label} className="bg-white border rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className={`text-3xl font-bold mt-1 ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* 상세 테이블 */}
      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">성명</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">부서</th>
              <th className="px-4 py-3 text-right font-medium text-green-600">출근</th>
              <th className="px-4 py-3 text-right font-medium text-sky-600">외출</th>
              <th className="px-4 py-3 text-right font-medium text-violet-600">오전반차</th>
              <th className="px-4 py-3 text-right font-medium text-purple-600">오후반차</th>
              <th className="px-4 py-3 text-right font-medium text-orange-500">지참</th>
              <th className="px-4 py-3 text-right font-medium text-yellow-600">미신고지각</th>
              <th className="px-4 py-3 text-right font-medium text-orange-600">조퇴</th>
              <th className="px-4 py-3 text-right font-medium text-red-600">결근</th>
              <th className="px-4 py-3 text-right font-medium text-violet-700">시간외</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {summary.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-800">{r.name}</td>
                <td className="px-4 py-2.5 text-gray-600">{r.department}</td>
                <td className="px-4 py-2.5 text-right text-green-700">{r.present}일</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={r.outing > 0 ? 'text-sky-600 font-medium' : 'text-gray-300'}>
                    {r.outing}회
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className={r.half_am > 0 ? 'text-violet-600 font-medium' : 'text-gray-300'}>
                    {r.half_am}회
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className={r.half_pm > 0 ? 'text-purple-600 font-medium' : 'text-gray-300'}>
                    {r.half_pm}회
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className={r.lateOfficial > 0 ? 'text-orange-500 font-medium' : 'text-gray-300'}>
                    {r.lateOfficial}회
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className={r.lateAuto > 0 ? 'text-yellow-600 font-semibold' : 'text-gray-300'}>
                    {r.lateAuto}회
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className={r.earlyLeave > 0 ? 'text-orange-600 font-medium' : 'text-gray-300'}>
                    {r.earlyLeave}회
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className={r.absent > 0 ? 'text-red-600 font-semibold' : 'text-gray-300'}>
                    {r.absent}일
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right text-violet-700">
                  {(r.overtimeMin / 60).toFixed(1)}h
                </td>
              </tr>
            ))}
            {summary.length === 0 && (
              <tr>
                <td colSpan={11} className="px-5 py-10 text-center text-gray-400">
                  재직 중인 직원이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-400 space-y-0.5">
        <p>* 지참: 공식 지참 신청·승인된 건수 / 미신고지각: 09:00 초과 출근 중 지참 미신청 건</p>
        <p>* 조퇴: 18:00 이전 퇴근 / 결근: 출근 기록 없음 (주말·반차 제외)</p>
      </div>
    </div>
  )
}
