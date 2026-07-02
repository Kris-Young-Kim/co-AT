'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { signAsEmployee } from '@/actions/contract-actions'
import { SignaturePad } from './SignaturePad'

interface Props {
  token: string
}

export function EmployeeSignForm({ token }: Props) {
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!signatureData) { setError('서명을 입력해주세요'); return }
    if (!agreed) { setError('계약 내용 동의에 체크해주세요'); return }
    setError('')
    setIsPending(true)
    const result = await signAsEmployee(token, signatureData)
    setIsPending(false)
    if (result.success) {
      setDone(true)
    } else {
      setError(result.error ?? '서명 저장에 실패했습니다')
    }
  }

  if (done) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
        <p className="text-base font-semibold text-gray-900">서명이 접수되었습니다</p>
        <p className="text-sm text-gray-500 mt-1">담당자 확인 후 최종 완료 처리됩니다.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SignaturePad onSign={data => setSignatureData(data)} />

      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="mt-0.5 accent-violet-600"
        />
        <span className="text-sm text-gray-700">
          위 계약 내용을 모두 확인하였으며, 이에 동의하고 서명합니다.
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !signatureData || !agreed}
        className="w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? '제출 중...' : '서명 제출'}
      </button>
    </form>
  )
}
