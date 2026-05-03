import { Mail, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface Channel {
  channel_type: string
  is_enabled: boolean
}

export function ChannelStatus({ channels }: { channels: Channel[] }) {
  const email = channels.find(c => c.channel_type === 'email')

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500">채널:</span>
      <Link href="/channels" className="flex items-center gap-1.5 text-sm">
        <Mail className="w-4 h-4" />
        <span className={email?.is_enabled ? 'text-green-600 font-medium' : 'text-gray-400'}>
          이메일 {email?.is_enabled ? '활성' : '비활성'}
        </span>
      </Link>
      <Link href="/channels" className="flex items-center gap-1.5 text-sm">
        <MessageSquare className="w-4 h-4" />
        <span className="text-gray-300">카카오 준비 중</span>
      </Link>
    </div>
  )
}
