import { getRentalById } from '@/actions/rental-actions'
import { RentalStatusBadge } from '@/inventory/components/rental/RentalStatusBadge'
import { ReturnButton } from '@/inventory/components/rental/ReturnButton'
import { ExtendButton } from '@/inventory/components/rental/ExtendButton'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface RentalDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function RentalDetailPage({ params }: RentalDetailPageProps) {
  const { id } = await params
  const result = await getRentalById(id)
  if (!result.success || !result.rental) notFound()

  const r = result.rental
  const isActive = r.status === 'rented' || r.status === 'overdue'

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex gap-4 py-2.5 border-b last:border-0">
      <dt className="w-32 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  )

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/rentals" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">대여 상세</h1>
      </div>

      <div className="bg-white border rounded-lg p-6 max-w-2xl mb-6">
        <dl>
          {row('기기명', r.inventory_name)}
          {row('모델', r.inventory_model)}
          {row('이용자', r.client_name)}
          {row('상태', <RentalStatusBadge status={r.status} />)}
          {row('대여 시작', r.rental_start_date)}
          {row('반납 기한', r.rental_end_date)}
          {row('실제 반납일', r.return_date)}
          {row('연장 횟수', `${r.extension_count ?? 0}회`)}
          {r.days_remaining !== undefined && r.status === 'rented' && row('남은 일수', `${r.days_remaining}일`)}
          {r.is_overdue && row('연체', <span className="text-red-600 font-medium">연체 {Math.abs(r.days_remaining ?? 0)}일</span>)}
        </dl>
      </div>

      {isActive && (
        <div className="flex gap-3">
          <ReturnButton rentalId={id} />
          <ExtendButton rentalId={id} currentEndDate={r.rental_end_date} />
        </div>
      )}
    </div>
  )
}
