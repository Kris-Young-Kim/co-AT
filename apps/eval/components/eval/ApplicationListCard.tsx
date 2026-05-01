import Link from 'next/link'
import type { Application } from '@/actions/application-actions'

interface ApplicationListCardProps {
  applications: Application[]
  clientId: string
}

const CATEGORY_LABELS: Record<string, string> = {
  consult: '상담',
  experience: '체험',
  custom: '맞춤형',
  aftercare: '사후관리',
  education: '교육/홍보',
}

const STATUS_COLORS: Record<string, string> = {
  '접수': 'bg-gray-100 text-gray-700',
  '배정': 'bg-blue-100 text-blue-700',
  '진행중': 'bg-yellow-100 text-yellow-700',
  '완료': 'bg-green-100 text-green-700',
  '취소': 'bg-red-100 text-red-700',
}

export function ApplicationListCard({ applications, clientId }: ApplicationListCardProps) {
  if (applications.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-gray-500">
        신청서가 없습니다
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {applications.map(app => (
        <Link
          key={app.id}
          href={`/clients/${clientId}/applications/${app.id}`}
          className="block border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">
                {CATEGORY_LABELS[app.category ?? ''] ?? app.category ?? '기타'}
                {app.sub_category ? ` — ${app.sub_category}` : ''}
              </span>
              <p className="text-sm text-gray-500 mt-0.5">
                접수일: {app.created_at ? new Date(app.created_at).toLocaleDateString('ko-KR') : '—'}
              </p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[app.status ?? ''] ?? 'bg-gray-100 text-gray-700'}`}>
              {app.status ?? '접수'}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
