import { getChannels } from '@/actions/channel-actions'
import { EmailChannelCard } from '@/components/channels/EmailChannelCard'
import { KakaoChannelCard } from '@/components/channels/KakaoChannelCard'

export default async function ChannelsPage() {
  const channels = await getChannels()
  const emailChannel = channels?.find(c => c.channel_type === 'email')

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">채널 설정</h1>
        <p className="text-sm text-gray-500 mt-1">알림 발송 채널을 설정합니다.</p>
      </div>
      <div className="space-y-4">
        {emailChannel && (
          <EmailChannelCard channel={{
            channel_type:   emailChannel.channel_type,
            is_enabled:     emailChannel.is_enabled,
            config:         emailChannel.config as { apiKey?: string; fromEmail?: string } | null,
            last_tested_at: emailChannel.last_tested_at,
          }} />
        )}
        <KakaoChannelCard />
      </div>
    </div>
  )
}
