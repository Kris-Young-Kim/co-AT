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
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { type InventoryItem } from "@/actions/inventory-actions"
import {
  createInventoryItem,
  updateInventoryItem,
} from "@/actions/inventory-actions"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface InventoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: InventoryItem | null
  onSuccess?: () => void
}

export function InventoryFormDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: InventoryFormDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 폼 데이터
  const [formData, setFormData] = useState({
    name: "",
    asset_code: "",
    category: "",
    status: "보관",
    is_rental_available: true,
    manufacturer: "",
    model: "",
    purchase_date: "",
    purchase_price: "",
    qr_code: "",
  })

  // 아이템이 변경되면 폼 데이터 초기화
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        asset_code: item.asset_code || "",
        category: item.category || "",
        status: item.status || "보관",
        is_rental_available: item.is_rental_available ?? true,
        manufacturer: item.manufacturer || "",
        model: item.model || "",
        purchase_date: item.purchase_date || "",
        purchase_price: item.purchase_price?.toString() || "",
        qr_code: item.qr_code || "",
      })
    } else {
      setFormData({
        name: "",
        asset_code: "",
        category: "",
        status: "보관",
        is_rental_available: true,
        manufacturer: "",
        model: "",
        purchase_date: "",
        purchase_price: "",
        qr_code: "",
      })
    }
    setError(null)
  }, [item, open])

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const data = {
        name: formData.name,
        asset_code: formData.asset_code || null,
        category: formData.category || null,
        status: formData.status,
        is_rental_available: formData.is_rental_available,
        manufacturer: formData.manufacturer || null,
        model: formData.model || null,
        purchase_date: formData.purchase_date || null,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        qr_code: formData.qr_code || null,
      }

      let result
      if (item) {
        // 수정
        result = await updateInventoryItem(item.id, data)
      } else {
        // 등록
        result = await createInventoryItem(data)
      }

      if (result.success) {
        console.log("[Inventory Form] 재고 저장 성공")
        onSuccess?.()
        onOpenChange(false)
        router.refresh()
      } else {
        setError(result.error || "저장에 실패했습니다")
      }
    } catch (error) {
      console.error("[Inventory Form] 저장 중 오류:", error)
      setError("예상치 못한 오류가 발생했습니다")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "재고 수정" : "재고 등록"}</DialogTitle>
          <DialogDescription>
            {item
              ? "재고 정보를 수정합니다. 대여, 재사용, 맞춤제작 지원 물품을 구분하여 등록하세요."
              : "새로운 재고를 등록합니다. 대여, 재사용, 맞춤제작 지원 물품을 구분하여 등록하세요."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          {/* 기본 정보 */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  기기명 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 전동휠체어"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset_code">자산번호</Label>
                <Input
                  id="asset_code"
                  value={formData.asset_code}
                  onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })}
                  placeholder="예: ASSET-2024-001"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="휠체어">휠체어</SelectItem>
                    <SelectItem value="보행기">보행기</SelectItem>
                    <SelectItem value="목발">목발</SelectItem>
                    <SelectItem value="지팡이">지팡이</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">상태</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
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
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_rental_available"
                checked={formData.is_rental_available}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_rental_available: checked as boolean })
                }
              />
              <Label
                htmlFor="is_rental_available"
                className="text-sm font-normal cursor-pointer"
              >
                대여 가능
              </Label>
            </div>
          </div>

          {/* 제조사 정보 */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold">제조사 정보</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">제조사</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="예: 삼성전자"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">모델명</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="예: WH-2024"
                />
              </div>
            </div>
          </div>

          {/* 구입 정보 */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold">구입 정보</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchase_date">구입일</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_price">구입가격 (원)</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  placeholder="예: 1000000"
                />
              </div>
            </div>
          </div>

          {/* QR 코드 */}
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="qr_code">QR 코드</Label>
            <Input
              id="qr_code"
              value={formData.qr_code}
              onChange={(e) => setFormData({ ...formData, qr_code: e.target.value })}
              placeholder="QR 코드 값 (자동 생성 가능)"
            />
            <p className="text-xs text-muted-foreground">
              QR 코드는 저장 후 자동 생성할 수 있습니다.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : item ? (
                "수정"
              ) : (
                "등록"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
