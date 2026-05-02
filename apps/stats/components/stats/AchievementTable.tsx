import type { AnnualTarget } from '@/actions/annual-target-actions'

interface Row {
  label: string
  target: number | '상시'
  actual: number
}

interface AchievementTableProps {
  target: AnnualTarget | null
  actual: {
    consultation: number
    callCenter: number
    experience: number
    rental: number
    customMake: number
    assessment: number
    cleaning: number
    repair: number
    reuse: number
    professionalEdu: number
    promotion: number
  }
}

function rate(actual: number, target: number | '상시'): string {
  if (target === '상시') return '상시'
  if (target === 0) return '—'
  return `${Math.round((actual / target) * 100)}%`
}

export function AchievementTable({ target, actual }: AchievementTableProps) {
  const rows: Row[] = [
    { label: '보조기기 상담(연인원)', target: target?.consultation ?? 0, actual: actual.consultation },
    { label: '콜센터', target: '상시', actual: actual.callCenter },
    { label: '보조기기 사용 체험', target: target?.experience ?? 0, actual: actual.experience },
    { label: '대여', target: target?.rental ?? 0, actual: actual.rental },
    { label: '보조기기 맞춤 제작 지원', target: target?.custom_make ?? 0, actual: actual.customMake },
    { label: '교부사업 맞춤형 평가지원', target: '상시', actual: actual.assessment },
    { label: '보조기기 소독 및 세척', target: target?.cleaning ?? 0, actual: actual.cleaning },
    { label: '보조기기 점검 및 수리', target: target?.repair ?? 0, actual: actual.repair },
    { label: '보조기기 재사용 지원', target: target?.reuse ?? 0, actual: actual.reuse },
    { label: '전문인력 교육 등', target: target?.professional_edu ?? 0, actual: actual.professionalEdu },
    { label: '홍보', target: target?.promotion ?? 0, actual: actual.promotion },
  ]

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-700">사업 내용</th>
            <th className="px-4 py-3 font-medium text-gray-700 text-center">목표</th>
            <th className="px-4 py-3 font-medium text-gray-700 text-center">실적</th>
            <th className="px-4 py-3 font-medium text-gray-700 text-center">달성률</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map(row => {
            const r = rate(row.actual, row.target)
            const pct = r !== '상시' && r !== '—' ? parseInt(r) : null
            return (
              <tr key={row.label} className="hover:bg-gray-50">
                <td className="px-4 py-2.5">{row.label}</td>
                <td className="px-4 py-2.5 text-center text-gray-600">
                  {row.target === '상시' ? '상시' : row.target.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-center font-medium">{row.actual.toLocaleString()}</td>
                <td className={`px-4 py-2.5 text-center font-semibold ${
                  pct === null ? 'text-gray-400' :
                  pct >= 100 ? 'text-green-600' :
                  pct >= 70 ? 'text-blue-600' : 'text-red-500'
                }`}>
                  {r}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
