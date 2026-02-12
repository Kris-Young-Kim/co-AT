"use client"

import dynamic from "next/dynamic"
import { VercelAnalyticsProvider } from "@/components/providers/vercel-analytics-provider"

const AccessibilityToolbar = dynamic(
  () => import("@/components/accessibility/accessibility-toolbar").then((m) => ({ default: m.AccessibilityToolbar })),
  { ssr: false }
)

const KeyboardNavigator = dynamic(
  () => import("@/components/accessibility/keyboard-navigator").then((m) => ({ default: m.KeyboardNavigator })),
  { ssr: false }
)

export function ClientOnlyProviders() {
  return (
    <>
      <AccessibilityToolbar />
      <KeyboardNavigator />
      <VercelAnalyticsProvider />
    </>
  )
}
