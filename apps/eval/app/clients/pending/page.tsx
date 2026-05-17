import { getPendingClients } from '@/actions/client-actions'
import { PendingClientTable } from '@/eval/components/eval/PendingClientTable'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'

export default async function PendingClientsPage() {
  const result = await getPendingClients()
  const clients = result.success ? result.clients ?? [] : []

  return (
    <div className="p-8">
      <Link href="/clients" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        클라이언트 목록
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">신규 접수 대기</h1>
          <p className="text-gray-500 text-sm">총 {clients.length}건의 미등록 클라이언트가 있습니다</p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          직접 접수
        </Link>
      </div>

      <PendingClientTable clients={clients} />
    </div>
  )
}
