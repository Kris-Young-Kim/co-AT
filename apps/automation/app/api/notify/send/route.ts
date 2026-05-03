import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { requireRole } from '@co-at/auth'
import { ROLES } from '@co-at/types'
import { sendManualNotification } from '@/actions/notify-actions'
import { createLog } from '@/actions/log-actions'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = await requireRole(ROLES.ADMIN)
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as {
    userIds: string[]
    title: string
    body: string
    link?: string
  }

  if (!body.userIds?.length || !body.title || !body.body) {
    return NextResponse.json({ error: 'userIds, title, body are required' }, { status: 400 })
  }

  const result = await sendManualNotification({
    userIds: body.userIds,
    title:   body.title,
    body:    body.body,
    link:    body.link,
  })

  await createLog({
    jobName:      'manual-send',
    triggeredBy:  'manual',
    status:       result.failCount === 0 ? 'success' : result.successCount > 0 ? 'partial' : 'failed',
    totalSent:    result.successCount + result.failCount,
    successCount: result.successCount,
    failCount:    result.failCount,
    channel:      'in-app',
    metadata:     { title: body.title, targetCount: body.userIds.length },
  })

  return NextResponse.json(result)
}
