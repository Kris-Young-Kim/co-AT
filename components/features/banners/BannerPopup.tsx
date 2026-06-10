"use client"

import { useEffect, useState } from "react"
import { X, ExternalLink } from "lucide-react"
import type { Banner } from "@/actions/banner-actions"

interface BannerPopupProps {
  banners: Banner[]
}

const DISMISS_PREFIX = "banner_dismissed_"

function getDismissKey(id: string) {
  return `${DISMISS_PREFIX}${id}`
}

function isBannerDismissed(id: string): boolean {
  try {
    const value = localStorage.getItem(getDismissKey(id))
    if (!value) return false
    return value === new Date().toISOString().slice(0, 10)
  } catch {
    return false
  }
}

function dismissBannerForToday(id: string) {
  try {
    localStorage.setItem(getDismissKey(id), new Date().toISOString().slice(0, 10))
  } catch {
    // ignore
  }
}

export function BannerPopup({ banners }: BannerPopupProps) {
  const [visible, setVisible] = useState<Banner[]>([])
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const toShow = banners.filter((b) => !isBannerDismissed(b.id))
    setVisible(toShow)
    setCurrent(0)
  }, [banners])

  if (visible.length === 0) return null

  const banner = visible[current]
  if (!banner) return null

  function handleClose() {
    setVisible((prev) => {
      const next = prev.filter((b) => b.id !== banner.id)
      if (current >= next.length) setCurrent(Math.max(0, next.length - 1))
      return next
    })
  }

  function handleDismissToday() {
    dismissBannerForToday(banner.id)
    handleClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 z-10"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        {banner.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner.image_url}
            alt={banner.title}
            className="w-full max-h-64 object-cover"
          />
        )}

        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 pr-6">{banner.title}</h2>
          {banner.content && (
            <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{banner.content}</p>
          )}
          {banner.link_url && (
            <a
              href={banner.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {banner.link_label ?? "자세히 보기"}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <div className="flex items-center justify-between border-t px-6 py-3 bg-gray-50">
          <button
            onClick={handleDismissToday}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
          >
            오늘 하루 보지 않기
          </button>
          {visible.length > 1 && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <button
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="px-2 py-0.5 rounded border disabled:opacity-30 hover:bg-gray-100"
              >
                이전
              </button>
              <span>{current + 1} / {visible.length}</span>
              <button
                onClick={() => setCurrent((c) => Math.min(visible.length - 1, c + 1))}
                disabled={current === visible.length - 1}
                className="px-2 py-0.5 rounded border disabled:opacity-30 hover:bg-gray-100"
              >
                다음
              </button>
            </div>
          )}
          <button
            onClick={handleClose}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
