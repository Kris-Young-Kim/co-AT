"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getExpiringPrivacyData, getExpiredPrivacyData } from "@/actions/privacy-actions"
import { AlertTriangle, Clock, Trash2, ExternalLink } from "lucide-react"
import { format, differenceInDays, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import Link from "next/link"

/**
 * 개인정보 보유 기간 알림 컴포넌트
 */
export function PrivacyRetentionAlerts() {
  const [expiringClients, setExpiringClients] = useState<
    Array<{
      id: string
      name: string
      created_at: string
      expiration_date: string
      days_until_expiration: number
    }>
  >([])
  const [expiredClients, setExpiredClients] = useState<
    Array<{
      id: string
      name: string
      created_at: string
      expiration_date: string
      days_since_expiration: number
    }>
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPrivacyData()
  }, [])

  const loadPrivacyData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [expiringResult, expiredResult] = await Promise.all([
        getExpiringPrivacyData(),
        getExpiredPrivacyData(),
      ])

      if (expiringResult.success && expiringResult.clients) {
        setExpiringClients(expiringResult.clients)
      }

      if (expiredResult.success && expiredResult.clients) {
        setExpiredClients(expiredResult.clients)
      }

      if (!expiringResult.success || !expiredResult.success) {
        setError("개인정보 보유 기간 데이터를 불러오는데 실패했습니다")
      }
    } catch (err) {
      console.error("[Privacy Retention Alerts] 데이터 로드 실패:", err)
      setError("예상치 못한 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            개인정보 보유 기간 관리
          </CardTitle>
          <CardDescription>데이터를 불러오는 중...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            개인정보 보유 기간 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>오류</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // 만료된 데이터가 있으면 우선 표시
  if (expiredClients.length > 0) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            개인정보 보유 기간 만료 (즉시 파기 필요)
          </CardTitle>
          <CardDescription>
            보유 기간(5년)이 경과한 개인정보입니다. 개인정보보호법에 따라 즉시 파기해야 합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>긴급 조치 필요</AlertTitle>
            <AlertDescription>
              {expiredClients.length}명의 대상자 정보가 보유 기간을 초과했습니다. 개인정보보호법에
              따라 즉시 파기 절차를 진행해주세요.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-muted-foreground">
              만료된 대상자 ({expiredClients.length}명)
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {expiredClients.slice(0, 10).map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-destructive/50 bg-destructive/5"
                >
                  <div className="flex-1">
                    <div className="font-medium">{client.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      등록일: {format(parseISO(client.created_at), "yyyy년 MM월 dd일", { locale: ko })}
                      {" • "}
                      만료일: {format(parseISO(client.expiration_date), "yyyy년 MM월 dd일", { locale: ko })}
                    </div>
                    <div className="text-xs text-destructive font-semibold mt-1">
                      만료 후 {client.days_since_expiration}일 경과
                    </div>
                  </div>
                  <Link href={`/clients/${client.id}`}>
                    <Button variant="outline" size="sm" className="ml-2">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      상세보기
                    </Button>
                  </Link>
                </div>
              ))}
              {expiredClients.length > 10 && (
                <div className="text-xs text-muted-foreground text-center py-2">
                  외 {expiredClients.length - 10}명 더...
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 만료 예정 데이터가 있으면 표시
  if (expiringClients.length > 0) {
    return (
      <Card className="border-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <Clock className="h-5 w-5" />
            개인정보 보유 기간 만료 예정 (1개월 전 알림)
          </CardTitle>
          <CardDescription>
            보유 기간(5년) 만료 1개월 전 대상자입니다. 만료 전 파기 절차를 준비해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>만료 예정 알림</AlertTitle>
            <AlertDescription>
              {expiringClients.length}명의 대상자 정보가 곧 보유 기간을 만료합니다. 만료 전 파기
              절차를 준비해주세요.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-muted-foreground">
              만료 예정 대상자 ({expiringClients.length}명)
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {expiringClients.slice(0, 10).map((client) => {
                const daysLeft = client.days_until_expiration
                const isUrgent = daysLeft <= 7 // 7일 이내면 긴급

                return (
                  <div
                    key={client.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isUrgent
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                        : "border-orange-200 bg-orange-50/50 dark:bg-orange-950/10"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {client.name}
                        {isUrgent && (
                          <Badge variant="destructive" className="text-xs">
                            긴급
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        등록일: {format(parseISO(client.created_at), "yyyy년 MM월 dd일", { locale: ko })}
                        {" • "}
                        만료일: {format(parseISO(client.expiration_date), "yyyy년 MM월 dd일", { locale: ko })}
                      </div>
                      <div
                        className={`text-xs font-semibold mt-1 ${
                          isUrgent ? "text-destructive" : "text-orange-600"
                        }`}
                      >
                        만료까지 {daysLeft}일 남음
                      </div>
                    </div>
                    <Link href={`/clients/${client.id}`}>
                      <Button variant="outline" size="sm" className="ml-2">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        상세보기
                      </Button>
                    </Link>
                  </div>
                )
              })}
              {expiringClients.length > 10 && (
                <div className="text-xs text-muted-foreground text-center py-2">
                  외 {expiringClients.length - 10}명 더...
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 만료 예정 및 만료된 데이터가 없으면 정상 상태 표시
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          개인정보 보유 기간 관리
        </CardTitle>
        <CardDescription>개인정보 보유 기간(5년) 만료 예정 또는 만료된 대상자가 없습니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertTitle>정상 상태</AlertTitle>
          <AlertDescription>
            현재 만료 예정 또는 만료된 개인정보가 없습니다. 개인정보는 등록일로부터 5년간 보유되며,
            만료 1개월 전에 알림이 표시됩니다.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
