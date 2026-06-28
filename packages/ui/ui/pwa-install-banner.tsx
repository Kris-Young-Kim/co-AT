'use client'

import { useState, useEffect } from 'react'

const DISMISSED_KEY = 'pwa-install-dismissed'

export function PwaInstallBanner() {
  const [showIos, setShowIos] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY) === 'true') {
      setDismissed(true)
      return
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) return

    const ua = navigator.userAgent
    const isIos = /iphone|ipad|ipod/i.test(ua)
    const isInStandaloneIos = 'standalone' in navigator && (navigator as { standalone?: boolean }).standalone
    if (isIos && !isInStandaloneIos) {
      setShowIos(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> })
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setDismissed(true)
    setShowIos(false)
    setDeferredPrompt(null)
  }

  const installAndroid = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    dismiss()
  }

  if (dismissed) return null

  if (showIos) {
    return (
      <div role="banner" className="fixed bottom-0 inset-x-0 bg-white border-t shadow-lg p-4 flex items-center justify-between z-50">
        <p className="text-sm">홈 화면에 추가하면 앱처럼 사용할 수 있어요.</p>
        <button aria-label="닫기" onClick={dismiss} className="ml-4 text-gray-400 text-xl leading-none">×</button>
      </div>
    )
  }

  if (deferredPrompt) {
    return (
      <div role="banner" className="fixed bottom-0 inset-x-0 bg-white border-t shadow-lg p-4 flex items-center justify-between z-50">
        <p className="text-sm">앱으로 설치하면 더 빠르게 사용할 수 있어요.</p>
        <div className="flex gap-2 ml-4">
          <button onClick={installAndroid} className="text-sm text-blue-600 font-medium">설치</button>
          <button aria-label="닫기" onClick={dismiss} className="text-gray-400 text-xl leading-none">×</button>
        </div>
      </div>
    )
  }

  return null
}
