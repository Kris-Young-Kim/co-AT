export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { CheckCircle2, Clock, Circle } from 'lucide-react'

type Stage = {
  status: string
  label: string
  description: string
}

const STAGES: Stage[] = [
  { status: 'requested',   label: '제작 대기', description: '신청이 접수되었습니다' },
  { status: 'in_progress', label: '제작 중',   description: '제작이 시작되었습니다' },
  { status: 'completed',   label: '제작 완료', description: '제작이 완료되었습니다' },
  { status: 'delivered',   label: '지급 완료', description: '기기가 지급되었습니다' },
]

const STATUS_ORDER = ['requested', 'in_progress', 'completed', 'delivered']

export default async function TrackPage({
  params,
}: {
  params: Promise<{ track_token: string }>
}) {
  const { track_token } = await params
  const supabase = createAdminClient()

  const { data: order, error } = await supabase
    .from('inventory_custom_orders')
    .select('id, status, requested_at, delivered_at, notes')
    .eq('track_token', track_token)
    .single()

  if (error || !order) notFound()

  const currentIndex = STATUS_ORDER.indexOf(order.status)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border max-w-md w-full p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-2">맞춤제작 진행 현황</h1>
        <p className="text-sm text-gray-500 mb-8">신청하신 보조기기 맞춤제작 진행 상황을 확인하실 수 있습니다.</p>

        <ol className="relative border-l border-gray-200 ml-3 space-y-8">
          {STAGES.map((stage, idx) => {
            const isDone = idx < currentIndex
            const isCurrent = idx === currentIndex
            const isPending = idx > currentIndex

            return (
              <li key={stage.status} className="ml-6">
                <span className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white ${
                  isDone ? 'bg-green-100' : isCurrent ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : isCurrent ? (
                    <Clock className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400" />
                  )}
                </span>
                <h3 className={`font-semibold text-sm ${
                  isDone ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-400'
                }`}>
                  {stage.label}
                </h3>
                <p className={`text-xs mt-0.5 ${
                  isPending ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  {stage.description}
                  {stage.status === 'requested' && order.requested_at && (
                    <span className="ml-1">({new Date(order.requested_at).toLocaleDateString('ko-KR')})</span>
                  )}
                  {stage.status === 'delivered' && order.delivered_at && (
                    <span className="ml-1">({new Date(order.delivered_at).toLocaleDateString('ko-KR')})</span>
                  )}
                </p>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
