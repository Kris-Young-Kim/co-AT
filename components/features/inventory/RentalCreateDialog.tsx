"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createRental, type CreateRentalInput } from "@/actions/rental-actions"
import { getInventoryList, type InventoryItem } from "@/actions/inventory-actions"
import { Loader2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { addDays, format } from "date-fns"

interface RentalCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  clientId: string
  onSuccess?: () => void
}

export function RentalCreateDialog({
  open,
  onOpenChange,
  applicationId,
  clientId,
  onSuccess,
}: RentalCreateDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableInventory, setAvailableInventory] = useState<InventoryItem[]>([])
  const [isLoadingInventory, setIsLoadingInventory] = useState(false)

  // 폼 데이터
  const [formData, setFormData] = useState<CreateRentalInput>({
    application_id: applicationId,
    inventory_id: "",
    client_id: clientId,
    rental_start_date: format(new Date(), "yyyy-MM-dd"),
    rental_end_date: format(addDays(new Date(), 30), "yyyy-MM-dd"), // 기본 30일
  })

  // 대여 가능한 재고 목록 로드
  useEffect(() => {
    if (open) {
      loadAvailableInventory()
    }
  }, [open])

  const loadAvailableInventory = async () => {
    setIsLoadingInventory(true)
    try {
      const result = await getInventoryList({
        status: "보관",
        is_rental_available: true,
        limit: 100,
      })

      if (result.success && result.items) {
        setAvailableInventory(result.items)
      }
    } catch (error) {
      console.error("재고 목록 로드 실패:", error)
    } finally {
      setIsLoadingInventory(false)
    }
  }

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await createRental(formData)

      if (result.success) {
        console.log("[Rental Create Dialog] 대여 생성 성공")
        onSuccess?.()
        onOpenChange(false)
        router.refresh()
      } else {
        setError(result.error || "대여 생성에 실패했습니다")
      }
    } catch (error) {
      console.error("[Rental Create Dialog] 대여 생성 중 오류:", error)
      setError("예상치 못한 오류가 발생했습니다")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 선택된 재고 정보
  const selectedInventory = availableInventory.find(
    (item) => item.id === formData.inventory_id
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>대여 승인</DialogTitle>
          <DialogDescription>
            보조기기를 선택하고 대여 기간을 설정하여 대여를 승인합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 재고 선택 */}
          <div className="space-y-2">
            <Label htmlFor="inventory">
              보조기기 <span className="text-destructive">*</span>
            </Label>
            {isLoadingInventory ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select
                value={formData.inventory_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, inventory_id: value })
                }
                required
              >
                <SelectTrigger id="inventory">
                  <SelectValue placeholder="대여할 보조기기를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {availableInventory.length === 0 ? (
                    <SelectItem value="" disabled>
                      대여 가능한 재고가 없습니다
                    </SelectItem>
                  ) : (
                    availableInventory.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                        {item.model && ` (${item.model})`}
                        {item.asset_code && ` - ${item.asset_code}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            {selectedInventory && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>제조사: {selectedInventory.manufacturer || "-"}</div>
                <div>카테고리: {selectedInventory.category || "-"}</div>
              </div>
            )}
          </div>

          {/* 대여 기간 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rental_start_date">
                대여 시작일 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rental_start_date"
                type="date"
                value={formData.rental_start_date}
                onChange={(e) =>
                  setFormData({ ...formData, rental_start_date: e.target.value })
                }
                required
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rental_end_date">
                반납 예정일 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rental_end_date"
                type="date"
                value={formData.rental_end_date}
                onChange={(e) =>
                  setFormData({ ...formData, rental_end_date: e.target.value })
                }
                required
                min={formData.rental_start_date}
              />
            </div>
          </div>

          {/* 대여 기간 정보 */}
          {formData.rental_start_date && formData.rental_end_date && (
            <div className="rounded-lg border p-3 bg-muted/50">
              <div className="text-sm space-y-1">
                <div>
                  대여 기간:{" "}
                  {Math.ceil(
                    (new Date(formData.rental_end_date).getTime() -
                      new Date(formData.rental_start_date).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                 일
                </div>
                <div className="text-xs text-muted-foreground">
                  대여 승인 시 재고 상태가 자동으로 '대여중'으로 변경됩니다.
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.inventory_id}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                "대여 승인"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
