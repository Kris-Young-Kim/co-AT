// components/features/inventory/GroupedDeviceCard.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { type GroupedDevice } from "@/actions/inventory-actions"
import Image from "next/image"
import { Package } from "lucide-react"

interface GroupedDeviceCardProps {
  device: GroupedDevice
}

export function GroupedDeviceCard({ device }: GroupedDeviceCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* 이미지 */}
      <div className="relative w-full h-48 bg-muted">
        {device.image_url ? (
          <Image
            src={device.image_url}
            alt={device.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="h-16 w-16 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* 정보 */}
      <CardContent className="p-4">
        <h3 className="font-semibold text-base mb-1 line-clamp-2">{device.name}</h3>
        {(device.manufacturer || device.model) && (
          <p className="text-xs text-muted-foreground mb-3">
            {[device.manufacturer, device.model].filter(Boolean).join(" ")}
          </p>
        )}

        {/* 재고 현황 */}
        <div className="space-y-1.5 text-sm border-t pt-3">
          <div className="flex justify-between font-medium">
            <span className="text-muted-foreground">총 보유</span>
            <span>{device.total}대</span>
          </div>
          {device.stored > 0 && (
            <div className="flex justify-between">
              <span className="text-green-600">대여가능</span>
              <span className="font-medium text-green-600">{device.stored}대</span>
            </div>
          )}
          {device.rented > 0 && (
            <div className="flex justify-between">
              <span className="text-blue-600">대여중</span>
              <span className="font-medium text-blue-600">{device.rented}대</span>
            </div>
          )}
          {device.repairing > 0 && (
            <div className="flex justify-between">
              <span className="text-yellow-600">수리중</span>
              <span className="font-medium text-yellow-600">{device.repairing}대</span>
            </div>
          )}
          {device.cleaning > 0 && (
            <div className="flex justify-between">
              <span className="text-purple-600">소독중</span>
              <span className="font-medium text-purple-600">{device.cleaning}대</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
