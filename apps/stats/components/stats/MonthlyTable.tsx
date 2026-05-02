import type { MonthlyStats } from '@/actions/stats-actions'

export function MonthlyTable({ stats, callCenter }: {
  stats: MonthlyStats[]
  callCenter: { month: number; count: number }[]
}) {
  const ccMap = Object.fromEntries(callCenter.map(c => [c.month, c.count]))
  const totals = stats.reduce(
    (acc, s) => ({
      consultation: acc.consultation + s.consultation,
      experience: acc.experience + s.experience,
      custom: acc.custom + s.custom,
      aftercare: acc.aftercare + s.aftercare,
      education: acc.education + s.education,
      total: acc.total + s.total,
      cc: acc.cc + (ccMap[s.month] ?? 0),
    }),
    { consultation: 0, experience: 0, custom: 0, aftercare: 0, education: 0, total: 0, cc: 0 }
  )

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-3 py-3 text-center font-medium text-gray-700">월</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700">콜센터</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700">I.상담·정보</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700">II.체험</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700">III.맞춤형</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700">IV.사후관리</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700">V.교육·홍보</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700">합계</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {stats.map(s => (
            <tr key={s.month} className="hover:bg-gray-50">
              <td className="px-3 py-2.5 text-center font-medium">{s.month}월</td>
              <td className="px-3 py-2.5 text-center text-blue-700">{ccMap[s.month] ?? 0}</td>
              <td className="px-3 py-2.5 text-center">{s.consultation}</td>
              <td className="px-3 py-2.5 text-center">{s.experience}</td>
              <td className="px-3 py-2.5 text-center">{s.custom}</td>
              <td className="px-3 py-2.5 text-center">{s.aftercare}</td>
              <td className="px-3 py-2.5 text-center">{s.education}</td>
              <td className="px-3 py-2.5 text-center font-bold text-blue-700">{s.total}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t bg-gray-50 font-semibold">
          <tr>
            <td className="px-3 py-3 text-center">합계</td>
            <td className="px-3 py-3 text-center text-blue-700">{totals.cc}</td>
            <td className="px-3 py-3 text-center">{totals.consultation}</td>
            <td className="px-3 py-3 text-center">{totals.experience}</td>
            <td className="px-3 py-3 text-center">{totals.custom}</td>
            <td className="px-3 py-3 text-center">{totals.aftercare}</td>
            <td className="px-3 py-3 text-center">{totals.education}</td>
            <td className="px-3 py-3 text-center text-blue-700">{totals.total}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
