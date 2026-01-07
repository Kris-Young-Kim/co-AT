"use client"

import { useState, useEffect } from "react"
import { PublicDeviceCard } from "./PublicDeviceCard"
import { type InventoryItem } from "@/actions/inventory-actions"
import { getPublicInventoryList } from "@/actions/inventory-actions"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function PublicDeviceList() {
  const [devices, setDevices] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: "all" as string,
    is_rental_available: "all" as string,
    category: "all" as string,
  })

  const loadDevices = async () => {
    setIsLoading(true)
    try {
      const params: {
        status?: string
        is_rental_available?: boolean
        category?: string
        limit?: number
      } = {
        limit: 100,
      }

      if (filters.status !== "all") {
        params.status = filters.status
      }

      if (filters.is_rental_available === "true") {
        params.is_rental_available = true
      } else if (filters.is_rental_available === "false") {
        params.is_rental_available = false
      }

      if (filters.category !== "all") {
        params.category = filters.category
      }

      const data = await getPublicInventoryList(params)
      setDevices(data)
    } catch (error) {
      console.error("[PublicDeviceList] 재고 조회 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDevices()
  }, [filters])

  // 실시간 업데이트를 위한 폴링 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      loadDevices()
    }, 30000)

    return () => clearInterval(interval)
  }, [filters])

  return (
    <div className="space-y-6">
      {/* 필터 */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">상태</label>
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="보관">보관 중</SelectItem>
              <SelectItem value="대여중">대여 중</SelectItem>
              <SelectItem value="수리중">수리 중</SelectItem>
              <SelectItem value="소독중">소독 중</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">대여 가능 여부</label>
          <Select
            value={filters.is_rental_available}
            onValueChange={(value) => setFilters({ ...filters, is_rental_available: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="true">대여 가능</SelectItem>
              <SelectItem value="false">대여 불가</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">카테고리</label>
          <Select
            value={filters.category}
            onValueChange={(value) => setFilters({ ...filters, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="휠체어">휠체어</SelectItem>
              <SelectItem value="보행기">보행기</SelectItem>
              <SelectItem value="목발">목발</SelectItem>
              <SelectItem value="지팡이">지팡이</SelectItem>
              <SelectItem value="기타">기타</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={loadDevices}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              새로고침
            </>
          ) : (
            "새로고침"
          )}
        </Button>
      </div>

      {/* 목록 */}
      {isLoading && devices.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">등록된 보조기기가 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {devices.map((device) => (
            <PublicDeviceCard key={device.id} device={device} />
          ))}
        </div>
      )}
    </div>
  )
}
