"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Database, CheckCircle2, AlertCircle, Upload, FileText } from "lucide-react"
import { embedRegulations } from "@/actions/rag-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"

const ACCEPT = "application/pdf,text/markdown,text/plain,.pdf,.md,.txt"

export function RegulationEmbedButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [files, setFiles] = useState<Array<{ name: string; path: string }>>([])
  const [result, setResult] = useState<{
    success: boolean
    message: string
    chunksCount?: number
  } | null>(null)

  const loadFileList = useCallback(async () => {
    try {
      const res = await fetch("/api/regulations/list")
      if (res.ok) {
        const data = await res.json()
        setFiles(data.files || [])
      }
    } catch {
      setFiles([])
    }
  }, [])

  useEffect(() => {
    loadFileList()
  }, [loadFileList])

  const handleEmbed = async () => {
    if (isLoading) return

    setIsLoading(true)
    setResult(null)

    try {
      const result = await embedRegulations()
      setResult(result)
      if (result.success) await loadFileList()
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/regulations/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setResult({
          success: true,
          message: `"${data.name}" 업로드 완료`,
        })
        await loadFileList()
      } else {
        setResult({
          success: false,
          message: data.error || "업로드에 실패했습니다",
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "업로드 중 오류가 발생했습니다",
      })
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  return (
    <div className="space-y-4">
      {/* 문서 업로드 */}
      <div className="space-y-2">
        <p className="text-sm font-medium">문서 업로드</p>
        <p className="text-xs text-muted-foreground">
          PDF, MD, TXT 파일을 docs 폴더에 업로드합니다
        </p>
        <div className="flex gap-2">
          <Input
            type="file"
            accept={ACCEPT}
            onChange={handleUpload}
            disabled={isUploading}
            className="hidden"
            id="regulation-upload"
          />
          <Button
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => document.getElementById("regulation-upload")?.click()}
            className="flex-1"
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            파일 선택
          </Button>
          <Button variant="ghost" size="sm" onClick={loadFileList}>
            목록 새로고침
          </Button>
        </div>
      </div>

      {/* 문서 목록 */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">등록된 문서 ({files.length}개)</p>
          <ul className="max-h-32 overflow-y-auto rounded border p-2 space-y-1">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{f.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 벡터화 실행 */}
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
                {result.chunksCount !== undefined && (
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
        docs/ 및 docs/regulations/ 폴더의 PDF, MD, TXT 파일이 처리됩니다.
      </p>
    </div>
  )
}
