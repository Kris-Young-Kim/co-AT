'use client'

import { useRef, useState, useEffect, useTransition } from 'react'
import { Mic, Square, Loader2, CheckCircle2, RefreshCw } from 'lucide-react'
import { applyInterviewExtract } from '@/actions/grant-assessment-actions'
import type { ExtractedGrantFields } from '@/actions/grant-assessment-actions'

interface Props {
  assessmentId: string
  existingItems: Array<{ item_order: number; item_category: string }>
}

type Status = 'idle' | 'recording' | 'uploading' | 'preview' | 'applying' | 'done'

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '...' : text
}

export function InterviewVoiceFill({ assessmentId, existingItems }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [fields, setFields] = useState<ExtractedGrantFields>({ items: [] })
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (status !== 'recording') return
    setElapsed(0)
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [status])

  async function startRecording() {
    setError(null)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream)
    chunksRef.current = []
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    mr.onstop = handleRecordingStop
    mediaRecorderRef.current = mr
    mr.start()
    setStatus('recording')
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop())
  }

  async function handleRecordingStop() {
    setStatus('uploading')
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })

    const fd = new FormData()
    fd.append('audio', blob, 'interview.webm')
    fd.append('assessmentId', assessmentId)
    fd.append('existingItems', JSON.stringify(existingItems))

    const res = await fetch('/api/interview-extract', { method: 'POST', body: fd })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? '추출에 실패했습니다')
      setStatus('idle')
      return
    }
    const data = await res.json()
    setTranscript(data.transcript ?? '')
    setFields(data.fields)
    setStatus('preview')
  }

  function handleApply() {
    setError(null)
    setStatus('applying')
    startTransition(async () => {
      const result = await applyInterviewExtract(assessmentId, fields)
      if (result.success) {
        setStatus('done')
      } else {
        setError(result.error ?? '적용에 실패했습니다')
        setStatus('preview')
      }
    })
  }

  function resetToIdle() {
    setStatus('idle')
    setError(null)
    setTranscript('')
    setFields({ items: [] })
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-900">현장 인터뷰 녹음</h2>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">녹음 후 AI가 양식을 자동으로 채워드립니다</p>
      </div>

      {status === 'idle' && (
        <button
          onClick={startRecording}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          <Mic className="h-4 w-4" />
          인터뷰 녹음
        </button>
      )}

      {status === 'recording' && (
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            녹음 중 {formatElapsed(elapsed)}
          </span>
          <button
            onClick={stopRecording}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            녹음 중지
          </button>
        </div>
      )}

      {status === 'uploading' && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          AI가 음성을 분석 중입니다...
        </div>
      )}

      {status === 'preview' && (
        <div className="space-y-3">
          {transcript && (
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700 select-none">
                전사 내용 보기
              </summary>
              <p className="mt-2 p-3 bg-gray-50 rounded-md text-gray-700 text-xs leading-relaxed whitespace-pre-wrap">
                {transcript}
              </p>
            </details>
          )}

          <div className="border rounded-md p-3 bg-blue-50 space-y-1.5">
            <p className="text-xs font-semibold text-blue-800 mb-2">추출된 정보</p>
            {fields.referral_org && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">의뢰기관:</span> {fields.referral_org}
              </p>
            )}
            {fields.general_opinion && (
              <p className="text-xs text-gray-700">
                <span className="font-medium">종합의견:</span> {truncate(fields.general_opinion, 100)}
              </p>
            )}
            {fields.items.map((item) => (
              <p key={item.item_order} className="text-xs text-gray-700">
                <span className="font-medium">
                  품목 {item.item_order} ({item.item_category ?? '—'}):
                </span>{' '}
                {item.use_plan ? truncate(item.use_plan, 60) : '—'}
              </p>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              양식에 적용
            </button>
            <button
              onClick={resetToIdle}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              다시 녹음
            </button>
          </div>
        </div>
      )}

      {status === 'applying' && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          양식에 적용 중입니다...
        </div>
      )}

      {status === 'done' && (
        <div className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          양식이 성공적으로 업데이트되었습니다.
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
