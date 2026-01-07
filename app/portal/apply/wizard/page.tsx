import { ServiceApplicationWizard } from "@/components/features/application/ServiceApplicationWizard"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import { PortalHeader } from "@/components/layout/portal-header"

export default async function ApplyWizardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <PortalHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <ServiceApplicationWizard />
        </div>
      </main>
      <MobileBottomNav />
    </div>
  )
}
