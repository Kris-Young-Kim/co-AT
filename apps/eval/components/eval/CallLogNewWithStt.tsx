'use client'

import { useState } from 'react'
import { TranscriptPanel } from './TranscriptPanel'
import { CallLogForm } from './CallLogForm'
import { createCallLog } from '@/actions/call-log-actions'
import type { CallLog } from '@/actions/call-log-actions'
import type { CallLogDraftFromTranscript } from '@/actions/ai-actions'

interface CallLogNewWithSttProps {
  defaultDate: string
}

export function CallLogNewWithStt({ defaultDate }: CallLogNewWithSttProps) {
  const [draftValues, setDraftValues] = useState<Partial<CallLog>>({})
  const [showTranscript, setShowTranscript] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [transcriptId, setTranscriptId] = useState<string | null>(null)

  const handleCallLogDraft = (draft: CallLogDraftFromTranscript) => {
    setDraftValues({
      question_content: draft.question_content,
      answer: draft.answer,
      requester_type: draft.requester_type,
      q_public_benefit: draft.q_public_benefit,
      q_private_benefit: draft.q_private_benefit,
      q_device: draft.q_device,
      q_case_management: draft.q_case_management,
      q_other: draft.q_other,
    })
    setHasDraft(true)
    setShowTranscript(false)
  }

  const handleSubmit = (input: Parameters<typeof createCallLog>[0]) =>
    createCallLog(input, transcriptId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowTranscript((v) => !v)}
          className="px-3 py-1.5 border text-sm rounded-md hover:bg-gray-50"
        >
          {showTranscript ? '녹취 패널 닫기' : '🎙 STT 녹취 상담'}
        </button>
        {hasDraft && (
          <span className="text-xs text-green-600">
            AI 초안 적용됨 — 아래 폼을 확인 후 저장하세요
          </span>
        )}
      </div>

      {showTranscript && (
        <TranscriptPanel
          sessionDate={defaultDate}
          onCallLogDraft={handleCallLogDraft}
          onTranscriptSaved={setTranscriptId}
        />
      )}

      <CallLogForm
        key={hasDraft ? 'with-draft' : 'empty'}
        defaultValues={draftValues}
        onSubmit={handleSubmit}
        submitLabel="등록"
      />
    </div>
  )
}
