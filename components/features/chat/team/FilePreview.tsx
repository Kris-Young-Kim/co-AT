'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface FilePreviewProps {
  url: string
  name: string
  open: boolean
  onClose: () => void
}

export function FilePreview({ url, name, open, onClose }: FilePreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <span className="text-sm font-medium truncate">{name}</span>
          <div className="flex items-center gap-2">
            <a href={url} download={name} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Download className="h-4 w-4" />
              </Button>
            </a>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="relative min-h-[300px] max-h-[70vh] overflow-auto flex items-center justify-center bg-muted">
          <Image
            src={url}
            alt={name}
            width={800}
            height={600}
            className="object-contain max-h-[70vh]"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
