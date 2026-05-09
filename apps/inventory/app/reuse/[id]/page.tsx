import { getReuseDispatchById } from '@/actions/reuse-actions'
import { ReuseStatusStepper } from '@/inventory/components/reuse/ReuseStatusStepper'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

export default async function ReuseDetailPage({ params }: Props) {
  const { id } = await params
  const result = await getReuseDispatchById(id)
  if (!result.success || !result.dispatch) notFound()
  const d = result.dispatch

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex gap-4 py-2.5 border-b last:border-0">
      <dt className="w-32 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  )

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/reuse" className="text-gray-500 hover:text-gray-700"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold flex-1">재사용 상세</h1>
      </div>

      <ReuseStatusStepper dispatchId={id} currentStatus={d.status} />

      <div className="bg-white border rounded-lg p-6">
        <dl>
          {row('기기', d.device_name)}
          {row('대상자', d.client_name)}
          {row('지급일', d.dispatched_at?.slice(0, 10))}
          {row('메모', d.notes)}
        </dl>
      </div>
    </div>
  )
}
