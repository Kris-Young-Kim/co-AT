"use client"

import { useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

/**
 * Analytics와 SpeedInsights를 마운트 후에만 렌더.
 * Vercel Speed Insights가 DOM을 수정해 hydration 불일치(React #418)를 유발하는 이슈 방지.
 * @see https://github.com/vercel/speed-insights/issues/89
 */
export function VercelAnalyticsProvider() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
