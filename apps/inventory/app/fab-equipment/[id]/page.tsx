import { getFabEquipmentById } from '@/actions/fab-equipment-actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = { '3d_printer': '3D프린터', cnc: 'CNC', laser: '레이저', other: '기타' }
const STATUS_LABELS: Record<string, string> = { available: '유휴', in_use: '사용중', maintenance: '점검중' }

interface Props { params: Promise<{ id: string }> }

export default async function FabEquipmentDetailPage({ params }: Props) {
  const { id } = await params
  const result = await getFabEquipmentById(id)
  if (!result.success || !result.equipment) notFound()

  const e = result.equipment

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex gap-4 py-2.5 border-b last:border-0">
      <dt className="w-36 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  )

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/fab-equipment" className="text-gray-500 hover:text-gray-700"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold flex-1">{e.name}</h1>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <dl>
          {row('유형', TYPE_LABELS[e.type] ?? e.type)}
          {row('상태', STATUS_LABELS[e.status])}
          {row('시리얼 번호', e.serial_number)}
          {row('구입일', e.purchased_at)}
          {row('메모', e.notes)}
        </dl>
      </div>

      {e.active_orders && e.active_orders.length > 0 && (
        <div className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold text-sm mb-3">연결된 맞춤제작 주문</h2>
          <div className="space-y-2">
            {e.active_orders.map(o => (
              <div key={o.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                <span>{o.client_name ?? '—'}</span>
                <span className="text-gray-500">{o.status}</span>
                <Link href={`/custom-orders/${o.id}`} className="text-blue-600 hover:underline text-xs">보기</Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
