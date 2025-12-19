import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HomeHeroSection() {
  return (
    <section id="hero" className="relative flex min-h-[70vh] sm:min-h-[80vh] items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1709127347874-3f4674be5bc8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MTYyMzB8MHwxfHNlYXJjaHw0fHxhc3Npc3RpdmUlMjB0ZWNobm9sb2d5JTIwY2FyZSUyMHN1cHBvcnR8ZW58MHwwfHx8MTc2NTAzNjU1Mnww&ixlib=rb-4.1.0&q=80&w=1920"
          alt="보조기기센터 케어 지원"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Dark Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-responsive-xl font-bold text-white drop-shadow-lg mb-4 sm:mb-6">
          Co-AT
        </h1>
        <p className="text-responsive-lg text-white/90 drop-shadow-sm mb-6 sm:mb-8 max-w-2xl mx-auto">
          행정은 AI에게, 사람은 클라이언트에게
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg" className="text-base sm:text-lg px-6 sm:px-8">
            <Link href="/portal/mypage">
              서비스 이용하기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="text-base sm:text-lg px-6 sm:px-8 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
          >
            <Link href="/notices">공지사항 보기</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

