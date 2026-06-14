'use client'

import { useRef, useState, useCallback, useTransition } from 'react'
import { submitSignature } from '../../../../actions/sign-actions'

interface SignaturePageClientProps {
  signingToken: string
  clientName: string
  deviceName: string
  deviceModel: string | null
  rentalStartDate: string
  rentalEndDate: string
}

export function SignaturePageClient({
  signingToken,
  clientName,
  deviceName,
  deviceModel,
  rentalStartDate,
  rentalEndDate,
}: SignaturePageClientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [signerType, setSignerType] = useState<'client' | 'guardian'>('client')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    const ctx = canvas.getContext('2d')!
    const { x, y } = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }, [])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    const ctx = canvas.getContext('2d')!
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1a1a1a'
    const { x, y } = getPos(e, canvas)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }, [isDrawing])

  const stopDraw = useCallback(() => setIsDrawing(false), [])

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const handleSubmit = () => {
    if (!signerName.trim()) { setError('서명인 이름을 입력해주세요'); return }
    if (!hasSignature) { setError('서명을 해주세요'); return }
    const canvas = canvasRef.current
    if (!canvas) return
    const signatureData = canvas.toDataURL('image/png')

    setError('')
    startTransition(async () => {
      const result = await submitSignature({ signingToken, signerName: signerName.trim(), signerType, signatureData })
      if (result.success) {
        setDone(true)
      } else {
        setError(result.error ?? '오류가 발생했습니다')
      }
    })
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border max-w-sm w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">서명 완료</h2>
          <p className="text-sm text-gray-500">
            대여 계약서에 서명이 완료되었습니다.<br />
            계약서 사본은 이메일 또는 SMS로 발송됩니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-4">
          <h1 className="text-lg font-bold text-gray-900 mb-1">보조기기 대여 계약서</h1>
          <p className="text-xs text-gray-400 mb-5">(사)가치함께자립생활센터</p>

          <dl className="space-y-2 text-sm mb-6">
            <div className="flex gap-3">
              <dt className="w-20 shrink-0 text-gray-500">이용자</dt>
              <dd className="text-gray-900 font-medium">{clientName}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-20 shrink-0 text-gray-500">기기명</dt>
              <dd className="text-gray-900">{deviceName}{deviceModel ? ` (${deviceModel})` : ''}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-20 shrink-0 text-gray-500">대여 기간</dt>
              <dd className="text-gray-900">{rentalStartDate} ~ {rentalEndDate}</dd>
            </div>
          </dl>

          <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 leading-relaxed space-y-2 mb-6">
            <p>1. 이용자는 대여 기기를 선량한 관리자의 주의로써 보관·사용하여야 합니다.</p>
            <p>2. 기간 만료 시 즉시 반납하여야 하며, 연장이 필요한 경우 사전에 신청하여야 합니다.</p>
            <p>3. 고의 또는 과실로 인한 파손·분실 시 변상 책임을 집니다.</p>
            <p>4. 기기를 무단으로 제3자에게 양도·전대할 수 없습니다.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">서명인 정보</h2>

          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-1 block">서명인 구분</label>
            <div className="flex gap-3">
              {(['client', 'guardian'] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="signerType"
                    value={type}
                    checked={signerType === type}
                    onChange={() => setSignerType(type)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">{type === 'client' ? '본인' : '보호자'}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">성명</label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="서명인 이름 입력"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">서명</h2>
            <button
              onClick={clearCanvas}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              지우기
            </button>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden touch-none">
            <canvas
              ref={canvasRef}
              width={560}
              height={200}
              className="w-full bg-white cursor-crosshair"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">위 공간에 서명해 주세요</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? '처리 중...' : '서명 제출'}
        </button>
      </div>
    </div>
  )
}
