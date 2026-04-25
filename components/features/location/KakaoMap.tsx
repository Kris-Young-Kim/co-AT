"use client"

import { useEffect, useRef } from "react"

const LAT = 37.903616
const LNG = 127.741245

declare global {
  interface Window {
    naver: any
  }
}

export function KakaoMap() {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID

    const initMap = () => {
      if (!mapRef.current || !window.naver?.maps) return
      const { naver } = window

      const map = new naver.maps.Map(mapRef.current, {
        center: new naver.maps.LatLng(LAT, LNG),
        zoom: 16,
      })

      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(LAT, LNG),
        map,
      })

      const infoWindow = new naver.maps.InfoWindow({
        content: `
          <div style="padding:12px 16px;font-size:13px;line-height:1.6;min-width:200px;">
            <strong style="display:block;margin-bottom:2px;">강원특별자치도 보조기기센터</strong>
            <span style="color:#666;font-size:12px;">강원특별자치도 재활병원 2층</span>
          </div>
        `,
        borderWidth: 1,
        borderColor: "#ddd",
        anchorSize: new naver.maps.Size(10, 10),
      })

      infoWindow.open(map, marker)

      naver.maps.Event.addListener(marker, "click", () => {
        if (infoWindow.getMap()) {
          infoWindow.close()
        } else {
          infoWindow.open(map, marker)
        }
      })
    }

    if (window.naver?.maps) {
      initMap()
      return
    }

    const script = document.createElement("script")
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`
    script.async = true
    script.onload = initMap
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  return (
    <div
      ref={mapRef}
      className="w-full rounded-xl overflow-hidden border"
      style={{ height: "420px" }}
    />
  )
}
