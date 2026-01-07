"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getOverdueRentals, getExpiringRentals, type RentalWithDetails } from "@/actions/rental-actions"
import { AlertTriangle, Calendar, Package, ArrowRight } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

export function RentalAlerts() {
  const [overdueRentals, setOverdueRentals] = useState<RentalWithDetails[]>([])
  const [expiringRentals, setExpiringRentals] = useState<RentalWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const [overdueResult, expiringResult] = await Promise.all([
          getOverdueRentals(),
          getExpiringRentals(7),
        ])

        if (overdueResult.success) {
          setOverdueRentals(overdueResult.rentals || [])
        }
        if (expiringResult.success) {
          setExpiringRentals(expiringResult.rentals || [])
        }
      } catch (error) {
        console.error("대여 알림 로드 실패:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAlerts()
  }, [])

  if (isLoading) {
    return null
  }

  if (overdueRentals.length === 0 && expiringRentals.length === 0) {
    return null
  }

  return (
    <Card className="border-l-4 border-l-yellow-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            대여 알림
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/rentals">
              전체 보기
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {overdueRentals.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  <strong>{overdueRentals.length}건</strong>의 연체된 대여가 있습니다.
                </span>
                <Badge variant="destructive">{overdueRentals.length}</Badge>
              </div>
              <div className="mt-2 space-y-1">
                {overdueRentals.slice(0, 3).map((rental) => (
                  <div key={rental.id} className="text-xs">
                    • {rental.inventory_name} - {rental.client_name} (
                    {format(new Date(rental.rental_end_date), "yyyy-MM-dd", { locale: ko })})
                  </div>
                ))}
                {overdueRentals.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    외 {overdueRentals.length - 3}건...
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {expiringRentals.length > 0 && (
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  <strong>{expiringRentals.length}건</strong>의 대여가 7일 이내 만료 예정입니다.
                </span>
                <Badge variant="outline">{expiringRentals.length}</Badge>
              </div>
              <div className="mt-2 space-y-1">
                {expiringRentals.slice(0, 3).map((rental) => (
                  <div key={rental.id} className="text-xs">
                    • {rental.inventory_name} - {rental.client_name} (D-
                    {rental.days_remaining !== undefined ? rental.days_remaining : "-"}
                    일)
                  </div>
                ))}
                {expiringRentals.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    외 {expiringRentals.length - 3}건...
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
