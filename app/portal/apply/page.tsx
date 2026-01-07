import type { Metadata } from "next"
import { ApplicationGuide } from "@/components/features/application/ApplicationGuide"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import { PortalHeader } from "@/components/layout/portal-header"

export const metadata: Metadata = {
  title: "보조기기 신청 안내",
  description: "보조기기 센터 서비스 신청 안내 페이지입니다.",
}

export default async function ApplyPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <PortalHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <ApplicationGuide />
        </div>
      </main>
      <MobileBottomNav />
    </div>
  )
}
