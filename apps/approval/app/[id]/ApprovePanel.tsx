'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { approveStep, rejectStep, getSignature } from '@/actions/approval-actions'
import type { ApprovalStep } from '@co-at/types'

interface Props {
  step: ApprovalStep
}

export function ApprovePanel({ step }: Props) {
  const { user } = useUser()
  const router = useRouter()
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    getSignature(user.id).then(sig => {
      if (sig) setSignatureUrl(sig.image_url)
    })
  }, [user?.id])

  async function handleApprove() {
    if (!user?.id) return
    setSubmitting(true)
    setError(null)
    const ok = await approveStep(step.id, user.id, signatureUrl)
    if (ok) {
      router.refresh()
    } else {
      setError('결재 처리 실패. 다시 시도해주세요.')
      setSubmitting(false)
    }
  }

  async function handleReject() {
    if (!user?.id) return
    if (!comment.trim()) { setError('반려 사유를 입력해주세요.'); return }
    setSubmitting(true)
    setError(null)
    const ok = await rejectStep(step.id, user.id, comment)
    if (ok) {
      router.refresh()
    } else {
      setError('반려 처리 실패. 다시 시도해주세요.')
      setSubmitting(false)
    }
  }

  const stepLabel = step.step === 1 ? '팀장' : '센터장'

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 space-y-4">
      <p className="font-semibold text-yellow-800">{stepLabel} 결재 차례입니다.</p>

      {signatureUrl ? (
        <div>
          <p className="text-sm text-gray-600 mb-2">결재 시 사용될 서명</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={signatureUrl} alt="서명" className="h-16 object-contain border rounded bg-white p-1" />
        </div>
      ) : (
        <p className="text-sm text-amber-700">
          서명 이미지가 없습니다.{' '}
          <a href="/settings/signature" className="underline font-medium">서명 등록하기</a>
        </p>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {showRejectForm ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">반려 사유 *</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder="반려 사유를 입력하세요."
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={submitting}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? '처리 중...' : '반려 확정'}
            </button>
            <button
              onClick={() => { setShowRejectForm(false); setComment('') }}
              disabled={submitting}
              className="border px-4 py-2 rounded-md text-sm hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={submitting}
            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? '처리 중...' : '승인'}
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={submitting}
            className="bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm hover:bg-red-200 disabled:opacity-50"
          >
            반려
          </button>
        </div>
      )}
    </div>
  )
}
