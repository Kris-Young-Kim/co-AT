'use client'

import { useState, useTransition } from 'react'
import { FileSignature, Send, XCircle, ExternalLink, CheckCircle2, Clock } from 'lucide-react'
import {
  createRentalContract,
  sendContractLink,
  cancelContract,
  type RentalContract,
} from '@/actions/rental-contract-actions'

interface RentalContractPanelProps {
  rentalId: string
  initialContract: RentalContract | null
}

const WEB_BASE_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://gwatc.cloud'

export function RentalContractPanel({ rentalId, initialContract }: RentalContractPanelProps) {
  const [contract, setContract] = useState<RentalContract | null>(initialContract)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [sentVia, setSentVia] = useState<'email' | 'sms' | 'manual'>('email')
  const [showSendForm, setShowSendForm] = useState(false)
  const [copied, setCopied] = useState(false)

  const signUrl = contract
    ? `${WEB_BASE_URL}/sign/${contract.signing_token}`
    : ''

  const handleCreate = () => {
    setError('')
    startTransition(async () => {
      const result = await createRentalContract(rentalId)
      if (result.success && result.contract) {
        setContract(result.contract)
      } else {
        setError(result.error ?? '계약서 생성 실패')
      }
    })
  }

  const handleSend = () => {
    if (!contract) return
    if (!sentTo.trim() && sentVia !== 'manual') {
      setError('전송 대상을 입력해주세요')
      return
    }
    setError('')
    startTransition(async () => {
      const result = await sendContractLink(contract.id, sentTo.trim(), sentVia)
      if (result.success) {
        setContract((prev) => prev ? { ...prev, sent_to: sentTo.trim(), sent_via: sentVia, sent_at: new Date().toISOString() } : prev)
        setShowSendForm(false)
      } else {
        setError(result.error ?? '전송 실패')
      }
    })
  }

  const handleCancel = () => {
    if (!contract || !confirm('계약서를 취소하시겠습니까?')) return
    setError('')
    startTransition(async () => {
      const result = await cancelContract(contract.id)
      if (result.success) {
        setContract((prev) => prev ? { ...prev, status: 'cancelled' } : prev)
      } else {
        setError(result.error ?? '취소 실패')
      }
    })
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(signUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border rounded-lg bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileSignature className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900">대여 계약서 · 전자서명</h3>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
      )}

      {!contract && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 mb-4">아직 계약서가 생성되지 않았습니다.</p>
          <button
            onClick={handleCreate}
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? '생성 중...' : '계약서 생성'}
          </button>
        </div>
      )}

      {contract && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {contract.status === 'signed' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : contract.status === 'cancelled' ? (
              <XCircle className="h-4 w-4 text-gray-400" />
            ) : (
              <Clock className="h-4 w-4 text-orange-500" />
            )}
            <span className={`text-sm font-medium ${
              contract.status === 'signed' ? 'text-green-700'
              : contract.status === 'cancelled' ? 'text-gray-500'
              : 'text-orange-600'
            }`}>
              {contract.status === 'signed' ? `서명 완료 (${contract.signer_name})`
              : contract.status === 'cancelled' ? '취소됨'
              : '서명 대기 중'}
            </span>
          </div>

          {contract.status === 'pending' && (
            <>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">서명 링크</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-gray-700 break-all flex-1">{signUrl}</code>
                  <button onClick={copyLink} className="shrink-0 text-xs text-blue-600 hover:underline">
                    {copied ? '복사됨!' : '복사'}
                  </button>
                  <a href={signUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <ExternalLink className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                  </a>
                </div>
              </div>

              {contract.sent_at && (
                <p className="text-xs text-gray-500">
                  발송: {contract.sent_via?.toUpperCase()} → {contract.sent_to}
                  {' '}({new Date(contract.sent_at).toLocaleDateString('ko-KR')})
                </p>
              )}

              {!showSendForm ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSendForm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    링크 발송
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    취소
                  </button>
                </div>
              ) : (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex gap-3">
                    {(['email', 'sms', 'manual'] as const).map((via) => (
                      <label key={via} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="sentVia"
                          value={via}
                          checked={sentVia === via}
                          onChange={() => setSentVia(via)}
                          className="accent-blue-600"
                        />
                        <span className="text-sm text-gray-700">
                          {via === 'email' ? '이메일' : via === 'sms' ? 'SMS' : '수동'}
                        </span>
                      </label>
                    ))}
                  </div>
                  {sentVia !== 'manual' && (
                    <input
                      type={sentVia === 'email' ? 'email' : 'tel'}
                      value={sentTo}
                      onChange={(e) => setSentTo(e.target.value)}
                      placeholder={sentVia === 'email' ? '이메일 주소' : '전화번호'}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSend}
                      disabled={isPending}
                      className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isPending ? '발송 중...' : '발송'}
                    </button>
                    <button
                      onClick={() => setShowSendForm(false)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {contract.status === 'signed' && (
            <dl className="text-sm space-y-1">
              <div className="flex gap-3">
                <dt className="w-20 text-gray-500">서명일</dt>
                <dd>{contract.signed_at ? new Date(contract.signed_at).toLocaleDateString('ko-KR') : '—'}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-20 text-gray-500">서명인</dt>
                <dd>{contract.signer_name} ({contract.signer_type === 'guardian' ? '보호자' : '본인'})</dd>
              </div>
            </dl>
          )}

          {contract.status === 'cancelled' && (
            <button
              onClick={handleCreate}
              disabled={isPending}
              className="px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              새 계약서 생성
            </button>
          )}
        </div>
      )}
    </div>
  )
}
