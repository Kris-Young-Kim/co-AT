"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare, X } from "lucide-react"
import { RegulationChatbot } from "./RegulationChatbot"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function RegulationChatbotFloating() {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
        return (
            <button
              onClick={() => setIsOpen(true)}
              className="fixed bottom-4 right-4 z-50 rounded-lg bg-primary px-4 py-3 text-primary-foreground shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-transform hover:scale-105"
              aria-label="규정 검색 챗봇 열기"
              title="규정 검색 챗봇"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
          )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            규정 검색 챗봇
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden px-6 pb-6 min-h-0">
          <RegulationChatbot className="h-full" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
