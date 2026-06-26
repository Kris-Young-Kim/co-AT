import type { MonthlyConfirmedRow } from '@/actions/monthly-report-actions'

interface Props {
  rows: MonthlyConfirmedRow[]
  year: number
}

const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

const COLS: { key: keyof Omit<MonthlyConfirmedRow, 'month'>; label: string }[] = [
  { key: 'consult',        label: '상담' },
  { key: 'assessment',     label: '평가' },
  { key: 'trial',          label: '체험' },
  { key: 'rental',         label: '대여' },
  { key: 'custom_make',    label: '맞춤제작' },
  { key: 'grant',          label: '교부평가' },
  { key: 'education',      label: '교육' },
  { key: 'info_provision', label: '정보제공' },
  { key: 'other_business', label: '기타사업' },
  { key: 'total_cases',    label: '합계건수' },
  { key: 'total_clients',  label: '연인원' },
]

function sumCol(rows: MonthlyConfirmedRow[], key: keyof Omit<MonthlyConfirmedRow, 'month'>): number {
  return rows.reduce((acc, r) => acc + r[key], 0)
}

export function MonthlyReportTable({ rows, year }: Props) {
  if (rows.every(r => r.total_cases === 0)) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        {year}년 확정 서비스 기록이 없습니다.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-blue-50 text-blue-800">
            <th className="px-3 py-2 text-left font-semibold w-12 border-b border-blue-100">월</th>
            {COLS.map(c => (
              <th key={c.key} className="px-3 py-2 text-right font-semibold border-b border-blue-100">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr
              key={row.month}
              className={row.total_cases === 0 ? 'text-gray-300' : 'hover:bg-gray-50'}
            >
              <td className="px-3 py-1.5 font-medium text-gray-700 border-b border-gray-100">
                {MONTH_LABELS[row.month - 1]}
              </td>
              {COLS.map(c => (
                <td
                  key={c.key}
                  className={`px-3 py-1.5 text-right border-b border-gray-100 tabular-nums ${
                    (c.key === 'total_cases' || c.key === 'total_clients') && row[c.key] > 0
                      ? 'font-semibold text-gray-900'
                      : 'text-gray-600'
                  }`}
                >
                  {row[c.key] > 0 ? row[c.key] : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-yellow-50 font-semibold text-gray-900">
            <td className="px-3 py-2">합계</td>
            {COLS.map(c => {
              const s = sumCol(rows, c.key)
              return (
                <td key={c.key} className="px-3 py-2 text-right tabular-nums">
                  {s > 0 ? s : '-'}
                </td>
              )
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
