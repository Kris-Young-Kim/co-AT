"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * 키보드 네비게이션을 위한 스캔 모드 컴포넌트
 * Tab 키로 모든 포커스 가능한 요소를 순차적으로 탐색할 수 있도록 지원
 */
export function KeyboardNavigator() {
  const [isScanMode, setIsScanMode] = useState(false)
  const [currentFocusIndex, setCurrentFocusIndex] = useState(0)

  useEffect(() => {
    // 스캔 모드 활성화/비활성화 (Alt + K)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "k") {
        e.preventDefault()
        setIsScanMode((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [])

  // 스캔 모드일 때 모든 포커스 가능한 요소 찾기
  useEffect(() => {
    if (!isScanMode) {
      setCurrentFocusIndex(0)
      return
    }

    const updateFocusableElements = () => {
      const focusableElements = document.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )

      const handleTab = (e: KeyboardEvent) => {
        if (e.key === "Tab") {
          e.preventDefault()
          
          const elementsArray = Array.from(focusableElements) as HTMLElement[]
          
          setCurrentFocusIndex((prev) => {
            let newIndex: number
            
            if (e.shiftKey) {
              // Shift + Tab: 이전 요소
              newIndex = prev > 0 ? prev - 1 : elementsArray.length - 1
            } else {
              // Tab: 다음 요소
              newIndex = prev < elementsArray.length - 1 ? prev + 1 : 0
            }
            
            // 포커스 적용
            const element = elementsArray[newIndex]
            if (element) {
              element.focus()
              element.scrollIntoView({ behavior: "smooth", block: "center" })
            }
            
            return newIndex
          })
        }

        // Escape: 스캔 모드 종료
        if (e.key === "Escape") {
          setIsScanMode(false)
          setCurrentFocusIndex(0)
        }
      }

      window.addEventListener("keydown", handleTab)
      return () => window.removeEventListener("keydown", handleTab)
    }

    const cleanup = updateFocusableElements()
    
    // DOM 변경 감지를 위한 MutationObserver
    const observer = new MutationObserver(() => {
      // 포커스 가능한 요소가 변경되면 인덱스 리셋
      setCurrentFocusIndex(0)
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      cleanup()
      observer.disconnect()
    }
  }, [isScanMode])

  // 스캔 모드 인디케이터
  if (isScanMode) {
    return (
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm font-medium shadow-lg"
        role="status"
        aria-live="polite"
      >
        키보드 스캔 모드 활성화 (Tab: 다음, Shift+Tab: 이전, Esc: 종료)
      </div>
    )
  }

  return null
}

