import type { YearlyStats } from '@/actions/stats-actions'

export function YearlyTable({ stats }: { stats: YearlyStats[] }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            {['연도','I.상담·정보','II.체험','III.맞춤형','IV.사후관리','V.교육·홍보','합계'].map(h => (
              <th key={h} className="px-4 py-3 text-center font-medium text-gray-700">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {[...stats].reverse().map(row => (
            <tr key={row.year} className="hover:bg-gray-50">
              <td className="px-4 py-2.5 text-center font-medium">{row.year}년</td>
              <td className="px-4 py-2.5 text-center">{row.consultation}</td>
              <td className="px-4 py-2.5 text-center">{row.experience}</td>
              <td className="px-4 py-2.5 text-center">{row.custom}</td>
              <td className="px-4 py-2.5 text-center">{row.aftercare}</td>
              <td className="px-4 py-2.5 text-center">{row.education}</td>
              <td className="px-4 py-2.5 text-center font-bold text-blue-700">{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
