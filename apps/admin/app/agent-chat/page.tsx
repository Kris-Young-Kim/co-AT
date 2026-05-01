export const dynamic = 'force-dynamic'

import { hasAdminOrStaffPermission } from "@co-at/auth"
import { redirect } from "next/navigation"
import { AgentChat } from "@/components/features/chat/AgentChat"
import { Bot } from "lucide-react"

export const metadata = {
  title: "AI ?…ë¬´ ?„ìš°ë¯?| ê°•ì›??ë³´ì¡°ê¸°ê¸°?¼í„°",
  description: "AI ?¤ì??¤íŠ¸?ˆì´??ê¸°ë°˜ ?µí•© ?…ë¬´ ?„ìš°ë¯?,
}

export default async function AgentChatPage() {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) {
    redirect("/")
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">AI ?…ë¬´ ?„ìš°ë¯?/h1>
            <p className="text-sm text-muted-foreground">
              ?€?ì ê²€??Â· ?¼ì • ?•ì¸ Â· ?¬ê³  ì¡°íšŒ Â· ê·œì • ê²€??Â· ë¬¸ì„œ ?ì„±
            </p>
          </div>
        </div>
      </div>

      <AgentChat className="h-[calc(100vh-14rem)] sm:h-[calc(100vh-13rem)]" />
    </div>
  )
}
