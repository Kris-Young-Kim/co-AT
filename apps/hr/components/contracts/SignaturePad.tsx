'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Eraser } from 'lucide-react'

interface Props {
  onSign: (dataUrl: string) => void
  disabled?: boolean
}

export function SignaturePad({ onSign, disabled = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [hasStroke, setHasStroke] = useState(false)

  function getCtx() {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    return ctx
  }

  function getPos(e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const t = e.touches[0]
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  const startDraw = useCallback((e: MouseEvent | TouchEvent) => {
    if (disabled) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = getCtx()
    if (!canvas || !ctx) return
    drawing.current = true
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }, [disabled])

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!drawing.current || disabled) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = getCtx()
    if (!canvas || !ctx) return
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasStroke(true)
  }, [disabled])

  const endDraw = useCallback(() => {
    if (!drawing.current) return
    drawing.current = false
    const canvas = canvasRef.current
    if (canvas && hasStroke) {
      onSign(canvas.toDataURL('image/png'))
    }
  }, [hasStroke, onSign])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('mousedown', startDraw)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', endDraw)
    canvas.addEventListener('mouseleave', endDraw)
    canvas.addEventListener('touchstart', startDraw, { passive: false })
    canvas.addEventListener('touchmove', draw, { passive: false })
    canvas.addEventListener('touchend', endDraw)

    return () => {
      canvas.removeEventListener('mousedown', startDraw)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', endDraw)
      canvas.removeEventListener('mouseleave', endDraw)
      canvas.removeEventListener('touchstart', startDraw)
      canvas.removeEventListener('touchmove', draw)
      canvas.removeEventListener('touchend', endDraw)
    }
  }, [startDraw, draw, endDraw])

  function clear() {
    const canvas = canvasRef.current
    const ctx = getCtx()
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasStroke(false)
  }

  return (
    <div className="space-y-2">
      <div className={`border-2 rounded-lg overflow-hidden ${disabled ? 'opacity-50' : 'border-gray-300 cursor-crosshair'}`}>
        <canvas
          ref={canvasRef}
          width={560}
          height={160}
          className="w-full touch-none"
          style={{ background: '#fafafa' }}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">서명란에 마우스 또는 손가락으로 서명해 주세요</p>
        {!disabled && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
          >
            <Eraser className="h-3.5 w-3.5" />
            지우기
          </button>
        )}
      </div>
    </div>
  )
}
