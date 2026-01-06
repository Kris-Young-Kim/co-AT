"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Calendar, Building2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import type { ReusableDevice } from "@/actions/inventory-actions"

interface HomeReusableDevicesProps {
  devices: ReusableDevice[]
}

export function HomeReusableDevices({ devices }: HomeReusableDevicesProps) {
  if (devices.length === 0) {
    return (
      <section id="reusable-devices" className="py-12 sm:py-16 md:py-24 bg-muted/30 scroll-mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-responsive-xl font-bold text-center text-foreground mb-8 sm:mb-12">
            재사용(기증) 기기 목록
          </h2>
          <Card>
            <CardContent className="p-8 sm:p-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">
                현재 대여 가능한 기증 기기가 없습니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    )
  }

  return (
    <section id="reusable-devices" className="py-12 sm:py-16 md:py-24 bg-muted/30 scroll-mt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <h2 className="text-responsive-xl font-bold text-foreground">
            재사용(기증) 기기 목록
          </h2>
          <Link href="/info/reusable-devices">
            <Button variant="outline" size="sm">
              전체 보기
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {devices.map((device) => (
            <Card key={device.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 line-clamp-2">
                      {device.name}
                    </h3>
                    {device.category && (
                      <Badge variant="secondary" className="text-xs">
                        {device.category}
                      </Badge>
                    )}
                  </div>
                  <Package className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {device.manufacturer && device.model && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="line-clamp-1">
                        {device.manufacturer} {device.model}
                      </span>
                    </div>
                  )}

                  {device.purchase_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(device.purchase_date), "yyyy년 MM월", { locale: ko })}
                      </span>
                    </div>
                  )}

                  {device.asset_code && (
                    <p className="text-xs text-muted-foreground/70">
                      자산번호: {device.asset_code}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Link href={`/portal/apply?category=custom&device_id=${device.id}`}>
                    <Button className="w-full" size="sm">
                      대여 신청
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

