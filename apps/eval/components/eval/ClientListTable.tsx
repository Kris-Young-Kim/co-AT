import Link from 'next/link'
import type { ClientWithStats } from '@/actions/client-actions'

interface ClientListTableProps {
  clients: ClientWithStats[]
  total: number
}

const DISABILITY_LABELS: Record<string, string> = {
  physical: '지체',
  brain_lesion: '뇌병변',
  visual: '시각',
  hearing: '청각',
  language: '언어',
  intellectual: '지적',
  autism: '자폐성',
  mental: '정신',
  kidney: '신장',
  cardiac: '심장',
  respiratory: '호흡기',
  liver: '간',
  face: '안면',
  intestine: '장루·요루',
  epilepsy: '뇌전증',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function ClientListTable({ clients, total }: ClientListTableProps) {
  if (clients.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg">검색 결과가 없습니다</p>
        <p className="text-sm mt-1">이름 또는 생년월일로 검색하세요</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">총 {total}명</p>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">이름</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">생년월일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">장애유형</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">신청건수</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">등록일</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clients.map(client => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{client.name}</td>
                <td className="px-4 py-3 text-gray-600">{client.birth_date ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">
                  {DISABILITY_LABELS[client.disability_type ?? ''] ?? client.disability_type ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">{client.application_count ?? 0}건</td>
                <td className="px-4 py-3 text-gray-600">
                  {client.created_at ? formatDate(client.created_at) : '—'}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/clients/${client.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    상세보기
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
