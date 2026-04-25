"use client"

const partners = [
  { name: "보건복지부", href: "https://www.mohw.go.kr" },
  { name: "강원특별자치도", href: "http://www.provin.gangwon.kr" },
  { name: "국립재활원 중앙보조기기센터", href: "https://knat.go.kr/" },
  { name: "강원특별자치도재활병원", href: "https://www.grh.or.kr/" },
  { name: "보조기기 열린플랫폼", href: "http://www.nrc.go.kr/at_rd/web/index.do" },
  { name: "지역장애인보건의료센터", href: "http://www.grhm.or.kr/" },
]

// 무한 루프를 위해 3번 복제
const repeated = [...partners, ...partners, ...partners]

export function HomePartnerMarquee() {
  return (
    <section className="border-t border-b bg-muted/30 py-5 overflow-hidden">
      <div className="container mb-3 px-4 sm:px-6">
        <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">
          협력기관
        </p>
      </div>

      {/* 마퀴 래퍼 */}
      <div className="relative overflow-hidden">
        {/* 좌우 페이드 */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-background to-transparent" />

        <div className="flex animate-marquee gap-12 w-max">
          {repeated.map((partner, i) => (
            <a
              key={i}
              href={partner.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 whitespace-nowrap group shrink-0"
            >
              {/* 컬러 도트 */}
              <span className="w-2 h-2 rounded-full bg-primary/50 group-hover:bg-primary transition-colors shrink-0" />
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {partner.name}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
