import { searchClients } from '@/actions/client-actions'
import Link from 'next/link'
import { Users, ClipboardList, ArrowRight } from 'lucide-react'

export default async function EvalDashboard() {
  const recentResult = await searchClients({ limit: 5 })
  const recentClients = recentResult.success ? recentResult.clients ?? [] : []
  const totalClients = recentResult.success ? recentResult.total ?? 0 : 0

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">평가 대시보드</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">전체 클라이언트</p>
              <p className="text-2xl font-bold text-gray-900">{totalClients}명</p>
            </div>
          </div>
        </div>
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ClipboardList className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">바로가기</p>
              <Link
                href="/clients"
                className="text-base font-semibold text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
              >
                클라이언트 검색 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 최근 클라이언트 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">최근 등록된 클라이언트</h2>
          <Link href="/clients" className="text-sm text-blue-600 hover:underline">
            전체보기
          </Link>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">이름</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">장애유형</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">신청건수</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentClients.map(client => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{client.name}</td>
                  <td className="px-4 py-3 text-gray-600">{client.disability_type ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{client.application_count ?? 0}건</td>
                  <td className="px-4 py-3">
                    <Link href={`/clients/${client.id}`} className="text-blue-600 hover:underline">
                      상세보기
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
