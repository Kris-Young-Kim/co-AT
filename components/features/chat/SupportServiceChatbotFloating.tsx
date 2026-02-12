"use client"

import { useState } from "react"
import { MessageSquare } from "lucide-react"
import { SupportServiceChatbot } from "./SupportServiceChatbot"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function SupportServiceChatbotFloating() {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-primary p-4 text-primary-foreground shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-transform hover:scale-105"
        aria-label="지원사업 안내 챗봇 열기"
        title="지원사업 안내 챗봇"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            지원사업 안내 챗봇
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden px-6 pb-6 min-h-0">
          <SupportServiceChatbot className="h-full" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
