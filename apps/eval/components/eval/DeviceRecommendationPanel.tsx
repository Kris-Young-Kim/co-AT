"use client"

import { useState, useTransition } from "react"
import { generateDeviceRecommendations } from "@/actions/ai-actions"
import { Cpu, Sparkles, Copy, Check, Loader2 } from "lucide-react"

interface Props {
  clientId: string
  disabilityType: string | null
}

export function DeviceRecommendationPanel({ clientId, disabilityType }: Props) {
  const [recommendations, setRecommendations] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const result = await generateDeviceRecommendations(clientId)
      if (result.success && result.recommendations) {
        setRecommendations(result.recommendations)
      } else {
        setError(result.error ?? "추천 생성에 실패했습니다")
      }
    })
  }

  function handleCopy() {
    if (!recommendations) return
    navigator.clipboard.writeText(recommendations).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function formatMarkdown(text: string) {
    return text
      .replace(/###\s(.+)/g, '<h4 class="text-sm font-semibold text-gray-800 mt-4 mb-1">$1</h4>')
      .replace(/##\s(.+)/g, '<h3 class="text-sm font-bold text-gray-900 mt-3 mb-2 border-b pb-1">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-medium text-gray-800">$1</strong>')
      .replace(/\n/g, '<br>')
  }

  return (
    <div className="border rounded-xl bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
            <Cpu className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">AI 보조기기 추천</h3>
            <p className="text-xs text-gray-500">
              {disabilityType ? `${disabilityType} · ` : ""}K-IPPA + 기관 실적 기반 추천
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {recommendations && (
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "복사됨" : "복사"}
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {isPending ? "분석 중..." : recommendations ? "재추천" : "추천 생성"}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>
      )}

      {recommendations ? (
        <div
          className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4 border"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(recommendations) }}
        />
      ) : (
        !isPending && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Cpu className="h-8 w-8 text-emerald-100 mb-3" />
            <p className="text-sm text-gray-500">
              "추천 생성" 버튼을 클릭하면 대상자의 장애유형·K-IPPA 활동 문제·기관 지원 실적을
              분석해 최적 보조기기를 추천합니다.
            </p>
          </div>
        )
      )}

      {isPending && (
        <div className="flex items-center justify-center py-8 gap-3 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
          Gemini가 보조기기를 추천하고 있습니다...
        </div>
      )}
    </div>
  )
}
