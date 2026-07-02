import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getCurrentRole } from '@co-at/auth'
import { ROLES } from '@co-at/types'
import { getMyDocuments, getPendingApprovals } from '@/actions/approval-actions'
import type { ApprovalDocumentWithSteps, ApprovalStepRole } from '@co-at/types'
import { FilePlus } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft:    { label: '임시저장', className: 'bg-gray-100 text-gray-600' },
  pending:  { label: '결재중',   className: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '승인',     className: 'bg-green-100 text-green-700' },
  rejected: { label: '반려',     className: 'bg-red-100 text-red-600' },
}

const TYPE_LABELS: Record<string, string> = {
  vehicle_log:     '차량운행일지',
  expenditure:     '지출 결의서',
  leave:           '휴가/출장',
  business_report: '업무 보고',
  grant_referral:  '교부사업 접수공문',
}

function StatusBadge({ status }: { status: string }) {
  const { label, className } = STATUS_LABELS[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>{label}</span>
}

function DocRow({ doc }: { doc: ApprovalDocumentWithSteps }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 font-medium">
        <Link href={`/${doc.id}`} className="hover:text-blue-600">{doc.title}</Link>
      </td>
      <td className="px-4 py-3 text-gray-500 text-sm">{TYPE_LABELS[doc.type] ?? doc.type}</td>
      <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(doc.created_at).toLocaleDateString('ko-KR')}</td>
    </tr>
  )
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) return null

  const role = await getCurrentRole()
  const myDocs = await getMyDocuments(userId)

  const stepRole: ApprovalStepRole | null =
    role === ROLES.ADMIN ? 'admin' : role === ROLES.MANAGER ? 'manager' : null
  const pendingApprovals = stepRole ? await getPendingApprovals(stepRole, userId) : []

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">결재함</h1>
        <Link href="/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
          <FilePlus className="w-4 h-4" />
          기안하기
        </Link>
      </div>

      {pendingApprovals.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">내 결재 대기 ({pendingApprovals.length})</h2>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['문서명', '유형', '상태', '기안일'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingApprovals.map(doc => <DocRow key={doc.id} doc={doc} />)}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">내 기안 문서</h2>
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['문서명', '유형', '상태', '기안일'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {myDocs.map(doc => <DocRow key={doc.id} doc={doc} />)}
              {myDocs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">기안 문서가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
