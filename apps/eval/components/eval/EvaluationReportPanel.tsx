"use client"

import { useState, useTransition } from "react"
import { generateEvaluationReport } from "@/actions/ai-actions"
import { FileText, Sparkles, Copy, Check, Loader2, Printer } from "lucide-react"

interface Props {
  clientId: string
  clientName: string
}

export function EvaluationReportPanel({ clientId, clientName }: Props) {
  const [report, setReport] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const result = await generateEvaluationReport(clientId)
      if (result.success && result.report) {
        setReport(result.report)
      } else {
        setError(result.error ?? "보고서 생성에 실패했습니다")
      }
    })
  }

  function handleCopy() {
    if (!report) return
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handlePrint() {
    if (!report) return
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`<!DOCTYPE html><html lang="ko"><head>
      <meta charset="UTF-8">
      <title>종합 평가 보고서 — ${clientName}</title>
      <style>
        body { font-family: 'Noto Sans KR', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; font-size: 14px; line-height: 1.7; }
        h2 { border-bottom: 2px solid #333; padding-bottom: 8px; }
        h3 { margin-top: 24px; color: #1e3a5f; }
        strong { color: #333; }
      </style>
    </head><body>
      <div id="content">${report
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>")
        .replace(/##\s(.+)/g, "<h2>$1</h2>")
        .replace(/###\s(.+)/g, "<h3>$1</h3>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      }</div>
    </body></html>`)
    win.document.close()
    win.print()
  }

  return (
    <div className="border rounded-xl bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <FileText className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">AI 종합 평가 보고서</h3>
            <p className="text-xs text-gray-500">K-IPPA + 영역 평가 + 서비스 이력 기반 자동 초안</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {report && (
            <>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "복사됨" : "복사"}
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                인쇄
              </button>
            </>
          )}
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {isPending ? "생성 중..." : report ? "재생성" : "초안 생성"}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>
      )}

      {report ? (
        <textarea
          value={report}
          onChange={(e) => setReport(e.target.value)}
          rows={20}
          className="w-full rounded-lg border border-gray-200 p-3 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y bg-gray-50"
        />
      ) : (
        !isPending && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Sparkles className="h-8 w-8 text-indigo-200 mb-3" />
            <p className="text-sm text-gray-500">
              "초안 생성" 버튼을 클릭하면 대상자의 K-IPPA, 영역 평가, 서비스 이력을 분석해
              종합 평가 보고서 초안을 자동으로 작성합니다.
            </p>
          </div>
        )
      )}

      {isPending && (
        <div className="flex items-center justify-center py-10 gap-3 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
          Gemini가 보고서를 작성 중입니다...
        </div>
      )}
    </div>
  )
}
