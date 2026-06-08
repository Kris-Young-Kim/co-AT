'use client'

import { useState } from 'react'
import { SttRecorder } from './SttRecorder'
import { Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { saveTranscript, type TranscriptInput } from '@/actions/transcript-actions'
import { summarizeTranscript, generateCallLogDraftFromTranscript, type CallLogDraftFromTranscript, type TranscriptKeyPoints } from '@/actions/ai-actions'

interface TranscriptPanelProps {
  clientId?: string | null
  clientName?: string | null
  disabilityType?: string | null
  sessionDate: string
  staffId: string
  onCallLogDraft?: (draft: CallLogDraftFromTranscript) => void
  onTranscriptSaved?: (transcriptId: string) => void
}

type Step = 'consent' | 'recording' | 'review' | 'done'

export function TranscriptPanel({
  clientId,
  clientName,
  disabilityType,
  sessionDate,
  staffId,
  onCallLogDraft,
  onTranscriptSaved,
}: TranscriptPanelProps) {
  const [step, setStep] = useState<Step>('consent')
  const [consentGiven, setConsentGiven] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [durationSec, setDurationSec] = useState(0)
  const [keyPoints, setKeyPoints] = useState<TranscriptKeyPoints | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConsent = (given: boolean) => {
    setConsentGiven(given)
    setStep('recording')
  }

  const handleRecordingStop = (sec: number) => {
    setDurationSec(sec)
    if (transcript.trim()) setStep('review')
  }

  const handleSummarize = async () => {
    if (!transcript.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await summarizeTranscript(transcript)
      if (result.success && result.keyPoints) {
        setKeyPoints(result.keyPoints)
      } else {
        setError(result.error ?? 'AI 요약 실패')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAndDraft = async () => {
    if (!transcript.trim()) return
    setLoading(true)
    setError(null)
    try {
      const input: TranscriptInput = {
        client_id: clientId ?? null,
        staff_id: staffId,
        session_type: 'call',
        session_date: sessionDate,
        duration_sec: durationSec || null,
        transcript,
        ai_summary: keyPoints
          ? `주요 호소: ${keyPoints.chief_complaint ?? ''} / 요청 기기: ${keyPoints.requested_device ?? ''}`
          : null,
        key_points: keyPoints,
        consent_given: consentGiven,
      }

      const saveResult = await saveTranscript(input)
      if (!saveResult.success) throw new Error(saveResult.error)
      onTranscriptSaved?.(saveResult.id!)

      const draftResult = await generateCallLogDraftFromTranscript({
        transcript,
        sessionDate,
        clientName,
        disabilityType,
      })
      if (draftResult.success && draftResult.draft) {
        onCallLogDraft?.(draftResult.draft)
      }

      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'consent') {
    return (
      <div className="border rounded-lg p-4 bg-blue-50 space-y-3">
        <p className="text-sm text-blue-800 font-medium">녹취 동의 안내</p>
        <p className="text-xs text-blue-700">
          이 상담은 서비스 개선을 위해 AI가 내용을 요약할 수 있습니다.
          대화 내용은 개인정보 마스킹 후 저장됩니다.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleConsent(true)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            동의합니다
          </button>
          <button
            type="button"
            onClick={() => handleConsent(false)}
            className="px-3 py-1.5 border text-sm rounded-md hover:bg-gray-50"
          >
            동의하지 않음 (수동 입력)
          </button>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="border rounded-lg p-4 bg-green-50 flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <div>
          <p className="text-sm text-green-800 font-medium">녹취 저장 완료</p>
          <p className="text-xs text-green-700">콜로그 초안이 자동 입력되었습니다. 검토 후 저장하세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">
          {consentGiven ? 'STT 녹취 상담' : '수동 입력 모드'}
        </p>
        {consentGiven && (
          <SttRecorder
            onTranscriptChange={setTranscript}
            onRecordingStop={handleRecordingStop}
          />
        )}
      </div>

      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="상담 대화 내용이 여기에 표시됩니다. 직접 수정도 가능합니다."
        className="w-full min-h-[120px] text-sm border rounded-md px-3 py-2 resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {keyPoints && (
        <div className="bg-gray-50 rounded-md p-3 text-sm space-y-1">
          <p className="font-medium text-gray-700">AI 요약</p>
          {keyPoints.chief_complaint && <p className="text-gray-600">주요 호소: {keyPoints.chief_complaint}</p>}
          {keyPoints.requested_device && <p className="text-gray-600">요청 기기: {keyPoints.requested_device}</p>}
          {keyPoints.agreed_action && <p className="text-gray-600">합의 사항: {keyPoints.agreed_action}</p>}
          {keyPoints.next_step && <p className="text-gray-600">다음 단계: {keyPoints.next_step}</p>}
        </div>
      )}

      <div className="flex gap-2">
        {!keyPoints && (
          <button
            type="button"
            onClick={handleSummarize}
            disabled={!transcript.trim() || loading}
            className="flex items-center gap-1 px-3 py-1.5 border text-sm rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            AI 요약
          </button>
        )}
        <button
          type="button"
          onClick={handleSaveAndDraft}
          disabled={!transcript.trim() || loading}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-900 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          저장 + 콜로그 초안 생성
        </button>
      </div>
    </div>
  )
}
