import Link from 'next/link'
import { GitBranch, Package, Wrench, ClipboardList } from 'lucide-react'
import type { ActiveService } from '@/actions/client-actions'

interface Props {
  services: ActiveService[]
}

const SERVICE_ICONS = {
  grant_eval: GitBranch,
  rental: Package,
  custom_make: Wrench,
  application: ClipboardList,
} as const

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-700',
  rented: 'bg-indigo-100 text-indigo-700',
  overdue: 'bg-red-100 text-red-700',
  design: 'bg-yellow-100 text-yellow-700',
  manufacturing: 'bg-orange-100 text-orange-700',
  inspection: 'bg-purple-100 text-purple-700',
  delivery: 'bg-teal-100 text-teal-700',
  '접수': 'bg-gray-100 text-gray-600',
  '배정': 'bg-blue-100 text-blue-700',
  '진행중': 'bg-yellow-100 text-yellow-700',
}

export function ClientActiveServices({ services }: Props) {
  if (services.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-400 border rounded-lg bg-gray-50">
        현재 진행 중인 서비스가 없습니다
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {services.map((svc) => {
        const Icon = SERVICE_ICONS[svc.service_type]
        const colorClass = STATUS_COLORS[svc.status] ?? 'bg-gray-100 text-gray-600'
        return (
          <Link
            key={svc.id}
            href={svc.detail_url}
            className="flex items-start gap-3 border rounded-lg p-4 bg-white hover:border-blue-400 hover:bg-blue-50/30 transition-colors group"
          >
            <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-gray-100 group-hover:bg-blue-100 transition-colors">
              <Icon className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900 text-sm">{svc.label}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                  {svc.status_label}
                </span>
              </div>
              {svc.metadata && (
                <p className="mt-0.5 text-xs text-gray-500">
                  {Object.values(svc.metadata).join(' · ')}
                </p>
              )}
              <p className="mt-0.5 text-xs text-gray-400">
                {new Date(svc.started_at).toLocaleDateString('ko-KR')} 시작
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
