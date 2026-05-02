import { getInventoryItem } from '@/actions/inventory-actions'
import { DeviceStatusBadge } from '@/inventory/components/inventory/DeviceStatusBadge'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'

interface DeviceDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function DeviceDetailPage({ params }: DeviceDetailPageProps) {
  const { id } = await params
  const result = await getInventoryItem(id)
  if (!result.success || !result.item) notFound()

  const d = result.item

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex gap-4 py-2.5 border-b last:border-0">
      <dt className="w-32 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  )

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/devices" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{d.name}</h1>
        <Link
          href={`/devices/${id}/edit`}
          className="flex items-center gap-2 px-3 py-1.5 border text-sm font-medium rounded-md hover:bg-gray-50"
        >
          <Pencil className="h-4 w-4" />
          수정
        </Link>
      </div>

      <div className="bg-white border rounded-lg p-6 max-w-2xl">
        <dl>
          {row('기기명', d.name)}
          {row('자산번호', d.asset_code)}
          {row('카테고리', d.category)}
          {row('상태', <DeviceStatusBadge status={d.status} />)}
          {row('제조사', d.manufacturer)}
          {row('모델명', d.model)}
          {row('바코드', d.barcode)}
          {row('구입일', d.purchase_date)}
          {row('구입가격', d.purchase_price ? `${d.purchase_price.toLocaleString()}원` : null)}
          {row('대여가능', d.is_rental_available ? '가능' : '불가')}
        </dl>
      </div>
    </div>
  )
}
