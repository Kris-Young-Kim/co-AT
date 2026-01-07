"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  getRentals,
  getOverdueRentals,
  getExpiringRentals,
  returnRental,
  extendRental,
  type RentalWithDetails,
} from "@/actions/rental-actions"
import {
  Package,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface RentalManagementContentProps {
  initialRentals?: RentalWithDetails[]
  initialOverdue?: RentalWithDetails[]
  initialExpiring?: RentalWithDetails[]
}

export function RentalManagementContent({
  initialRentals = [],
  initialOverdue = [],
  initialExpiring = [],
}: RentalManagementContentProps) {
  const router = useRouter()
  const [rentals, setRentals] = useState<RentalWithDetails[]>(initialRentals)
  const [overdueRentals, setOverdueRentals] = useState<RentalWithDetails[]>(initialOverdue)
  const [expiringRentals, setExpiringRentals] = useState<RentalWithDetails[]>(initialExpiring)
  const [isLoading, setIsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // 다이얼로그 상태
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false)
  const [selectedRental, setSelectedRental] = useState<RentalWithDetails | null>(null)
  const [returnDate, setReturnDate] = useState("")
  const [newEndDate, setNewEndDate] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // 대여 목록 새로고침
  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      const [rentalsResult, overdueResult, expiringResult] = await Promise.all([
        getRentals({ status: statusFilter !== "all" ? statusFilter : undefined }),
        getOverdueRentals(),
        getExpiringRentals(7),
      ])

      if (rentalsResult.success) {
        setRentals(rentalsResult.rentals || [])
      }
      if (overdueResult.success) {
        setOverdueRentals(overdueResult.rentals || [])
      }
      if (expiringResult.success) {
        setExpiringRentals(expiringResult.rentals || [])
      }
    } catch (error) {
      console.error("대여 목록 새로고침 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 필터 변경 시 새로고침
  useEffect(() => {
    handleRefresh()
  }, [statusFilter])

  // 반납 처리
  const handleReturn = async () => {
    if (!selectedRental) return

    setIsProcessing(true)
    try {
      const result = await returnRental(selectedRental.id, returnDate || undefined)
      if (result.success) {
        setIsReturnDialogOpen(false)
        setSelectedRental(null)
        setReturnDate("")
        handleRefresh()
        router.refresh()
      }
    } catch (error) {
      console.error("반납 처리 실패:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  // 연장 처리
  const handleExtend = async () => {
    if (!selectedRental || !newEndDate) return

    setIsProcessing(true)
    try {
      const result = await extendRental(selectedRental.id, newEndDate)
      if (result.success) {
        setIsExtendDialogOpen(false)
        setSelectedRental(null)
        setNewEndDate("")
        handleRefresh()
        router.refresh()
      }
    } catch (error) {
      console.error("연장 처리 실패:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  // 상태별 뱃지
  const getStatusBadge = (status: string | null, isOverdue?: boolean, isDueToday?: boolean) => {
    if (isOverdue) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          연체
        </Badge>
      )
    }
    if (isDueToday) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-600 dark:text-yellow-500">
          <Clock className="h-3 w-3" />
          오늘 반납
        </Badge>
      )
    }
    switch (status) {
      case "rented":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            대여중
          </Badge>
        )
      case "returned":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            반납완료
          </Badge>
        )
      case "overdue":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            연체
          </Badge>
        )
      case "damaged":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            손상
          </Badge>
        )
      default:
        return <Badge variant="outline">{status || "-"}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* 알림 카드 */}
      {(overdueRentals.length > 0 || expiringRentals.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {overdueRentals.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{overdueRentals.length}건</strong>의 연체된 대여가 있습니다.
              </AlertDescription>
            </Alert>
          )}
          {expiringRentals.length > 0 && (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                <strong>{expiringRentals.length}건</strong>의 대여가 7일 이내 만료 예정입니다.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 대여</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rentals.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대여중</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {rentals.filter((r) => r.status === "rented").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">연체</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueRentals.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">만료 예정</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{expiringRentals.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 새로고침 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>대여 목록</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="rented">대여중</SelectItem>
                  <SelectItem value="returned">반납완료</SelectItem>
                  <SelectItem value="overdue">연체</SelectItem>
                  <SelectItem value="damaged">손상</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rentals.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>등록된 대여가 없습니다</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>기기명</TableHead>
                  <TableHead>대상자</TableHead>
                  <TableHead>대여 시작일</TableHead>
                  <TableHead>반납 예정일</TableHead>
                  <TableHead>D-Day</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rentals.map((rental) => (
                  <TableRow
                    key={rental.id}
                    className={cn(
                      rental.is_overdue && "bg-destructive/5",
                      rental.is_due_today && "bg-yellow-500/5"
                    )}
                  >
                    <TableCell className="font-medium">
                      {rental.inventory_name || "기기명 없음"}
                      {rental.inventory_model && (
                        <div className="text-xs text-muted-foreground">{rental.inventory_model}</div>
                      )}
                    </TableCell>
                    <TableCell>{rental.client_name || "-"}</TableCell>
                    <TableCell>
                      {format(new Date(rental.rental_start_date), "yyyy-MM-dd", { locale: ko })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(rental.rental_end_date), "yyyy-MM-dd", { locale: ko })}
                    </TableCell>
                    <TableCell>
                      {rental.status === "rented" && rental.days_remaining !== undefined && (
                        <div
                          className={cn(
                            "font-semibold",
                            rental.is_overdue && "text-destructive",
                            rental.is_due_today && "text-yellow-600 dark:text-yellow-500",
                            rental.days_remaining > 0 && "text-muted-foreground"
                          )}
                        >
                          {rental.is_overdue
                            ? `+${Math.abs(rental.days_remaining)}일`
                            : rental.days_remaining === 0
                            ? "오늘"
                            : `${rental.days_remaining}일`}
                        </div>
                      )}
                      {rental.status === "returned" && rental.return_date && (
                        <div className="text-sm text-muted-foreground">
                          반납: {format(new Date(rental.return_date), "yyyy-MM-dd", { locale: ko })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(rental.status, rental.is_overdue, rental.is_due_today)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {rental.status === "rented" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRental(rental)
                                setReturnDate("")
                                setIsReturnDialogOpen(true)
                              }}
                            >
                              반납
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRental(rental)
                                setNewEndDate(rental.rental_end_date)
                                setIsExtendDialogOpen(true)
                              }}
                            >
                              연장
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 반납 다이얼로그 */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>대여 반납</DialogTitle>
            <DialogDescription>
              {selectedRental?.inventory_name}의 반납을 처리하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="return-date">반납일</Label>
              <Input
                id="return-date"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                defaultValue={format(new Date(), "yyyy-MM-dd")}
              />
              <p className="text-xs text-muted-foreground">
                비워두면 오늘 날짜로 반납 처리됩니다.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReturnDialogOpen(false)}
              disabled={isProcessing}
            >
              취소
            </Button>
            <Button onClick={handleReturn} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                "반납 처리"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 연장 다이얼로그 */}
      <Dialog open={isExtendDialogOpen} onOpenChange={setIsExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>대여 기간 연장</DialogTitle>
            <DialogDescription>
              {selectedRental?.inventory_name}의 대여 기간을 연장하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-end-date">새로운 반납 예정일</Label>
              <Input
                id="new-end-date"
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                min={selectedRental?.rental_end_date}
                required
              />
              {selectedRental && (
                <p className="text-xs text-muted-foreground">
                  현재 반납 예정일: {format(new Date(selectedRental.rental_end_date), "yyyy-MM-dd", { locale: ko })}
                  <br />
                  연장 횟수: {selectedRental.extension_count || 0}회
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsExtendDialogOpen(false)}
              disabled={isProcessing}
            >
              취소
            </Button>
            <Button onClick={handleExtend} disabled={isProcessing || !newEndDate}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                "연장"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
