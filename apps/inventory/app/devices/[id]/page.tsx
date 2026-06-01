export const dynamic = 'force-dynamic'

import { getInventoryItem } from '@/actions/inventory-actions'
import { getMaintenanceLogs } from '@/actions/maintenance-actions'
import { DeviceStatusBadge } from '@/inventory/components/inventory/DeviceStatusBadge'
import { QrLabelPrint } from '@/inventory/components/inventory/QrLabelPrint'
import { MaintenanceLogForm } from '@/inventory/components/maintenance/MaintenanceLogForm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function DeviceDetailPage({ params }: Props) {
  const { id } = await params
  const [deviceResult, logsResult] = await Promise.all([
    getInventoryItem(id),
    getMaintenanceLogs({ device_id: id, limit: 20 }),
  ])
  if (!deviceResult.success || !deviceResult.item) notFound()

  const d = deviceResult.item
  const logs = logsResult.success ? logsResult.logs ?? [] : []

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex gap-4 py-2.5 border-b last:border-0">
      <dt className="w-32 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  )

  const typeLabels: Record<string, string> = { inspection: '점검', repair: '수리', cleaning: '세척' }
  const statusLabels: Record<string, string> = { pending: '대기', in_progress: '진행중', done: '완료' }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/devices" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{d.name}</h1>
        <QrLabelPrint qrToken={d.qr_token ?? ''} deviceName={d.name} assetCode={d.asset_code} />
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

      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold mb-3">점검/수리 이력</h2>
        {logs.length > 0 ? (
          <div className="bg-white border rounded-lg divide-y text-sm">
            {logs.map(l => (
              <div key={l.id} className="px-4 py-3 flex gap-4">
                <span className="w-12 text-gray-500">{typeLabels[l.type] ?? l.type}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${l.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {statusLabels[l.status] ?? l.status}
                </span>
                <span className="text-gray-500">{l.performed_at?.slice(0, 10) ?? l.created_at?.slice(0, 10) ?? '—'}</span>
                <span className="flex-1">{l.notes ?? '—'}</span>
                {(l.cost ?? 0) > 0 && <span className="text-gray-500">{(l.cost ?? 0).toLocaleString()}원</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">이력이 없습니다.</p>
        )}
        <div className="mt-3">
          <MaintenanceLogForm deviceId={id} />
        </div>
      </div>
    </div>
  )
}
