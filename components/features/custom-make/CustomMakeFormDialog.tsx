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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createCustomMake, type CreateCustomMakeInput } from "@/actions/custom-make-actions"
import { searchClients, type Client } from "@/actions/client-actions"
import { Loader2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { format, addDays } from "date-fns"

interface CustomMakeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CustomMakeFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: CustomMakeFormDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)

  // 폼 데이터
  const [formData, setFormData] = useState<CreateCustomMakeInput>({
    application_id: "",
    client_id: "",
    item_name: "",
    item_description: "",
    specifications: "",
    expected_completion_date: format(addDays(new Date(), 30), "yyyy-MM-dd"), // 기본 30일 후
  })

  // 클라이언트 목록 로드
  useEffect(() => {
    if (open) {
      loadClients()
    }
  }, [open])

  const loadClients = async () => {
    setIsLoadingClients(true)
    try {
      const result = await searchClients({ limit: 100 })
      if (result.success && result.clients) {
        setClients(result.clients)
      }
    } catch (error) {
      console.error("클라이언트 목록 로드 실패:", error)
    } finally {
      setIsLoadingClients(false)
    }
  }

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await createCustomMake(formData)

      if (result.success) {
        console.log("[Custom Make Form Dialog] 맞춤제작 프로젝트 생성 성공")
        onSuccess?.()
        onOpenChange(false)
        // 폼 초기화
        setFormData({
          application_id: "",
          client_id: "",
          item_name: "",
          item_description: "",
          specifications: "",
          expected_completion_date: format(addDays(new Date(), 30), "yyyy-MM-dd"),
        })
        router.refresh()
      } else {
        setError(result.error || "맞춤제작 프로젝트 생성에 실패했습니다")
      }
    } catch (error) {
      console.error("[Custom Make Form Dialog] 맞춤제작 프로젝트 생성 중 오류:", error)
      setError("예상치 못한 오류가 발생했습니다")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>맞춤제작 프로젝트 생성</DialogTitle>
          <DialogDescription>
            새로운 맞춤제작 프로젝트를 생성합니다. 3D프린터, CNC 등 장비를 활용한 제작을 관리할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 대상자 선택 */}
          <div className="space-y-2">
            <Label htmlFor="client_id">
              대상자 <span className="text-destructive">*</span>
            </Label>
            {isLoadingClients ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value, application_id: "" })}
                required
              >
                <SelectTrigger id="client_id">
                  <SelectValue placeholder="대상자를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                      {client.birth_date && ` (${new Date(client.birth_date).getFullYear()}년생)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 신청서 ID (선택사항) */}
          <div className="space-y-2">
            <Label htmlFor="application_id">신청서 ID (선택사항)</Label>
            <Input
              id="application_id"
              value={formData.application_id}
              onChange={(e) => setFormData({ ...formData, application_id: e.target.value })}
              placeholder="관련 신청서 ID를 입력하세요"
            />
            <p className="text-xs text-muted-foreground">
              신청서와 연동하려면 신청서 ID를 입력하세요. 비워두면 독립적인 프로젝트로 생성됩니다.
            </p>
          </div>

          {/* 제작 품목명 */}
          <div className="space-y-2">
            <Label htmlFor="item_name">
              제작 품목명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="item_name"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              placeholder="예: 손목 보조기, 발목 지지대 등"
              required
            />
          </div>

          {/* 제작 품목 설명 */}
          <div className="space-y-2">
            <Label htmlFor="item_description">제작 품목 설명</Label>
            <Textarea
              id="item_description"
              value={formData.item_description}
              onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
              placeholder="제작 품목에 대한 상세 설명을 입력하세요..."
              rows={3}
            />
          </div>

          {/* 제작 사양 */}
          <div className="space-y-2">
            <Label htmlFor="specifications">제작 사양</Label>
            <Textarea
              id="specifications"
              value={formData.specifications}
              onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
              placeholder="치수, 재료, 색상 등 제작 사양을 입력하세요..."
              rows={4}
            />
          </div>

          {/* 예상 완료일 */}
          <div className="space-y-2">
            <Label htmlFor="expected_completion_date">예상 완료일</Label>
            <Input
              id="expected_completion_date"
              type="date"
              value={formData.expected_completion_date}
              onChange={(e) =>
                setFormData({ ...formData, expected_completion_date: e.target.value })
              }
              min={format(new Date(), "yyyy-MM-dd")}
            />
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
            <Button type="submit" disabled={isSubmitting || !formData.client_id || !formData.item_name}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  생성 중...
                </>
              ) : (
                "프로젝트 생성"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// date-fns locale import
import { ko } from "date-fns/locale"
