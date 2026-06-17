"use client"

import { useState } from "react"
import { Mic, ChevronDown, ChevronUp, MessageSquare, Sparkles, Loader2, Link2 } from "lucide-react"
import type { SessionTranscript } from "@/actions/transcript-actions"
import { generateAndSaveTranscriptSummary } from "@/actions/transcript-actions"

const SESSION_TYPE_LABEL: Record<string, string> = {
  call: "유선 상담",
  video: "화상 상담",
  visit: "방문 상담",
  meeting: "회의",
}

interface Props {
  transcripts: SessionTranscript[]
}

function TranscriptRow({ t }: { t: SessionTranscript }) {
  const [open, setOpen] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [localSummary, setLocalSummary] = useState<string | null>(t.ai_summary ?? null)
  const [localKeyPoints, setLocalKeyPoints] = useState<Record<string, string> | null>(
    t.key_points as Record<string, string> | null
  )
  const [summaryError, setSummaryError] = useState<string | null>(null)

  const handleGenSummary = async () => {
    if (!t.transcript) return
    setSummarizing(true)
    setSummaryError(null)
    try {
      const result = await generateAndSaveTranscriptSummary(t.id, t.transcript)
      if (result.success) {
        setLocalSummary(result.summary ?? null)
        setLocalKeyPoints((result.keyPoints as Record<string, string>) ?? null)
      } else {
        setSummaryError(result.error ?? 'AI 요약 실패')
      }
    } finally {
      setSummarizing(false)
    }
  }

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Mic className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-sm font-medium text-gray-800">
              {t.session_date} · {SESSION_TYPE_LABEL[t.session_type] ?? t.session_type}
            </span>
            {t.duration_sec && (
              <span className="ml-2 text-xs text-gray-400">
                {Math.floor(t.duration_sec / 60)}분 {t.duration_sec % 60}초
              </span>
            )}
          </div>
          {localSummary && (
            <span className="hidden sm:block text-xs text-gray-400 truncate max-w-xs">
              {localSummary}
            </span>
          )}
          {(t.linked_call_log_id || t.linked_service_record_id) && (
            <Link2 className="h-3.5 w-3.5 text-blue-400 shrink-0" aria-label="콜로그/서비스기록 연결됨" />
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {localSummary ? (
            <div className="bg-indigo-50 rounded-lg p-3 text-xs text-indigo-800">
              <p className="font-medium mb-1">AI 요약</p>
              <p>{localSummary}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenSummary}
                disabled={summarizing || !t.transcript}
                className="flex items-center gap-1.5 px-3 py-1.5 border text-xs rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {summarizing
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                }
                {summarizing ? 'AI 요약 생성 중…' : 'AI 요약 생성'}
              </button>
              {summaryError && (
                <span className="text-xs text-red-500">{summaryError}</span>
              )}
            </div>
          )}

          {localKeyPoints && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
              {localKeyPoints.chief_complaint && (
                <p><span className="font-medium text-gray-600">주요 호소:</span> {localKeyPoints.chief_complaint}</p>
              )}
              {localKeyPoints.requested_device && (
                <p><span className="font-medium text-gray-600">요청 기기:</span> {localKeyPoints.requested_device}</p>
              )}
              {localKeyPoints.agreed_action && (
                <p><span className="font-medium text-gray-600">합의 사항:</span> {localKeyPoints.agreed_action}</p>
              )}
              {localKeyPoints.next_step && (
                <p><span className="font-medium text-gray-600">다음 단계:</span> {localKeyPoints.next_step}</p>
              )}
            </div>
          )}

          {(t.linked_call_log_id || t.linked_service_record_id) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">연결됨:</span>
              {t.linked_call_log_id && (
                <a
                  href="/call-logs"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  <Link2 className="h-3 w-3" />
                  콜로그
                </a>
              )}
              {t.linked_service_record_id && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <Link2 className="h-3 w-3" />
                  서비스 기록
                </span>
              )}
            </div>
          )}

          <div className="rounded-lg border p-3 bg-white">
            <p className="text-xs font-medium text-gray-600 mb-1.5">대화록</p>
            <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{t.transcript}</p>
          </div>
          {!t.consent_given && (
            <p className="text-xs text-gray-400">* 녹취 미동의 — 대화록은 마스킹 처리되었습니다</p>
          )}
        </div>
      )}
    </div>
  )
}

export function ClientTranscripts({ transcripts }: Props) {
  if (transcripts.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-4 px-1">
        <MessageSquare className="h-4 w-4" />
        저장된 대화록이 없습니다
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {transcripts.map(t => (
        <TranscriptRow key={t.id} t={t} />
      ))}
    </div>
  )
}
