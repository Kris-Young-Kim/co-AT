import Link from 'next/link'
import { getVehicleLogReport } from '@/actions/approval-actions'
import VehicleLogMonthPicker from './VehicleLogMonthPicker'

interface PageProps {
  searchParams: Promise<{ year?: string; month?: string }>
}

export default async function VehicleLogPage({ searchParams }: PageProps) {
  const params = await searchParams
  const now   = new Date()
  const year  = params.year  ? Number(params.year)  : now.getFullYear()
  const month = params.month ? Number(params.month) : now.getMonth() + 1

  const report = await getVehicleLogReport(year, month)
  const totalDistance = report.reduce((s, v) => s + v.total_distance, 0)

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">차량운행일지</h1>
        <Link
          href="/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          + 운행 기록
        </Link>
      </div>

      <VehicleLogMonthPicker year={year} month={month} />

      {/* 전체 요약 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="총 운행거리" value={`${totalDistance.toLocaleString()} km`} />
        <SummaryCard label="총 주유비" value={`${report.reduce((s, v) => s + v.total_fuel_cost, 0).toLocaleString()} 원`} />
        <SummaryCard label="총 통행료" value={`${report.reduce((s, v) => s + v.total_toll_fee, 0).toLocaleString()} 원`} />
        <SummaryCard label="총 주차비" value={`${report.reduce((s, v) => s + v.total_parking_fee, 0).toLocaleString()} 원`} />
      </div>

      {/* 차량별 섹션 */}
      {report.map(v => (
        <section key={v.vehicle_id} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {v.vehicle_number} <span className="text-gray-400 font-normal text-sm">({v.vehicle_name})</span>
            </h2>
            <span className="text-sm text-gray-500">
              {v.logs.length}건 · {v.total_distance.toLocaleString()} km
            </span>
          </div>

          {v.logs.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center border rounded-lg">이 달 운행 기록이 없습니다.</p>
          ) : (
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['일시', '운전자', '출발 → 도착', '업무 목적', '주행(km)', '비용', '상태'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {v.logs.map(log => {
                    const c = log.content
                    const distance = c.end_odometer - c.start_odometer
                    const cost = (c.fuel_cost ?? 0) + (c.toll_fee ?? 0) + (c.parking_fee ?? 0)
                    const departDate = new Date(c.depart_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{departDate}</td>
                        <td className="px-3 py-2">{c.driver_name}</td>
                        <td className="px-3 py-2 text-gray-600">
                          <span>{c.departure}</span>
                          <span className="mx-1 text-gray-400">→</span>
                          <span>{c.destination}</span>
                        </td>
                        <td className="px-3 py-2 max-w-[160px] truncate">{c.purpose}</td>
                        <td className="px-3 py-2 font-medium">{distance.toLocaleString()}</td>
                        <td className="px-3 py-2 text-gray-500">{cost > 0 ? `${cost.toLocaleString()}원` : '-'}</td>
                        <td className="px-3 py-2">
                          <StatusBadge status={log.status} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t font-medium">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right text-gray-600">소계</td>
                    <td className="px-3 py-2">{v.total_distance.toLocaleString()} km</td>
                    <td className="px-3 py-2">
                      {(v.total_fuel_cost + v.total_toll_fee + v.total_parking_fee).toLocaleString()}원
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border rounded-lg px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  )
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft:    { label: '임시저장', className: 'bg-gray-100 text-gray-600' },
  pending:  { label: '결재중',   className: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '승인',     className: 'bg-green-100 text-green-700' },
  rejected: { label: '반려',     className: 'bg-red-100 text-red-600' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>{s.label}</span>
}
