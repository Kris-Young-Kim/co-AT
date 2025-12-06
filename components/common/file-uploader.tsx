"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploaderProps {
  onUpload?: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxSize?: number // bytes
  className?: string
}

export function FileUploader({
  onUpload,
  accept = "image/*",
  multiple = false,
  maxSize = 5 * 1024 * 1024, // 5MB 기본값
  className,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const errors: string[] = []

    fileArray.forEach((file) => {
      if (file.size > maxSize) {
        errors.push(`${file.name}: 파일 크기가 ${maxSize / 1024 / 1024}MB를 초과합니다.`)
        return
      }
      validFiles.push(file)
    })

    if (errors.length > 0) {
      setError(errors.join("\n"))
    } else {
      setError(null)
      onUpload?.(validFiles)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-6 sm:p-8 transition-colors",
          isDragging ? "border-primary bg-primary/5 dark:bg-primary/10" : "border-muted bg-muted/50 dark:bg-muted/30"
        )}
      >
        <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
        <div className="text-center">
          <p className="text-xs sm:text-sm font-medium text-foreground">
            파일을 드래그하거나 클릭하여 업로드
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {accept} (최대 {maxSize / 1024 / 1024}MB)
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          파일 선택
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

