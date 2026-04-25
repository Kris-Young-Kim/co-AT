// components/features/inventory/BarcodeScanInput.tsx
"use client"

import { useRef, useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Barcode, X } from "lucide-react"
import { Label } from "@/components/ui/label"

interface BarcodeScanInputProps {
  onScan: (barcode: string) => void
  isLoading?: boolean
  autoFocus?: boolean
}

export function BarcodeScanInput({ onScan, isLoading = false, autoFocus = true }: BarcodeScanInputProps) {
  const [value, setValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus()
    }
  }, [autoFocus])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const trimmed = value.trim()
      if (trimmed) {
        onScan(trimmed)
        setValue("")
      }
    }
  }

  const handleConfirm = () => {
    const trimmed = value.trim()
    if (trimmed) {
      onScan(trimmed)
      setValue("")
      inputRef.current?.focus()
    }
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-medium">
        <Barcode className="h-4 w-4" />
        바코드 스캔 / 입력
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="바코드를 스캔하거나 직접 입력 후 Enter"
            disabled={isLoading}
            className="pr-8"
          />
          {value && (
            <button
              type="button"
              onClick={() => { setValue(""); inputRef.current?.focus() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="입력 지우기"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleConfirm}
          disabled={!value.trim() || isLoading}
        >
          {isLoading ? "조회 중..." : "조회"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        USB/블루투스 바코드 스캐너 연결 후 스캔하거나, 바코드 번호를 직접 입력하세요.
      </p>
    </div>
  )
}
