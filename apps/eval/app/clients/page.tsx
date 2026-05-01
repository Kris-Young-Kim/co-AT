import { searchClients } from '@/actions/client-actions'
import { ClientSearchBar } from '@/eval/components/eval/ClientSearchBar'
import { ClientListTable } from '@/eval/components/eval/ClientListTable'
import { Suspense } from 'react'

interface ClientsPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const { q } = await searchParams
  const result = await searchClients({ query: q, limit: 30 })
  const clients = result.success ? result.clients ?? [] : []
  const total = result.success ? result.total ?? 0 : 0

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">클라이언트</h1>
        <p className="text-gray-500 text-sm">이름 또는 생년월일로 검색하세요</p>
      </div>

      <div className="mb-6">
        <Suspense>
          <ClientSearchBar />
        </Suspense>
      </div>

      <ClientListTable clients={clients} total={total} />
    </div>
  )
}
