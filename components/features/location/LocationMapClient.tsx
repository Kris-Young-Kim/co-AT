"use client"

import dynamic from "next/dynamic"

const KakaoMap = dynamic(
  () => import("@/components/features/location/KakaoMap").then((m) => ({ default: m.KakaoMap })),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full rounded-xl border bg-muted animate-pulse"
        style={{ height: "420px" }}
      />
    ),
  }
)

export function LocationMapClient() {
  return <KakaoMap />
}
