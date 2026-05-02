const DOMAINS = ['WC','ADL','S','SP','EC','CA','L','AAC','AM'] as const
type Domain = typeof DOMAINS[number]

export interface DomainRow {
  label: string
  total: number
  byDomain: Partial<Record<Domain, number>>
  actual_persons: number
  extended_persons: number
}

export function BusinessDomainTable({ rows }: { rows: DomainRow[] }) {
  if (rows.length === 0) return <p className="text-gray-500">데이터가 없습니다.</p>
  return (
    <div className="border rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-3 py-3 text-left font-medium text-gray-700 sticky left-0 bg-gray-50">사업명</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700">합계</th>
            {DOMAINS.map(d => (
              <th key={d} className="px-3 py-3 text-center font-medium text-gray-700">{d}</th>
            ))}
            <th className="px-3 py-3 text-center font-medium text-gray-700">실인원</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700">연인원</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map(row => (
            <tr key={row.label} className="hover:bg-gray-50">
              <td className="px-3 py-2.5 sticky left-0 bg-white">{row.label}</td>
              <td className="px-3 py-2.5 text-center font-bold text-blue-700">{row.total}</td>
              {DOMAINS.map(d => (
                <td key={d} className="px-3 py-2.5 text-center">{row.byDomain[d] ?? 0}</td>
              ))}
              <td className="px-3 py-2.5 text-center">{row.actual_persons}</td>
              <td className="px-3 py-2.5 text-center">{row.extended_persons}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
