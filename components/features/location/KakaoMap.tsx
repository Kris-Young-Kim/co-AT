"use client"

import { useEffect, useRef } from "react"

const KAKAO_APP_KEY = "7b1e46835619f4a875191c14e64b6476"
const LAT = 37.903616
const LNG = 127.741245

declare global {
  interface Window {
    kakao: any
  }
}

export function KakaoMap() {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.kakao?.maps) return
      const { kakao } = window
      const mapOption = {
        center: new kakao.maps.LatLng(LAT, LNG),
        level: 3,
      }
      const map = new kakao.maps.Map(mapRef.current, mapOption)

      const markerPosition = new kakao.maps.LatLng(LAT, LNG)
      const marker = new kakao.maps.Marker({ position: markerPosition })
      marker.setMap(map)

      const iwContent = `
        <div style="padding:10px 14px;font-size:13px;line-height:1.6;min-width:220px;">
          <strong style="display:block;margin-bottom:4px;">강원특별자치도 보조기기센터</strong>
          <span style="color:#666;font-size:12px;">강원특별자치도 재활병원 2층</span>
        </div>
      `
      const infowindow = new kakao.maps.InfoWindow({ content: iwContent, removable: true })
      kakao.maps.event.addListener(marker, "click", () => infowindow.open(map, marker))
      infowindow.open(map, marker)
    }

    if (window.kakao?.maps) {
      initMap()
      return
    }

    const script = document.createElement("script")
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false`
    script.async = true
    script.onload = () => window.kakao.maps.load(initMap)
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
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
