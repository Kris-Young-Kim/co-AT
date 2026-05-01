import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('WEBHOOK_SECRET???¤ì •?˜ì? ?Šì•˜?µë‹ˆ??')
  }

  // ?¤ë”?ì„œ svix ?¤ë” ê°€?¸ì˜¤ê¸?  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('svix ?¤ë”ê°€ ?†ìŠµ?ˆë‹¤', { status: 400 })
  }

  // ë³¸ë¬¸ ê°€?¸ì˜¤ê¸?  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Webhook ê²€ì¦?  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Webhook ê²€ì¦??¤íŒ¨:', err)
    return new Response('Webhook ê²€ì¦??¤íŒ¨', { status: 400 })
  }

  const { id } = evt.data
  const eventType = evt.type

  const supabase = await createClient()

  // ? ì? ?ì„± ??Supabase profiles ?Œì´ë¸??™ê¸°??  if (eventType === 'user.created') {
    const { id: userId, email_addresses, first_name, last_name } = evt.data

    const fullName = [first_name, last_name].filter(Boolean).join(' ') || null
    const email = email_addresses?.[0]?.email_address || null

    const { error } = await supabase.from('profiles').insert({
      clerk_user_id: userId,
      email,
      full_name: fullName,
      role: 'user', // ê¸°ë³¸ê°?    } as any)

    if (error) {
      console.error('?„ë¡œ???ì„± ?¤íŒ¨:', error)
      return new Response('?„ë¡œ???ì„± ?¤íŒ¨', { status: 500 })
    }

    console.log('?„ë¡œ???ì„± ?±ê³µ:', userId)
  }

  // ë¡œê·¸???œë„ ì¶”ì 
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
        ? 'ë¡œê·¸???±ê³µ' 
        : '?¸ì…˜ ì¢…ë£Œ',
      metadata: {
        eventType,
        timestamp: new Date().toISOString(),
      },
    })
    if (logError) {
      console.error('[Security] ë¡œê·¸???œë„ ì¶”ì  ?¤íŒ¨:', logError)
    }
  }

  // ? ì? ?? œ ???•ë¦¬ ë¡œì§
  if (eventType === 'user.deleted') {
    const { id: userId } = evt.data

    // profiles ?Œì´ë¸”ì—???? œ (CASCADE ?¤ì •???°ë¼ ê´€???°ì´?°ë„ ?ë™ ?? œ)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('clerk_user_id', userId!)

    if (error) {
      console.error('?„ë¡œ???? œ ?¤íŒ¨:', error)
      return new Response('?„ë¡œ???? œ ?¤íŒ¨', { status: 500 })
    }

    console.log('?„ë¡œ???? œ ?±ê³µ:', userId)
  }

  return new Response('Webhook ì²˜ë¦¬ ?„ë£Œ', { status: 200 })
}

