import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { OnboardingForm } from "./OnboardingForm"

export default async function OnboardingPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await currentUser()
  const meta = user?.publicMetadata as { birth_date?: string }
  if (meta?.birth_date) redirect("/mypage")

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">프로필 설정</h1>
          <p className="text-sm text-muted-foreground">
            서비스 이용을 위해 이름과 생년월일을 입력해 주세요.
            <br />
            담당자가 본인 확인 후 서비스 이력을 연결해 드립니다.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  )
}
