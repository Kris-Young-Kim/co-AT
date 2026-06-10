import Link from 'next/link'
import type { GrantAssessmentListItem } from '@/actions/grant-assessment-actions'

interface Props {
  assessments: GrantAssessmentListItem[]
}

const COLUMNS = [
  { key: 'draft',     label: '작성 중',  color: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
  { key: 'submitted', label: '제출됨',   color: 'bg-blue-50 border-blue-200',     dot: 'bg-blue-400',   badge: 'bg-blue-100 text-blue-700' },
  { key: 'completed', label: '완료',     color: 'bg-green-50 border-green-200',   dot: 'bg-green-400',  badge: 'bg-green-100 text-green-700' },
]

function KanbanCard({ item }: { item: GrantAssessmentListItem }) {
  return (
    <Link href={'/grant-eval/' + item.id}>
      <div className="bg-white rounded-md border p-3 hover:shadow-sm transition-shadow cursor-pointer">
        <p className="font-medium text-sm text-gray-900">{item.client_name}</p>
        {item.referral_org && (
          <p className="text-xs text-gray-500 mt-0.5">{item.referral_org}</p>
        )}
        {item.evaluation_date && (
          <p className="text-xs text-gray-400 mt-1">평가일: {item.evaluation_date}</p>
        )}
        {item.item_categories && item.item_categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.item_categories.map((cat, i) => (
              <span key={i} className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                {cat}
              </span>
            ))}
          </div>
        )}
        {item.final_result && (
          <p className="text-xs font-medium text-green-700 mt-1.5">결과: {item.final_result}</p>
        )}
      </div>
    </Link>
  )
}

export default function GrantEvalKanban({ assessments }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((col) => {
        const columnItems = assessments.filter((a) => a.status === col.key)
        const count = columnItems.length
        return (
          <div key={col.key} className={`rounded-lg border p-3 ${col.color}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                <span className="text-sm font-semibold text-gray-800">{col.label}</span>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${col.badge}`}>
                {count}
              </span>
            </div>
            <div className="space-y-2">
              {columnItems.map((item) => (
                <KanbanCard key={item.id} item={item} />
              ))}
              {columnItems.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">없음</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
