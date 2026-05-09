import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getArchive } from '@/actions/approval-actions'
import type { ApprovalDocumentWithSteps } from '@co-at/types'

const TYPE_LABELS: Record<string, string> = {
  expenditure:     '지출 결의서',
  leave:           '휴가/출장',
  business_report: '업무 보고',
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft:    { label: '임시저장', className: 'bg-gray-100 text-gray-600' },
  pending:  { label: '결재중',   className: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '승인완료', className: 'bg-green-100 text-green-700' },
  rejected: { label: '반려',     className: 'bg-red-100 text-red-600' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  )
}

function DocRow({ doc }: { doc: ApprovalDocumentWithSteps }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 font-medium">
        <Link href={`/${doc.id}`} className="hover:text-blue-600">{doc.title}</Link>
      </td>
      <td className="px-4 py-3 text-gray-500 text-sm">{TYPE_LABELS[doc.type] ?? doc.type}</td>
      <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
      <td className="px-4 py-3 text-gray-400 text-xs">
        {new Date(doc.created_at).toLocaleDateString('ko-KR')}
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/${doc.id}/pdf`}
          target="_blank"
          className="text-xs text-blue-600 hover:underline"
        >
          PDF
        </Link>
      </td>
    </tr>
  )
}

interface Props {
  searchParams: Promise<{ type?: string; status?: string; q?: string }>
}

export default async function ArchivePage({ searchParams }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const sp = await searchParams
  const filters = {
    type:   sp.type   || undefined,
    status: sp.status || undefined,
    search: sp.q      || undefined,
  }

  const docs = await getArchive(filters)

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">보관함</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← 결재함</Link>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <select
          name="type"
          defaultValue={sp.type ?? ''}
          className="border rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">전체 유형</option>
          <option value="expenditure">지출 결의서</option>
          <option value="leave">휴가/출장</option>
          <option value="business_report">업무 보고</option>
        </select>
        <select
          name="status"
          defaultValue={sp.status ?? ''}
          className="border rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">전체 상태</option>
          <option value="pending">결재중</option>
          <option value="approved">승인완료</option>
          <option value="rejected">반려</option>
        </select>
        <input
          name="q"
          type="text"
          defaultValue={sp.q ?? ''}
          placeholder="문서 제목 검색..."
          className="border rounded-md px-3 py-1.5 text-sm w-52"
        />
        <button
          type="submit"
          className="bg-gray-800 text-white px-4 py-1.5 rounded-md text-sm hover:bg-gray-700"
        >
          검색
        </button>
        {(sp.type || sp.status || sp.q) && (
          <Link
            href="/archive"
            className="border px-4 py-1.5 rounded-md text-sm hover:bg-gray-50"
          >
            초기화
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['문서명', '유형', '상태', '기안일', ''].map((h, i) => (
                <th key={i} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {docs.map(doc => <DocRow key={doc.id} doc={doc} />)}
            {docs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">총 {docs.length}건</p>
    </div>
  )
}
