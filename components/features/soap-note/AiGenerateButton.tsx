"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { generateSoapNote, type SoapNote } from "@/actions/ai-actions"

interface AiGenerateButtonProps {
  text: string
  onGenerated: (soapNote: SoapNote) => void
  onError?: (error: string) => void
  disabled?: boolean
}

/**
 * AI SOAP 노트 생성 버튼
 */
export function AiGenerateButton({
  text,
  onGenerated,
  onError,
  disabled,
}: AiGenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!text || text.trim().length === 0) {
      if (onError) {
        onError("생성할 텍스트가 비어있습니다")
      }
      return
    }

    setIsGenerating(true)
    console.log("[AiGenerateButton] SOAP 노트 생성 시작")

    try {
      const result = await generateSoapNote(text)

      if (result.success && result.soapNote) {
        console.log("[AiGenerateButton] SOAP 노트 생성 성공")
        onGenerated(result.soapNote)
      } else {
        console.error("[AiGenerateButton] SOAP 노트 생성 실패:", result.error)
        if (onError) {
          onError(result.error || "SOAP 노트 생성에 실패했습니다")
        }
      }
    } catch (error) {
      console.error("[AiGenerateButton] 예상치 못한 오류:", error)
      if (onError) {
        onError(
          error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다"
        )
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleGenerate}
      disabled={disabled || isGenerating || !text || text.trim().length === 0}
      variant="outline"
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          생성 중...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          AI로 SOAP 노트 생성
        </>
      )}
    </Button>
  )
}
