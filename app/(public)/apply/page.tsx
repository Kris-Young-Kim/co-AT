import type { Metadata } from "next"
import { ApplicationGuide } from "@/components/features/application/ApplicationGuide"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <ApplicationGuide />
    </div>
  )
}
