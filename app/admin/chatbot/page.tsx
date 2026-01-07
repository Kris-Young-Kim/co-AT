import { redirect } from "next/navigation"

export default async function ChatbotPage() {
  // 챗봇은 이제 플로팅 버튼으로만 접근 가능하므로 대시보드로 리다이렉트
  redirect("/admin/dashboard")
}
