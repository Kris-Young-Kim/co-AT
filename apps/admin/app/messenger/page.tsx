import { ChatLayout } from '@/components/features/chat/team/ChatLayout'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '?…ë¬´ ë©”ì‹ ?€ | Co-AT',
}

export default function MessengerPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] p-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold">?…ë¬´ ë©”ì‹ ?€</h1>
        <p className="text-sm text-muted-foreground">?€ ì±„ë„ ê¸°ë°˜ ?¤ì‹œê°??…ë¬´ ì±„íŒ…</p>
      </div>
      <ChatLayout />
    </div>
  )
}
