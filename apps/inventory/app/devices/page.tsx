import { getInventoryList } from '@/actions/inventory-actions'
import { DeviceListTable } from '@/inventory/components/inventory/DeviceListTable'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface DevicesPageProps {
  searchParams: Promise<{ q?: string; status?: string; category?: string }>
}

export default async function DevicesPage({ searchParams }: DevicesPageProps) {
  const params = await searchParams
  const result = await getInventoryList({
    search: params.q,
    status: params.status,
    category: params.category,
    limit: 100,
  })
  const items = result.success ? result.items ?? [] : []
  const total = result.success ? result.total ?? 0 : 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">기기 목록</h1>
          <p className="text-sm text-gray-500 mt-1">총 {total}개 기기</p>
        </div>
        <Link
          href="/devices/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          기기 등록
        </Link>
      </div>

      {/* 검색/필터 */}
      <form method="GET" className="flex gap-3 mb-6">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="기기명, 자산번호, 제조사 검색..."
          className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          name="status"
          defaultValue={params.status}
          className="px-3 py-2 border rounded-md text-sm focus:outline-none"
        >
          <option value="">전체 상태</option>
          <option value="보관">보관</option>
          <option value="대여중">대여중</option>
          <option value="수리중">수리중</option>
          <option value="소독중">소독중</option>
          <option value="폐기">폐기</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900"
        >
          검색
        </button>
      </form>

      <DeviceListTable items={items} />
    </div>
  )
}
