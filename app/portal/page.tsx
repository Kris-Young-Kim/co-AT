import { redirect } from "next/navigation"

export default function PortalPage() {
  // /portal 접근 시 /portal/mypage로 리다이렉트
  redirect("/portal/mypage")
}
