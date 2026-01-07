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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { type InventoryItem } from "@/actions/inventory-actions"
import { updateInventoryItem } from "@/actions/inventory-actions"
import { QrCode, Download, Loader2, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface QRCodeGeneratorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryItem
}

export function QRCodeGenerator({
  open,
  onOpenChange,
  item,
}: QRCodeGeneratorProps) {
  const router = useRouter()
  const [qrCodeValue, setQrCodeValue] = useState(item.qr_code || "")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // QR 코드 값 생성 (UUID 기반)
  const generateQRCode = () => {
    // 간단한 UUID 생성 (실제로는 더 안전한 방법 사용 권장)
    const uuid = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    setQrCodeValue(uuid)
    setSuccess(false)
  }

  // QR 코드 저장
  const handleSave = async () => {
    if (!qrCodeValue.trim()) {
      return
    }

    setIsSaving(true)
    try {
      const result = await updateInventoryItem(item.id, {
        qr_code: qrCodeValue.trim(),
      })

      if (result.success) {
        console.log("[QR Generator] QR 코드 저장 성공")
        setSuccess(true)
        router.refresh()
        setTimeout(() => {
          onOpenChange(false)
        }, 1500)
      }
    } catch (error) {
      console.error("[QR Generator] QR 코드 저장 실패:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // QR 코드 이미지 다운로드 (간단한 텍스트 기반)
  const handleDownload = () => {
    // 실제로는 QR 코드 라이브러리(qrcode.react 등)를 사용하여 이미지 생성
    // 여기서는 텍스트 파일로 다운로드
    const blob = new Blob([qrCodeValue], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${item.name}-QR-CODE.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 다이얼로그가 열릴 때 QR 코드 값 초기화
  useEffect(() => {
    if (open) {
      setQrCodeValue(item.qr_code || "")
      setSuccess(false)
    }
  }, [open, item])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR 코드 생성
          </DialogTitle>
          <DialogDescription>
            {item.name}의 QR 코드를 생성하고 관리합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {success && (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                QR 코드가 저장되었습니다.
              </AlertDescription>
            </Alert>
          )}

          {/* QR 코드 값 */}
          <div className="space-y-2">
            <Label htmlFor="qr-code-value">QR 코드 값</Label>
            <div className="flex gap-2">
              <Input
                id="qr-code-value"
                value={qrCodeValue}
                onChange={(e) => {
                  setQrCodeValue(e.target.value)
                  setSuccess(false)
                }}
                placeholder="QR 코드 값"
                className="flex-1 font-mono"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateQRCode}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "생성"
                )}
              </Button>
            </div>
          </div>

          {/* QR 코드 미리보기 영역 */}
          <div className="flex items-center justify-center p-8 bg-muted rounded-lg border-2 border-dashed">
            {qrCodeValue ? (
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded border-2 border-primary">
                  <QrCode className="h-16 w-16 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {qrCodeValue}
                </p>
                <p className="text-xs text-muted-foreground">
                  실제 QR 코드는 라이브러리로 생성됩니다
                </p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <QrCode className="h-16 w-16 mx-auto mb-2 opacity-50" />
                <p className="text-sm">QR 코드 값을 생성하거나 입력하세요</p>
              </div>
            )}
          </div>

          {/* 참고 사항 */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• QR 코드는 재고 식별을 위해 사용됩니다</p>
            <p>• 생성된 QR 코드는 스캔하여 재고를 빠르게 조회할 수 있습니다</p>
            <p>• 실제 프로덕션에서는 qrcode.react 같은 라이브러리를 사용하여 이미지로 생성합니다</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
          {qrCodeValue && (
            <>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                다운로드
              </Button>
              <Button onClick={handleSave} disabled={isSaving || success}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    저장됨
                  </>
                ) : (
                  "저장"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
