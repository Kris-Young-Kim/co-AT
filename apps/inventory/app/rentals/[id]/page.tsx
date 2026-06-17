export const dynamic = 'force-dynamic'

import { getRentalById } from '@/actions/rental-actions'
import { getContractByRentalId } from '@/actions/rental-contract-actions'
import { RentalStatusBadge } from '@/inventory/components/rental/RentalStatusBadge'
import { ReturnButton } from '@/inventory/components/rental/ReturnButton'
import { ExtendButton } from '@/inventory/components/rental/ExtendButton'
import { RentalContractPanel } from '@/inventory/components/contracts/RentalContractPanel'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, User } from 'lucide-react'

const EVAL_URL = process.env.NEXT_PUBLIC_EVAL_URL ?? 'https://eval.gwatc.cloud'

interface RentalDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function RentalDetailPage({ params }: RentalDetailPageProps) {
  const { id } = await params
  const [result, contractResult] = await Promise.all([
    getRentalById(id),
    getContractByRentalId(id),
  ])
  if (!result.success || !result.rental) notFound()

  const r = result.rental
  const isActive = r.status === 'rented' || r.status === 'overdue'

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex gap-4 py-2.5 border-b last:border-0">
      <dt className="w-32 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  )

  const evalClientUrl = `${EVAL_URL}/clients/${r.client_id}`

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/rentals" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">대여 상세</h1>
      </div>

      {/* 대여 정보 */}
      <div className="bg-white border rounded-lg p-6 max-w-2xl mb-4">
        <dl>
          {row('기기명', r.inventory_name)}
          {row('모델', r.inventory_model)}
          {row('상태', <RentalStatusBadge status={r.status} />)}
          {row('대여 시작', r.rental_start_date)}
          {row('반납 기한', r.rental_end_date)}
          {row('실제 반납일', r.return_date)}
          {row('연장 횟수', `${r.extension_count ?? 0}회`)}
          {r.days_remaining !== undefined && r.status === 'rented' && row('남은 일수', `${r.days_remaining}일`)}
          {r.is_overdue && row('연체', <span className="text-red-600 font-medium">연체 {Math.abs(r.days_remaining ?? 0)}일</span>)}
        </dl>
      </div>

      {/* 대상자 정보 */}
      <div className="bg-white border rounded-lg p-6 max-w-2xl mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <User className="h-4 w-4" />
            대상자 정보
          </h2>
          <Link
            href={evalClientUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
          >
            eval 앱에서 보기
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <dl>
          {row('이름', r.client_name)}
          {row('생년월일', r.client_birth_date)}
          {row('장애유형', r.client_disability_type)}
          {row('연락처', r.client_contact)}
        </dl>
      </div>

      {isActive && (
        <div className="flex gap-3 mb-6 max-w-2xl">
          <ReturnButton rentalId={id} />
          <ExtendButton rentalId={id} currentEndDate={r.rental_end_date} />
        </div>
      )}

      <RentalContractPanel
        rentalId={id}
        initialContract={contractResult.success ? (contractResult.contract ?? null) : null}
      />
    </div>
  )
}
