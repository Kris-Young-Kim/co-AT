import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"
import { RegulationChatbot } from "@/components/features/chat/RegulationChatbot"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { embedRegulations } from "@/actions/rag-actions"
import { RegulationEmbedButton } from "@/components/features/chat/RegulationEmbedButton"

export default async function ChatbotPage() {
  const isDevelopment = process.env.NODE_ENV !== "production"
  
  if (!isDevelopment) {
    try {
      const hasPermission = await hasAdminOrStaffPermission()
      if (!hasPermission) {
        redirect("/")
      }
    } catch (error) {
      redirect("/")
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          규정 검색 챗봇
        </h1>
        <p className="text-muted-foreground">
          보조기기센터 운영 지침서를 기반으로 질문에 답변합니다
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 챗봇 메인 영역 */}
        <div className="lg:col-span-2">
          <RegulationChatbot />
        </div>

        {/* 사이드바: 벡터화 관리 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">문서 관리</CardTitle>
              <CardDescription>
                운영 지침서를 벡터화하여 검색 가능하게 만듭니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegulationEmbedButton />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">사용 팁</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• 구체적인 질문을 하면 더 정확한 답변을 받을 수 있습니다</p>
              <p>• 예시: "대여 기간은 얼마나 되나요?"</p>
              <p>• 예시: "수리비 한도는 얼마인가요?"</p>
              <p>• 예시: "맞춤제작 지원금은 얼마인가요?"</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
