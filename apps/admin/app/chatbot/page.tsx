import { redirect } from "next/navigation"

export default async function ChatbotPage() {
  // 챗봇은 실제 프로필 버튼으로만 접근 가능하므로 홈으로 리다이렉트
  redirect("/")
}
