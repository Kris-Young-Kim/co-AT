export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getSigningPageData } from '../../../../actions/sign-actions'
import { SignaturePageClient } from './SignaturePageClient'
import { CheckCircle2 } from 'lucide-react'

interface SignPageProps {
  params: Promise<{ token: string }>
}

export default async function SignPage({ params }: SignPageProps) {
  const { token } = await params
  const result = await getSigningPageData(token)

  if (!result.success || !result.contract || !result.rental) notFound()

  const { contract, rental } = result

  if (contract.status === 'signed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border max-w-sm w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">이미 서명 완료된 계약서입니다</h2>
          <p className="text-sm text-gray-500">
            서명인: {contract.signer_name}<br />
            서명일: {contract.signed_at ? new Date(contract.signed_at).toLocaleDateString('ko-KR') : '—'}
          </p>
        </div>
      </div>
    )
  }

  if (contract.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border max-w-sm w-full p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">취소된 계약서입니다</h2>
          <p className="text-sm text-gray-500">이 계약서 링크는 더 이상 유효하지 않습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <SignaturePageClient
      signingToken={token}
      clientName={rental.client_name}
      deviceName={rental.device_name}
      deviceModel={rental.device_model}
      rentalStartDate={rental.rental_start_date}
      rentalEndDate={rental.rental_end_date}
    />
  )
}
