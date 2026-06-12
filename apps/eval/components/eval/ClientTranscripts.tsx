"use client"

import { useState } from "react"
import { Mic, ChevronDown, ChevronUp, MessageSquare } from "lucide-react"
import type { SessionTranscript } from "@/actions/transcript-actions"

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

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Mic className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <div>
            <span className="text-sm font-medium text-gray-800">
              {t.session_date} · {SESSION_TYPE_LABEL[t.session_type] ?? t.session_type}
            </span>
            {t.duration_sec && (
              <span className="ml-2 text-xs text-gray-400">
                {Math.floor(t.duration_sec / 60)}분 {t.duration_sec % 60}초
              </span>
            )}
          </div>
          {t.ai_summary && (
            <span className="hidden sm:block text-xs text-gray-400 truncate max-w-xs">
              {t.ai_summary}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {t.ai_summary && (
            <div className="bg-indigo-50 rounded-lg p-3 text-xs text-indigo-800">
              <p className="font-medium mb-1">AI 요약</p>
              <p>{t.ai_summary}</p>
            </div>
          )}
          {t.key_points && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
              {(t.key_points as Record<string, string>).chief_complaint && (
                <p><span className="font-medium text-gray-600">주요 호소:</span> {(t.key_points as Record<string, string>).chief_complaint}</p>
              )}
              {(t.key_points as Record<string, string>).requested_device && (
                <p><span className="font-medium text-gray-600">요청 기기:</span> {(t.key_points as Record<string, string>).requested_device}</p>
              )}
              {(t.key_points as Record<string, string>).agreed_action && (
                <p><span className="font-medium text-gray-600">합의 사항:</span> {(t.key_points as Record<string, string>).agreed_action}</p>
              )}
              {(t.key_points as Record<string, string>).next_step && (
                <p><span className="font-medium text-gray-600">다음 단계:</span> {(t.key_points as Record<string, string>).next_step}</p>
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
