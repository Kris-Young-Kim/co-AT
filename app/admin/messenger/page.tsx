import { ChatLayout } from '@/components/features/chat/team/ChatLayout'

export const metadata = {
  title: '업무 메신저 | Co-AT',
}

export default function MessengerPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] p-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold">업무 메신저</h1>
        <p className="text-sm text-muted-foreground">팀 채널 기반 실시간 업무 채팅</p>
      </div>
      <ChatLayout />
    </div>
  )
}
