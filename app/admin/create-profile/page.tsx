"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function CreateProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCreateProfile = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/profile/create", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "프로필 생성에 실패했습니다")
        return
      }

      setResult(data)
      
      // 프로필 생성 성공 시 대시보드로 이동
      if (data.success) {
        setTimeout(() => {
          router.push("/admin/dashboard")
        }, 2000)
      }
    } catch (err) {
      setError("요청 중 오류가 발생했습니다: " + String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleCheckProfile = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/profile/create", {
        method: "GET",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "프로필 조회에 실패했습니다")
        return
      }

      setResult(data)
    } catch (err) {
      setError("요청 중 오류가 발생했습니다: " + String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>프로필 생성/확인</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={handleCheckProfile}
              disabled={loading}
              variant="outline"
            >
              프로필 확인
            </Button>
            <Button
              onClick={handleCreateProfile}
              disabled={loading}
            >
              프로필 생성 (Manager 권한)
            </Button>
          </div>

          {loading && (
            <p className="text-sm text-muted-foreground">처리 중...</p>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm font-medium text-destructive">오류</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-muted rounded-md space-y-2">
              <p className="text-sm font-medium">결과:</p>
              <pre className="text-xs bg-background p-3 rounded border overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
            <p><strong>사용 방법:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>먼저 "프로필 확인" 버튼을 눌러 현재 상태를 확인하세요</li>
              <li>프로필이 없다면 "프로필 생성" 버튼을 눌러 생성하세요</li>
              <li>생성된 프로필의 role은 "manager"로 설정됩니다</li>
              <li>생성 후 공지사항 관리 페이지로 이동할 수 있습니다</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

