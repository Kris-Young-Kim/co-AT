"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type InventoryItem } from "@/actions/inventory-actions"
import {
  updateInventoryStatus,
  deleteInventoryItem,
} from "@/actions/inventory-actions"
import {
  Package,
  PackageCheck,
  PackageX,
  Wrench,
  SprayCan,
  Trash2,
  Edit,
  QrCode,
  MoreVertical,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { QRCodeGenerator } from "./QRCodeGenerator"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface InventoryListProps {
  items: InventoryItem[]
  viewMode: "card" | "table"
  isLoading?: boolean
  onEdit: (item: InventoryItem) => void
  onRefresh: () => void
}

const statusConfig: Record<string, { label: string; icon: typeof Package; className: string }> = {
  보관: {
    label: "보관",
    icon: PackageCheck,
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  대여중: {
    label: "대여중",
    icon: PackageX,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  수리중: {
    label: "수리중",
    icon: Wrench,
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  소독중: {
    label: "소독중",
    icon: SprayCan,
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
  폐기: {
    label: "폐기",
    icon: Trash2,
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
}

export function InventoryList({
  items,
  viewMode,
  isLoading = false,
  onEdit,
  onRefresh,
}: InventoryListProps) {
  const router = useRouter()
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // 상태 변경
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedItem) return

    setIsUpdating(true)
    try {
      const result = await updateInventoryStatus(selectedItem.id, newStatus)
      if (result.success) {
        setIsStatusDialogOpen(false)
        setSelectedItem(null)
        onRefresh()
        router.refresh()
      }
    } catch (error) {
      console.error("상태 변경 실패:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  // 삭제
  const handleDelete = async () => {
    if (!selectedItem) return

    setIsDeleting(true)
    try {
      const result = await deleteInventoryItem(selectedItem.id)
      if (result.success) {
        setIsDeleteDialogOpen(false)
        setSelectedItem(null)
        onRefresh()
        router.refresh()
      }
    } catch (error) {
      console.error("삭제 실패:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  // 카드 뷰
  if (viewMode === "card") {
    return (
      <>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">등록된 재고가 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const statusInfo = statusConfig[item.status || "보관"] || statusConfig["보관"]
              const StatusIcon = statusInfo.icon

              return (
                <Card
                  key={item.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => onEdit(item)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {item.name}
                      </CardTitle>
                      <Badge className={cn("flex items-center gap-1", statusInfo.className)}>
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5 text-sm">
                      {item.asset_code && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">자산번호</span>
                          <span className="font-medium">{item.asset_code}</span>
                        </div>
                      )}
                      {item.manufacturer && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">제조사</span>
                          <span className="font-medium">{item.manufacturer}</span>
                        </div>
                      )}
                      {item.model && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">모델</span>
                          <span className="font-medium">{item.model}</span>
                        </div>
                      )}
                      {item.category && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">카테고리</span>
                          <span className="font-medium">{item.category}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">대여 가능</span>
                        <Badge
                          variant={item.is_rental_available ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {item.is_rental_available ? "가능" : "불가"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(item)
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedItem(item)
                          setIsStatusDialogOpen(true)
                        }}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                      {item.qr_code && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedItem(item)
                            setIsQRDialogOpen(true)
                          }}
                        >
                          <QrCode className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* 상태 변경 다이얼로그 */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>상태 변경</DialogTitle>
              <DialogDescription>
                {selectedItem?.name}의 상태를 변경하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Select
                defaultValue={selectedItem?.status || "보관"}
                onValueChange={(value) => {
                  handleStatusChange(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="보관">보관</SelectItem>
                  <SelectItem value="대여중">대여중</SelectItem>
                  <SelectItem value="수리중">수리중</SelectItem>
                  <SelectItem value="소독중">소독중</SelectItem>
                  <SelectItem value="폐기">폐기</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsStatusDialogOpen(false)}
                disabled={isUpdating}
              >
                취소
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 삭제 확인 다이얼로그 */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>재고 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedItem?.name}을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  "삭제"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* QR 코드 다이얼로그 */}
        {selectedItem && (
          <QRCodeGenerator
            open={isQRDialogOpen}
            onOpenChange={setIsQRDialogOpen}
            item={selectedItem}
          />
        )}
      </>
    )
  }

  // 테이블 뷰
  return (
    <>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">등록된 재고가 없습니다</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>기기명</TableHead>
                  <TableHead>자산번호</TableHead>
                  <TableHead>제조사/모델</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>대여 가능</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const statusInfo = statusConfig[item.status || "보관"] || statusConfig["보관"]
                  const StatusIcon = statusInfo.icon

                  return (
                    <TableRow key={item.id} className="hover:bg-muted/50 cursor-pointer">
                      <TableCell
                        className="font-medium"
                        onClick={() => onEdit(item)}
                      >
                        {item.name}
                      </TableCell>
                      <TableCell>{item.asset_code || "-"}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {item.manufacturer && (
                            <div className="text-sm">{item.manufacturer}</div>
                          )}
                          {item.model && (
                            <div className="text-xs text-muted-foreground">{item.model}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.category || "-"}</TableCell>
                      <TableCell>
                        <Badge className={cn("flex items-center gap-1 w-fit", statusInfo.className)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.is_rental_available ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {item.is_rental_available ? "가능" : "불가"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item)
                              setIsStatusDialogOpen(true)
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          {item.qr_code && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item)
                                setIsQRDialogOpen(true)
                              }}
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 상태 변경 다이얼로그 */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>상태 변경</DialogTitle>
            <DialogDescription>
              {selectedItem?.name}의 상태를 변경하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select
              defaultValue={selectedItem?.status || "보관"}
              onValueChange={(value) => {
                handleStatusChange(value)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="보관">보관</SelectItem>
                <SelectItem value="대여중">대여중</SelectItem>
                <SelectItem value="수리중">수리중</SelectItem>
                <SelectItem value="소독중">소독중</SelectItem>
                <SelectItem value="폐기">폐기</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              disabled={isUpdating}
            >
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR 코드 다이얼로그 */}
      {selectedItem && (
        <QRCodeGenerator
          open={isQRDialogOpen}
          onOpenChange={setIsQRDialogOpen}
          item={selectedItem}
        />
      )}
    </>
  )
}
