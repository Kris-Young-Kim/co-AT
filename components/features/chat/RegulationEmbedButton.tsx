"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Database, CheckCircle2, AlertCircle } from "lucide-react"
import { embedRegulations } from "@/actions/rag-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function RegulationEmbedButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    chunksCount?: number
  } | null>(null)

  const handleEmbed = async () => {
    if (isLoading) return

    setIsLoading(true)
    setResult(null)

    try {
      console.log("[RegulationEmbedButton] 벡터화 시작")
      const result = await embedRegulations()
      setResult(result)
      console.log("[RegulationEmbedButton] 벡터화 완료:", result)
    } catch (error) {
      console.error("[RegulationEmbedButton] 오류:", error)
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleEmbed}
        disabled={isLoading}
        className="w-full"
        variant="outline"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            벡터화 중...
          </>
        ) : (
          <>
            <Database className="mr-2 h-4 w-4" />
            문서 벡터화 실행
          </>
        )}
      </Button>

      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          {result.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {result.success ? (
              <div>
                <p className="font-medium">{result.message}</p>
                {result.chunksCount && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.chunksCount}개의 청크가 저장되었습니다
                  </p>
                )}
              </div>
            ) : (
              <p>{result.message}</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground">
        주의: 벡터화는 시간이 걸릴 수 있습니다. 
        문서가 업데이트된 경우에만 다시 실행하세요.
      </p>
    </div>
  )
}
