"use client"

import { useState, useRef, useEffect } from "react"
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
import { getInventoryByQRCode, type InventoryItem } from "@/actions/inventory-actions"
import { QrCode, Loader2, AlertCircle, Camera } from "lucide-react"

interface QRCodeScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScanSuccess: (item: InventoryItem) => void
}

export function QRCodeScanner({
  open,
  onOpenChange,
  onScanSuccess,
}: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // 다이얼로그가 열릴 때 카메라 시작
  useEffect(() => {
    if (open && !isScanning) {
      startCamera()
    } else if (!open) {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [open])

  // 카메라 시작
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // 후면 카메라 우선
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)
        setError(null)
      }
    } catch (err) {
      console.error("[QR Scanner] 카메라 시작 실패:", err)
      setError("카메라 접근에 실패했습니다. 수동으로 QR 코드를 입력해주세요.")
      setIsScanning(false)
    }
  }

  // 카메라 중지
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  // QR 코드 조회
  const handleQRCodeLookup = async (qrCode: string) => {
    if (!qrCode.trim()) {
      setError("QR 코드를 입력해주세요")
      return
    }

    try {
      const result = await getInventoryByQRCode(qrCode.trim())

      if (result.success && result.item) {
        console.log("[QR Scanner] 재고 조회 성공:", result.item)
        onScanSuccess(result.item)
        onOpenChange(false)
        setManualCode("")
        setError(null)
      } else {
        setError(result.error || "QR 코드에 해당하는 재고를 찾을 수 없습니다")
      }
    } catch (err) {
      console.error("[QR Scanner] 재고 조회 실패:", err)
      setError("재고 조회 중 오류가 발생했습니다")
    }
  }

  // 수동 입력 처리
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleQRCodeLookup(manualCode)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR 코드 스캔
          </DialogTitle>
          <DialogDescription>
            QR 코드를 스캔하거나 수동으로 입력하여 재고를 조회합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 카메라 영역 */}
          {isScanning ? (
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-primary rounded-lg w-64 h-64" />
              </div>
            </div>
          ) : (
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              <div className="text-center space-y-2">
                <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">카메라를 사용할 수 없습니다</p>
                <p className="text-xs text-muted-foreground">아래에서 수동으로 입력해주세요</p>
              </div>
            </div>
          )}

          {/* 수동 입력 */}
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <Label htmlFor="manual-qr">QR 코드 수동 입력</Label>
            <div className="flex gap-2">
              <Input
                id="manual-qr"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="QR 코드 값 입력"
                className="flex-1"
              />
              <Button type="submit" disabled={!manualCode.trim()}>
                조회
              </Button>
            </div>
          </form>

          {/* 참고 사항 */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• 카메라가 지원되지 않는 경우 수동으로 입력할 수 있습니다</p>
            <p>• QR 코드는 재고 등록 시 자동 생성됩니다</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
          {!isScanning && (
            <Button onClick={startCamera}>
              <Camera className="h-4 w-4 mr-2" />
              카메라 시작
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
