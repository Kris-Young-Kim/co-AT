import { ServiceApplicationWizard } from "@/components/features/application/ServiceApplicationWizard"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function ApplyPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <ServiceApplicationWizard />
    </div>
  )
}

