import type { ActiveService } from '@/actions/client-actions'

interface Props {
  services: ActiveService[]
  excludeType?: ActiveService['service_type']
}

function getBadgeClass(service: ActiveService): string {
  if (service.service_type === 'rental') {
    return service.status === 'overdue'
      ? 'border border-red-300 text-red-700 bg-red-50'
      : 'border border-blue-300 text-blue-700 bg-blue-50'
  }
  if (service.service_type === 'custom_make') return 'border border-purple-300 text-purple-700 bg-purple-50'
  if (service.service_type === 'application') return 'border border-gray-300 text-gray-600 bg-gray-50'
  if (service.service_type === 'grant_eval')  return 'border border-green-300 text-green-700 bg-green-50'
  return 'border border-gray-300 text-gray-600 bg-gray-50'
}

function getBadgeText(service: ActiveService): string {
  if (service.service_type === 'rental')      return service.status_label
  if (service.service_type === 'custom_make') return '맞춤제작'
  if (service.service_type === 'application') return '서비스신청'
  if (service.service_type === 'grant_eval')  return '교부평가'
  return service.label
}

export function ClientServiceBadges({ services, excludeType }: Props) {
  const visible = excludeType ? services.filter(s => s.service_type !== excludeType) : services
  if (visible.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map(service => (
        <span
          key={service.id}
          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getBadgeClass(service)}`}
        >
          {getBadgeText(service)}
        </span>
      ))}
    </div>
  )
}
