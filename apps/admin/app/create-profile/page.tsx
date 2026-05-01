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
        setError(data.error || "?„ë¡œ???ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤")
        return
      }

      setResult(data)
      
      // ?„ë¡œ???ì„± ?±ê³µ ???€?œë³´?œë¡œ ?´ë™
      if (data.success) {
        setTimeout(() => {
          router.push("/")
        }, 2000)
      }
    } catch (err) {
      setError("?”ì²­ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤: " + String(err))
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
        setError(data.error || "?„ë¡œ??ì¡°íšŒ???¤íŒ¨?ˆìŠµ?ˆë‹¤")
        return
      }

      setResult(data)
    } catch (err) {
      setError("?”ì²­ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤: " + String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>?„ë¡œ???ì„±/?•ì¸</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={handleCheckProfile}
              disabled={loading}
              variant="outline"
            >
              ?„ë¡œ???•ì¸
            </Button>
            <Button
              onClick={handleCreateProfile}
              disabled={loading}
            >
              ?„ë¡œ???ì„± (Manager ê¶Œí•œ)
            </Button>
          </div>

          {loading && (
            <p className="text-sm text-muted-foreground">ì²˜ë¦¬ ì¤?..</p>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm font-medium text-destructive">?¤ë¥˜</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-muted rounded-md space-y-2">
              <p className="text-sm font-medium">ê²°ê³¼:</p>
              <pre className="text-xs bg-background p-3 rounded border overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
            <p><strong>?¬ìš© ë°©ë²•:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>ë¨¼ì? "?„ë¡œ???•ì¸" ë²„íŠ¼???ŒëŸ¬ ?„ì¬ ?íƒœë¥??•ì¸?˜ì„¸??/li>
              <li>?„ë¡œ?„ì´ ?†ë‹¤ë©?"?„ë¡œ???ì„±" ë²„íŠ¼???ŒëŸ¬ ?ì„±?˜ì„¸??/li>
              <li>?ì„±???„ë¡œ?„ì˜ role?€ "manager"ë¡??¤ì •?©ë‹ˆ??/li>
              <li>?ì„± ??ê³µì??¬í•­ ê´€ë¦??˜ì´ì§€ë¡??´ë™?????ˆìŠµ?ˆë‹¤</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

