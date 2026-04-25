// components/features/inventory/PublicDeviceList.tsx
"use client"

import { useState, useEffect } from "react"
import { GroupedDeviceCard } from "./GroupedDeviceCard"
import { type GroupedDevice, getGroupedInventoryForPublic } from "@/actions/inventory-actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Search } from "lucide-react"

export function PublicDeviceList() {
  const [devices, setDevices] = useState<GroupedDevice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState("")

  const loadDevices = async () => {
    setIsLoading(true)
    try {
      const data = await getGroupedInventoryForPublic()
      setDevices(data)
    } catch (error) {
      console.error("[PublicDeviceList] 재고 조회 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDevices()
  }, [])

  // 30초마다 실시간 갱신
  useEffect(() => {
    const interval = setInterval(loadDevices, 30000)
    return () => clearInterval(interval)
  }, [])

  const filtered = devices.filter(
    (d) =>
      d.name.replace(/\s/g, "").toLowerCase().includes(query.replace(/\s/g, "").toLowerCase()) ||
      (d.category ?? "").toLowerCase().includes(query.toLowerCase()) ||
      (d.manufacturer ?? "").toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* 검색 + 새로고침 */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="기기명, 카테고리, 제조사 검색"
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={loadDevices} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "새로고침"}
        </Button>
      </div>

      {/* 목록 */}
      {isLoading && devices.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {query ? "검색 결과가 없습니다." : "등록된 보조기기가 없습니다."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((device, i) => (
            <GroupedDeviceCard key={`${device.name}-${i}`} device={device} />
          ))}
        </div>
      )}
    </div>
  )
}
