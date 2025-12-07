"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Image as ImageIcon, FileText, Youtube, Download, ExternalLink } from "lucide-react"
import type { Attachment } from "@/actions/notice-actions"
import Image from "next/image"

interface NoticeAttachmentsProps {
  attachments: Attachment[]
}

export function NoticeAttachments({ attachments }: NoticeAttachmentsProps) {
  if (!attachments || attachments.length === 0) {
    return null
  }

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-semibold">첨부파일</h3>
      <div className="grid gap-4">
        {attachments.map((attachment, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              {attachment.type === "image" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{attachment.name}</span>
                    {attachment.size && (
                      <span className="text-sm text-muted-foreground">
                        ({(attachment.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </div>
                  <div className="relative w-full h-64 sm:h-96 rounded-lg overflow-hidden border">
                    <Image
                      src={attachment.url}
                      alt={attachment.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full sm:w-auto"
                  >
                    <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      원본 보기
                    </a>
                  </Button>
                </div>
              )}

              {attachment.type === "pdf" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{attachment.name}</span>
                    {attachment.size && (
                      <span className="text-sm text-muted-foreground">
                        ({(attachment.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        새 창에서 열기
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={attachment.url} download>
                        <Download className="mr-2 h-4 w-4" />
                        다운로드
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {attachment.type === "youtube" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Youtube className="h-5 w-5 text-red-500" />
                    <span className="font-medium">{attachment.name}</span>
                  </div>
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-black">
                    <iframe
                      src={attachment.url}
                      title={attachment.name}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

