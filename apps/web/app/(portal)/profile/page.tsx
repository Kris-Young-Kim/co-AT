import { getMyProfile } from '@/actions/portal-actions'
import { ProfileEditForm } from '@/components/features/portal/ProfileEditForm'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Info } from 'lucide-react'

export default async function ProfilePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const result = await getMyProfile()

  if (!result.success || !result.profile) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-responsive-xl font-bold text-foreground mb-6">내 정보</h1>
        <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/50 max-w-xl">
          <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            포털 계정이 아직 연결되지 않았습니다. 담당자에게 포털 연결을 요청해 주세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">내 정보</h1>
        <p className="text-muted-foreground text-sm">
          연락처, 주소, 보호자 정보를 직접 수정할 수 있습니다
        </p>
      </div>
      <ProfileEditForm profile={result.profile} />
    </div>
  )
}
