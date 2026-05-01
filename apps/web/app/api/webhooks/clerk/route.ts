import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('WEBHOOK_SECRET이 설정되지 않았습니다.')
  }

  // 헤더에서 svix 헤더 가져오기
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('svix 헤더가 없습니다', { status: 400 })
  }

  // 본문 가져오기
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Webhook 검증
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Webhook 검증 실패:', err)
    return new Response('Webhook 검증 실패', { status: 400 })
  }

  const { id } = evt.data
  const eventType = evt.type

  const supabase = await createClient()

  // 유저 생성 시 Supabase profiles 테이블 동기화
  if (eventType === 'user.created') {
    const { id: userId, email_addresses, first_name, last_name } = evt.data

    const fullName = [first_name, last_name].filter(Boolean).join(' ') || null
    const email = email_addresses?.[0]?.email_address || null

    const { error } = await supabase.from('profiles').insert({
      clerk_user_id: userId,
      email,
      full_name: fullName,
      role: 'user', // 기본값
    } as any)

    if (error) {
      console.error('프로필 생성 실패:', error)
      return new Response('프로필 생성 실패', { status: 500 })
    }

    console.log('프로필 생성 성공:', userId)
  }

  // 로그인 시도 추적
  if (eventType === 'session.created' || eventType === 'session.ended') {
    const { id: userId } = evt.data
    const adminSupabase = createAdminClient()
    const headerPayload = await headers()
    const ip = headerPayload.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               headerPayload.get('x-real-ip') || 
               'unknown'
    const userAgent = headerPayload.get('user-agent') || 'unknown'

    const { error: logError } = await adminSupabase.from('security_logs' as any).insert({
      event_type: eventType === 'session.created' ? 'login_success' : 'login_attempt',
      severity: 'low',
      clerk_user_id: userId,
      ip_address: ip,
      user_agent: userAgent,
      request_path: '/api/webhooks/clerk',
      threat_description: eventType === 'session.created' 
        ? '로그인 성공' 
        : '세션 종료',
      metadata: {
        eventType,
        timestamp: new Date().toISOString(),
      },
    })
    if (logError) {
      console.error('[Security] 로그인 시도 추적 실패:', logError)
    }
  }

  // 유저 삭제 시 정리 로직
  if (eventType === 'user.deleted') {
    const { id: userId } = evt.data

    // profiles 테이블에서 삭제 (CASCADE 설정에 따라 관련 데이터도 자동 삭제)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('clerk_user_id', userId!)

    if (error) {
      console.error('프로필 삭제 실패:', error)
      return new Response('프로필 삭제 실패', { status: 500 })
    }

    console.log('프로필 삭제 성공:', userId)
  }

  return new Response('Webhook 처리 완료', { status: 200 })
}

