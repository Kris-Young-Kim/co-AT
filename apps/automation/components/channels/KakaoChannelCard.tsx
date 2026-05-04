import { MessageSquare } from 'lucide-react'
import { Badge } from '@co-at/ui/badge'

export function KakaoChannelCard() {
  return (
    <div className="bg-white rounded-lg border p-6 opacity-60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-50 p-2 rounded-md"><MessageSquare className="w-5 h-5 text-yellow-600" /></div>
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              카카오 알림톡
              <Badge variant="secondary" className="text-xs">준비 중</Badge>
            </h3>
            <p className="text-xs text-gray-500">카카오 비즈니스 채널 심사 후 연동 예정</p>
          </div>
        </div>
      </div>
    </div>
  )
}
