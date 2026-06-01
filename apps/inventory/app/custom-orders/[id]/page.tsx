export const dynamic = 'force-dynamic'

import { getCustomOrderById } from '@/actions/custom-order-actions'
import { getFabEquipment } from '@/actions/fab-equipment-actions'
import { CustomOrderStatusStepper } from '@/inventory/components/custom-order/CustomOrderStatusStepper'
import { EquipmentAssignPanel } from '@/inventory/components/custom-order/EquipmentAssignPanel'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

export default async function CustomOrderDetailPage({ params }: Props) {
  const { id } = await params
  const [orderResult, equipResult] = await Promise.all([
    getCustomOrderById(id),
    getFabEquipment(),
  ])
  if (!orderResult.success || !orderResult.order) notFound()

  const order = orderResult.order
  const allEquipment = equipResult.success ? equipResult.equipment ?? [] : []

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex gap-4 py-2.5 border-b last:border-0">
      <dt className="w-32 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  )

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/custom-orders" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold flex-1">맞춤제작 상세</h1>
      </div>

      <CustomOrderStatusStepper orderId={id} currentStatus={order.status} />

      <div className="bg-white border rounded-lg p-6">
        <dl>
          {row('대상자', order.client_name)}
          {row('기기', order.device_name ?? '미배정')}
          {row('신청일', order.requested_at?.slice(0, 10) ?? '—')}
          {row('지급일', order.delivered_at?.slice(0, 10))}
          {row('메모', order.notes)}
        </dl>
      </div>

      <EquipmentAssignPanel
        orderId={id}
        currentEquipment={order.equipment ?? []}
        allEquipment={allEquipment}
      />
    </div>
  )
}
