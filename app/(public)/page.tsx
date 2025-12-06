import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative flex min-h-[70vh] sm:min-h-[80vh] items-center justify-center overflow-hidden">
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
          <p className="text-responsive-lg text-white/95 drop-shadow-md mb-2 sm:mb-4">
            GWATC 통합 케어 플랫폼
          </p>
          <p className="text-responsive text-white/90 drop-shadow-sm mb-6 sm:mb-8 max-w-2xl mx-auto">
            행정은 AI에게, 사람은 클라이언트에게
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="text-base sm:text-lg px-6 sm:px-8">
              <Link href="/portal/mypage">
                서비스 이용하기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base sm:text-lg px-6 sm:px-8 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
              <Link href="/notices">
                공지사항 보기
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-responsive-xl font-bold text-center text-foreground mb-8 sm:mb-12">
            주요 서비스
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="p-6 sm:p-8 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                보조기기 대여
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                필요한 보조기기를 쉽고 빠르게 대여할 수 있습니다.
              </p>
            </div>
            <div className="p-6 sm:p-8 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                맞춤 상담
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                전문가와 함께 최적의 보조기기를 찾아드립니다.
              </p>
            </div>
            <div className="p-6 sm:p-8 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                사후 관리
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                대여 후에도 지속적인 관리와 지원을 제공합니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
