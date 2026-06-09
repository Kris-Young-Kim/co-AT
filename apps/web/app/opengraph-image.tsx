import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "GWATC AX PLATFORM | 강원특별자치도 통합 관리 플랫폼"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  let fontData: ArrayBuffer | null = null
  try {
    fontData = await fetch(
      "https://fonts.gstatic.com/s/notosanskr/v36/PbyxFmXiEBPT4ITbgNA5Cgm20xz64px_1hVWr0wuPNGmlQNMEfD4.0.woff2"
    ).then((res) => res.arrayBuffer())
  } catch {
    // Proceed without custom font
  }

  const services = ["상담", "체험", "맞춤제작", "사후관리", "교육홍보"]

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "NotoSansKR, sans-serif",
          position: "relative",
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-120px",
            left: "-60px",
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            display: "flex",
          }}
        />

        {/* Top badge */}
        <div
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: "100px",
            padding: "8px 24px",
            color: "rgba(255,255,255,0.9)",
            fontSize: "18px",
            marginBottom: "32px",
            display: "flex",
          }}
        >
          강원특별자치도 공식 플랫폼
        </div>

        {/* Main title */}
        <div
          style={{
            color: "white",
            fontSize: "72px",
            fontWeight: "bold",
            textAlign: "center",
            lineHeight: 1.1,
            marginBottom: "20px",
            display: "flex",
          }}
        >
          GWATC AX PLATFORM
        </div>

        {/* Subtitle */}
        <div
          style={{
            color: "rgba(255,255,255,0.80)",
            fontSize: "30px",
            textAlign: "center",
            marginBottom: "52px",
            display: "flex",
          }}
        >
          보조기기 상담부터 사후관리까지 통합 케어
        </div>

        {/* Service tags */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {services.map((service) => (
            <div
              key={service}
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.30)",
                borderRadius: "12px",
                padding: "10px 24px",
                color: "white",
                fontSize: "22px",
                display: "flex",
              }}
            >
              {service}
            </div>
          ))}
        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: "absolute",
            bottom: "36px",
            color: "rgba(255,255,255,0.55)",
            fontSize: "20px",
            display: "flex",
          }}
        >
          gwatc.cloud
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "NotoSansKR", data: fontData, style: "normal", weight: 700 }]
        : [],
    }
  )
}
