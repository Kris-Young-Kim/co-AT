"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  ZoomIn,
  ZoomOut,
  Contrast,
  Volume2,
  Keyboard,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function AccessibilityToolbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [highContrast, setHighContrast] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // 로컬 스토리지에서 설정 불러오기
  useEffect(() => {
    const savedZoom = localStorage.getItem("a11y-zoom")
    const savedContrast = localStorage.getItem("a11y-high-contrast")
    
    if (savedZoom) {
      setZoomLevel(Number(savedZoom))
      applyZoom(Number(savedZoom))
    }
    
    if (savedContrast === "true") {
      setHighContrast(true)
      document.documentElement.classList.add("high-contrast")
    }
  }, [])

  // 화면 확대/축소 적용
  const applyZoom = (level: number) => {
    document.documentElement.style.fontSize = `${level}%`
    localStorage.setItem("a11y-zoom", level.toString())
  }

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 10, 200)
    setZoomLevel(newZoom)
    applyZoom(newZoom)
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 10, 50)
    setZoomLevel(newZoom)
    applyZoom(newZoom)
  }

  const handleResetZoom = () => {
    setZoomLevel(100)
    applyZoom(100)
  }

  // 고대비 모드 전환
  const toggleHighContrast = () => {
    const newContrast = !highContrast
    setHighContrast(newContrast)
    
    if (newContrast) {
      document.documentElement.classList.add("high-contrast")
      localStorage.setItem("a11y-high-contrast", "true")
    } else {
      document.documentElement.classList.remove("high-contrast")
      localStorage.setItem("a11y-high-contrast", "false")
    }
  }

  // 음성 출력 (TTS)
  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    const textToSpeak = document.body.innerText
    if (textToSpeak && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.lang = "ko-KR"
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
      setIsSpeaking(true)
    }
  }

  // 키보드 단축키
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Alt + A: 접근성 툴바 열기/닫기
      if (e.altKey && e.key === "a") {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
      // Alt + +: 확대
      if (e.altKey && e.key === "+") {
        e.preventDefault()
        handleZoomIn()
      }
      // Alt + -: 축소
      if (e.altKey && e.key === "-") {
        e.preventDefault()
        handleZoomOut()
      }
      // Alt + 0: 확대/축소 리셋
      if (e.altKey && e.key === "0") {
        e.preventDefault()
        handleResetZoom()
      }
      // Alt + H: 고대비 모드
      if (e.altKey && e.key === "h") {
        e.preventDefault()
        toggleHighContrast()
      }
      // Alt + S: 음성 출력
      if (e.altKey && e.key === "s") {
        e.preventDefault()
        handleSpeak()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [isOpen, zoomLevel, highContrast, isSpeaking])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-primary p-3 text-primary-foreground shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="접근성 도구 열기"
        title="접근성 도구 (Alt + A)"
      >
        <Keyboard className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 rounded-lg border bg-card p-4 shadow-lg"
      role="toolbar"
      aria-label="접근성 도구"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">접근성 도구</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          aria-label="접근성 도구 닫기"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {/* 화면 확대/축소 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">화면 확대/축소</span>
            <span className="text-xs text-muted-foreground">{zoomLevel}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              aria-label="화면 축소 (Alt + -)"
              title="화면 축소 (Alt + -)"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetZoom}
              aria-label="화면 크기 리셋 (Alt + 0)"
              title="화면 크기 리셋 (Alt + 0)"
            >
              {zoomLevel}%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              aria-label="화면 확대 (Alt + +)"
              title="화면 확대 (Alt + +)"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 고대비 모드 */}
        <Button
          variant={highContrast ? "default" : "outline"}
          size="sm"
          onClick={toggleHighContrast}
          className="w-full justify-start"
          aria-label="고대비 모드 전환 (Alt + H)"
          title="고대비 모드 전환 (Alt + H)"
        >
          <Contrast className="mr-2 h-4 w-4" />
          고대비 모드 {highContrast ? "ON" : "OFF"}
        </Button>

        {/* 음성 출력 */}
        <Button
          variant={isSpeaking ? "default" : "outline"}
          size="sm"
          onClick={handleSpeak}
          className="w-full justify-start"
          aria-label="음성 출력 (Alt + S)"
          title="음성 출력 (Alt + S)"
          disabled={!("speechSynthesis" in window)}
        >
          <Volume2 className="mr-2 h-4 w-4" />
          {isSpeaking ? "음성 출력 중지" : "음성 출력"}
        </Button>
      </div>

      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          단축키: Alt + A (열기/닫기), Alt + +/- (확대/축소), Alt + 0 (리셋), Alt + H (고대비), Alt + S (음성)
        </p>
      </div>
    </div>
  )
}

