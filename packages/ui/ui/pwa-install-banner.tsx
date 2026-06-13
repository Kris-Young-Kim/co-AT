'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY = 'pwa-install-dismissed'

export function PwaInstallBanner() {
  const [show, setShow] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') return
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const ua = navigator.userAgent
    const iosDevice = /iPhone|iPad|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream

    if (iosDevice) {
      // @ts-expect-error navigator.standalone is iOS Safari only
      if (navigator.standalone === false) {
        setIsIos(true)
        setShow(true)
      }
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setShow(false)
  }

  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    if (result.outcome === 'accepted') {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-start gap-3 rounded-xl bg-white p-4 shadow-lg ring-1 ring-black/10 sm:left-auto sm:right-4 sm:w-80">
      <div className="flex-1 text-sm">
        {isIos ? (
          <p className="text-gray-700">
            홈 화면에 앱으로 추가하려면
            <br />
            하단 공유 버튼(⬆)을 탭한 후
            <br />
            <strong>[홈 화면에 추가]</strong>를 선택하세요.
          </p>
        ) : (
          <>
            <p className="font-medium text-gray-900">앱으로 설치</p>
            <p className="mt-0.5 text-gray-500">
              홈 화면에 추가하면 더 빠르게 이용할 수 있어요.
            </p>
          </>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        {!isIos && (
          <button
            onClick={install}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            설치
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="닫기"
          className="text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
