import { searchClients, getPendingCount, getActiveServiceBadgesByClientIds, getClientByQrToken } from '@/actions/client-actions'
import { ClientSearchBar } from '@/eval/components/eval/ClientSearchBar'
import { ClientListTable } from '@/eval/components/eval/ClientListTable'
import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertCircle, XCircle } from 'lucide-react'

interface ClientsPageProps {
  searchParams: Promise<{ q?: string; qr?: string }>
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const { q, qr } = await searchParams

  if (qr) {
    const result = await getClientByQrToken(qr)
    if (result.success && result.client) {
      redirect(`/clients/${result.client.id}`)
    }
    // QR not found — fall through to show error + normal list
  }

  const [result, pendingCount] = await Promise.all([
    searchClients({ query: q, limit: 30 }),
    getPendingCount(),
  ])
  const clients = result.success ? result.clients ?? [] : []
  const total = result.success ? result.total ?? 0 : 0

  const badgeResult = await getActiveServiceBadgesByClientIds(clients.map(c => c.id))
  const badgeMap = badgeResult.success ? badgeResult.data ?? {} : {}

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">클라이언트</h1>
        <p className="text-gray-500 text-sm">이름 또는 생년월일로 검색하세요</p>
      </div>

      {qr && (
        <div className="flex items-center gap-3 p-4 mb-6 rounded-lg bg-red-50 border border-red-200">
          <XCircle className="h-5 w-5 text-red-500 shrink-0" />
          <span className="text-sm text-red-700">
            QR 코드에 해당하는 대상자를 찾을 수 없습니다.
          </span>
        </div>
      )}

      {pendingCount > 0 && (
        <Link
          href="/clients/pending"
          className="flex items-center gap-3 p-4 mb-6 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
        >
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <span className="text-sm text-amber-800 font-medium">
            신규 접수 대기 {pendingCount}건 — 등록 처리가 필요합니다
          </span>
        </Link>
      )}

      <div className="mb-6">
        <Suspense>
          <ClientSearchBar />
        </Suspense>
      </div>

      <ClientListTable clients={clients} total={total} badgeMap={badgeMap} />
    </div>
  )
}
