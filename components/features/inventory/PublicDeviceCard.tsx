"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type InventoryItem } from "@/actions/inventory-actions"
import Image from "next/image"
import { Package, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface PublicDeviceCardProps {
  device: InventoryItem
}

export function PublicDeviceCard({ device }: PublicDeviceCardProps) {
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "보관":
        return "bg-green-500"
      case "대여중":
        return "bg-blue-500"
      case "수리중":
        return "bg-yellow-500"
      case "소독중":
        return "bg-purple-500"
      case "폐기":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusLabel = (status: string | null) => {
    return status || "알 수 없음"
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
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
            <Package className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge
            className={cn(
              "text-white",
              getStatusColor(device.status)
            )}
          >
            {getStatusLabel(device.status)}
          </Badge>
        </div>
        {device.is_rental_available && (
          <div className="absolute top-2 left-2">
            <Badge variant="default" className="bg-primary">
              대여 가능
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{device.name}</h3>
        <div className="space-y-1 text-sm text-muted-foreground">
          {device.category && (
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              <span>{device.category}</span>
            </div>
          )}
          {device.manufacturer && device.model && (
            <div>
              {device.manufacturer} {device.model}
            </div>
          )}
          {device.asset_code && (
            <div className="text-xs">
              자산번호: {device.asset_code}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
