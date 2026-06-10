import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { getCurrentRole, requireRole } from '@co-at/auth'
import { ROLES } from '@co-at/types'
import { getDocument, submitDocument } from '@/actions/approval-actions'
import type {
  ApprovalDocumentWithSteps,
  ApprovalStep,
  ExpenditureContent,
  LeaveContent,
  BusinessReportContent,
  GrantReferralContent,
} from '@co-at/types'
import { ApprovePanel } from './ApprovePanel'
import { FileDown, Send } from 'lucide-react'
import { revalidatePath } from 'next/cache'

// ── Labels ────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  expenditure:     '지출 결의서',
  leave:           '휴가/출장 신청서',
  business_report: '업무 보고서/기안문',
  grant_referral:  '교부사업 접수공문',
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft:    { label: '임시저장', className: 'bg-gray-100 text-gray-600' },
  pending:  { label: '결재중',   className: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '승인완료', className: 'bg-green-100 text-green-700' },
  rejected: { label: '반려',     className: 'bg-red-100 text-red-600' },
}

const STEP_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending:  { label: '대기중', className: 'text-yellow-600' },
  approved: { label: '승인',   className: 'text-green-600' },
  rejected: { label: '반려',   className: 'text-red-600' },
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual:        '연차',
  half:          '반차',
  business_trip: '출장',
  other:         '기타',
}

// ── Content renderers ─────────────────────────────────────

function ExpenditureDetail({ c }: { c: ExpenditureContent }) {
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
      <div><dt className="text-gray-500">항목명</dt><dd className="font-medium mt-0.5">{c.item_name}</dd></div>
      <div><dt className="text-gray-500">금액</dt><dd className="font-medium mt-0.5">{c.amount.toLocaleString()}원</dd></div>
      <div><dt className="text-gray-500">지출일</dt><dd className="font-medium mt-0.5">{c.spend_date}</dd></div>
      {c.note && <div className="col-span-2"><dt className="text-gray-500">비고</dt><dd className="font-medium mt-0.5">{c.note}</dd></div>}
    </dl>
  )
}

function LeaveDetail({ c }: { c: LeaveContent }) {
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
      <div><dt className="text-gray-500">유형</dt><dd className="font-medium mt-0.5">{LEAVE_TYPE_LABELS[c.leave_type] ?? c.leave_type}</dd></div>
      <div><dt className="text-gray-500">기간</dt><dd className="font-medium mt-0.5">{c.start_date} ~ {c.end_date}</dd></div>
      <div className="col-span-2"><dt className="text-gray-500">사유</dt><dd className="font-medium mt-0.5">{c.reason}</dd></div>
      {c.destination && <div className="col-span-2"><dt className="text-gray-500">행선지</dt><dd className="font-medium mt-0.5">{c.destination}</dd></div>}
    </dl>
  )
}

function BusinessReportDetail({ c }: { c: BusinessReportContent }) {
  return (
    <dl className="space-y-4 text-sm">
      <div><dt className="text-gray-500 mb-1">배경 및 목적</dt><dd className="font-medium whitespace-pre-wrap">{c.background}</dd></div>
      <div><dt className="text-gray-500 mb-1">내용</dt><dd className="font-medium whitespace-pre-wrap">{c.body}</dd></div>
    </dl>
  )
}

function GrantReferralDetail({ c }: { c: GrantReferralContent }) {
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
      <div><dt className="text-gray-500">발송기관</dt><dd className="font-medium mt-0.5">{c.sending_org}</dd></div>
      {c.doc_number && <div><dt className="text-gray-500">공문번호</dt><dd className="font-medium mt-0.5">{c.doc_number}</dd></div>}
      {c.doc_date && <div><dt className="text-gray-500">공문일</dt><dd className="font-medium mt-0.5">{c.doc_date}</dd></div>}
      {c.receive_date && <div><dt className="text-gray-500">접수일</dt><dd className="font-medium mt-0.5">{c.receive_date}</dd></div>}
      {c.referral_round != null && <div><dt className="text-gray-500">의뢰 회차</dt><dd className="font-medium mt-0.5">{c.referral_round}차</dd></div>}
      {c.referral_count != null && <div><dt className="text-gray-500">의뢰 건수</dt><dd className="font-medium mt-0.5">{c.referral_count}건</dd></div>}
      {c.note && <div className="col-span-2"><dt className="text-gray-500">비고</dt><dd className="font-medium mt-0.5 whitespace-pre-wrap">{c.note}</dd></div>}
    </dl>
  )
}

function DocumentContent({ doc }: { doc: ApprovalDocumentWithSteps }) {
  const c = doc.content
  if (doc.type === 'expenditure')   return <ExpenditureDetail c={c as ExpenditureContent} />
  if (doc.type === 'leave')         return <LeaveDetail c={c as LeaveContent} />
  if (doc.type === 'grant_referral') return <GrantReferralDetail c={c as GrantReferralContent} />
  return <BusinessReportDetail c={c as BusinessReportContent} />
}

// ── Approval step row ─────────────────────────────────────

function StepRow({ step, label }: { step: ApprovalStep; label: string }) {
  const { label: statusLabel, className } = STEP_STATUS_STYLES[step.status] ?? { label: step.status, className: 'text-gray-500' }
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="w-20 shrink-0 text-sm font-medium text-gray-600">{label}</div>
      <div className="flex-1">
        <span className={`text-sm font-semibold ${className}`}>{statusLabel}</span>
        {step.acted_at && (
          <span className="text-xs text-gray-400 ml-2">{new Date(step.acted_at).toLocaleString('ko-KR')}</span>
        )}
        {step.comment && (
          <p className="mt-1 text-sm text-red-600">사유: {step.comment}</p>
        )}
      </div>
      <div className="w-24 shrink-0">
        {step.signature_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={step.signature_url} alt="서명" className="h-12 object-contain border rounded bg-white p-0.5" />
        ) : (
          <div className="h-12 w-20 border border-dashed rounded flex items-center justify-center text-xs text-gray-400">미결재</div>
        )}
      </div>
    </div>
  )
}

// ── Submit action ─────────────────────────────────────────

async function submitAction(id: string) {
  'use server'
  await submitDocument(id)
  revalidatePath(`/${id}`)
}

// ── Page ──────────────────────────────────────────────────

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const doc = await getDocument(id)
  if (!doc) notFound()

  const role = await getCurrentRole()
  const isManager = await requireRole(ROLES.MANAGER)
  const isAdmin   = await requireRole(ROLES.ADMIN)

  const step1 = doc.approval_steps.find(s => s.step === 1)
  const step2 = doc.approval_steps.find(s => s.step === 2)

  // Determine which pending step the current user can act on
  let actionableStep: ApprovalStep | null = null
  if (step1?.status === 'pending' && isManager) {
    actionableStep = step1
  } else if (step1?.status === 'approved' && step2?.status === 'pending' && isAdmin) {
    actionableStep = step2
  }

  const statusStyle = STATUS_STYLES[doc.status] ?? { label: doc.status, className: 'bg-gray-100 text-gray-600' }
  const isOwner = doc.created_by === userId

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← 결재함</Link>
          <h1 className="text-2xl font-bold mt-1">{doc.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-gray-500">{TYPE_LABELS[doc.type] ?? doc.type}</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">{new Date(doc.created_at).toLocaleDateString('ko-KR')} 기안</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.className}`}>
              {statusStyle.label}
            </span>
          </div>
        </div>
        <Link
          href={`/${id}/pdf`}
          target="_blank"
          className="flex items-center gap-1.5 text-sm border px-3 py-1.5 rounded-md hover:bg-gray-50 shrink-0"
        >
          <FileDown className="w-4 h-4" />
          PDF
        </Link>
      </div>

      {/* Document content */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">문서 내용</h2>
        <DocumentContent doc={doc} />
      </div>

      {/* Approval steps */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">결재 현황</h2>
        <div className="divide-y">
          {step1 && <StepRow step={step1} label="팀장 (1차)" />}
          {step2 && <StepRow step={step2} label="센터장 (2차)" />}
          {!step1 && !step2 && (
            <p className="py-4 text-sm text-gray-400">아직 제출되지 않은 문서입니다.</p>
          )}
        </div>
      </div>

      {/* Submit button for draft */}
      {doc.status === 'draft' && isOwner && (
        <form action={submitAction.bind(null, id)}>
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
            결재 요청
          </button>
        </form>
      )}

      {/* Approve/reject panel */}
      {actionableStep && doc.status === 'pending' && (
        <ApprovePanel step={actionableStep} />
      )}

      {/* Rejected info */}
      {doc.status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          이 문서는 반려되었습니다.
        </div>
      )}

      {/* Approved info */}
      {doc.status === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
          최종 결재가 완료된 문서입니다.
        </div>
      )}
    </div>
  )
}
