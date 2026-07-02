'use client'

import { useState, useTransition } from 'react'
import { FileSignature, Send, X, CheckCircle2, Clock, PenLine, AlertCircle } from 'lucide-react'
import { sendSigningRequest, signAsEmployer, cancelSigning, type ContractWithSign } from '@/actions/contract-actions'
import { SignaturePad } from './SignaturePad'

interface Props {
  contract: ContractWithSign
  employeeName: string
}

const STATUS_MAP = {
  draft:            { label: '서명 전',        color: 'text-gray-500',  icon: FileSignature },
  pending_employee: { label: '직원 서명 대기',  color: 'text-orange-600', icon: Clock        },
  employee_signed:  { label: '직원 서명 완료', color: 'text-blue-600',  icon: PenLine      },
  completed:        { label: '서명 완료',       color: 'text-green-600', icon: CheckCircle2 },
  cancelled:        { label: '취소됨',          color: 'text-gray-400',  icon: AlertCircle  },
} as const

export function ContractSignaturePanel({ contract, employeeName }: Props) {
  const [status, setStatus] = useState(contract.status)
  const [sentTo, setSentTo] = useState(contract.sent_to ?? '')
  const [showSendForm, setShowSendForm] = useState(false)
  const [showEmployerSign, setShowEmployerSign] = useState(false)
  const [pendingSignData, setPendingSignData] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  const hrBaseUrl = process.env.NEXT_PUBLIC_HR_URL ?? 'https://hr.gwatc.cloud'
  const signUrl = `${hrBaseUrl}/contracts/sign/${contract.employee_token}`

  const { label, color, icon: Icon } = STATUS_MAP[status] ?? STATUS_MAP.draft

  function handleSend() {
    if (!sentTo.trim()) { setError('이메일 주소를 입력해주세요'); return }
    setError('')
    startTransition(async () => {
      const res = await sendSigningRequest(contract.id, sentTo.trim(), employeeName)
      if (res.success) {
        setStatus('pending_employee')
        setShowSendForm(false)
      } else {
        setError(res.error ?? '발송 실패')
      }
    })
  }

  function handleEmployerSign() {
    if (!pendingSignData) { setError('서명을 입력해주세요'); return }
    setError('')
    startTransition(async () => {
      const res = await signAsEmployer(contract.id, pendingSignData)
      if (res.success) {
        setStatus('completed')
        setShowEmployerSign(false)
      } else {
        setError(res.error ?? '저장 실패')
      }
    })
  }

  function handleCancel() {
    if (!confirm('서명 요청을 취소하고 초안 상태로 되돌리시겠습니까?')) return
    setError('')
    startTransition(async () => {
      const res = await cancelSigning(contract.id)
      if (res.success) {
        setStatus('draft')
        setShowSendForm(false)
      } else {
        setError(res.error ?? '취소 실패')
      }
    })
  }

  async function copyLink() {
    await navigator.clipboard.writeText(signUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border rounded-lg bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 text-sm font-medium ${color}`}>
          <Icon className="h-4 w-4" />
          {label}
        </div>
        {status === 'completed' && (
          <span className="text-xs text-gray-400">
            {contract.employer_signed_at
              ? new Date(contract.employer_signed_at).toLocaleDateString('ko-KR')
              : ''} 완료
          </span>
        )}
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {/* 서명 이미지 썸네일 */}
      {status === 'completed' && (contract.employee_signature_data || contract.employer_signature_data) && (
        <div className="grid grid-cols-2 gap-3">
          {contract.employee_signature_data && (
            <div>
              <p className="text-xs text-gray-400 mb-1">직원 서명</p>
              <img src={contract.employee_signature_data} alt="직원 서명" className="border rounded h-12 w-full object-contain bg-gray-50" />
            </div>
          )}
          {contract.employer_signature_data && (
            <div>
              <p className="text-xs text-gray-400 mb-1">사업주 서명</p>
              <img src={contract.employer_signature_data} alt="사업주 서명" className="border rounded h-12 w-full object-contain bg-gray-50" />
            </div>
          )}
        </div>
      )}

      {/* draft → 서명 요청 발송 */}
      {(status === 'draft' || status === 'cancelled') && (
        <>
          {!showSendForm ? (
            <button
              onClick={() => setShowSendForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              서명 요청 발송
            </button>
          ) : (
            <div className="border rounded-lg p-3 space-y-2">
              <p className="text-xs text-gray-500">직원 이메일로 서명 링크를 발송합니다</p>
              <input
                type="email"
                value={sentTo}
                onChange={e => setSentTo(e.target.value)}
                placeholder="직원 이메일 주소"
                className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSend}
                  disabled={isPending}
                  className="px-3 py-1.5 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                >
                  {isPending ? '발송 중...' : '발송'}
                </button>
                <button onClick={() => setShowSendForm(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">
                  취소
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* pending_employee → 링크 표시 + 취소 */}
      {status === 'pending_employee' && (
        <div className="space-y-2">
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-xs text-gray-500 mb-1">발송됨 → {contract.sent_to}</p>
            <div className="flex items-center gap-2">
              <code className="text-xs text-gray-700 break-all flex-1 line-clamp-1">{signUrl}</code>
              <button onClick={copyLink} className="shrink-0 text-xs text-violet-600 hover:underline">
                {copied ? '복사됨!' : '복사'}
              </button>
            </div>
          </div>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            <X className="h-3 w-3" />
            요청 취소
          </button>
        </div>
      )}

      {/* employee_signed → 사업주 서명 */}
      {status === 'employee_signed' && (
        <>
          {contract.employee_signature_data && (
            <div>
              <p className="text-xs text-gray-400 mb-1">직원 서명</p>
              <img src={contract.employee_signature_data} alt="직원 서명" className="border rounded h-14 w-full object-contain bg-gray-50" />
            </div>
          )}
          {!showEmployerSign ? (
            <button
              onClick={() => setShowEmployerSign(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <PenLine className="h-3.5 w-3.5" />
              사업주 서명하기
            </button>
          ) : (
            <div className="border rounded-lg p-3 space-y-3">
              <p className="text-sm font-medium text-gray-700">사업주(관리자) 서명</p>
              <SignaturePad onSign={data => setPendingSignData(data)} />
              <div className="flex gap-2">
                <button
                  onClick={handleEmployerSign}
                  disabled={isPending || !pendingSignData}
                  className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isPending ? '저장 중...' : '서명 완료'}
                </button>
                <button onClick={() => { setShowEmployerSign(false); setPendingSignData(null) }} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">
                  취소
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
