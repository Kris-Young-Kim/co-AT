"use client"

import { useState } from "react"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { Search, Package, Info } from "lucide-react"

const devices = [
  { id: 1, name: "[지원가능] 목발", available: true },
  { id: 2, name: "[지원가능] 실내용보행보조차 (워커-CK07)", available: true },
  { id: 3, name: "[지원가능] 수동휠체어", available: true },
]

export default function ReusableDevicesPage() {
  const [query, setQuery] = useState("")

  const filtered = devices.filter((d) =>
    d.name.replace(/\s/g, "").toLowerCase().includes(query.replace(/\s/g, "").toLowerCase())
  )

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "보조기기 정보", href: "/info" },
          { label: "재사용 보조기기", href: "/info/reusable-devices" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-8">재사용 보조기기</h1>

      {/* 검색창 */}
      <div className="mb-3">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="보조기기 이름을 검색하세요"
            className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* 검색 팁 */}
      <div className="flex items-start gap-2 mb-6 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold text-foreground">지원가능</span> 문구를 검색창에 입력하시면,
          신청 가능한 재사용 보조기기를 한눈에 보실 수 있습니다.
        </p>
      </div>

      {/* 목록 */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((device) => (
            <div
              key={device.id}
              className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white"
            >
              {/* 이미지 영역 */}
              <div className="bg-muted/40 flex items-center justify-center" style={{ height: "160px" }}>
                <Package className="h-12 w-12 text-muted-foreground/40" />
              </div>
              {/* 정보 */}
              <div className="p-3">
                {device.available && (
                  <span className="inline-block text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded mb-1">
                    지원가능
                  </span>
                )}
                <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                  {device.name.replace("[지원가능] ", "")}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Search className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  )
}
