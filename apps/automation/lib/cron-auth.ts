import { NextResponse } from 'next/server'

export function verifyCronSecret(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) return null // no secret configured — allow (dev mode)
  const auth = request.headers.get('Authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
