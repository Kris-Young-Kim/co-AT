import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok', app: 'automation', timestamp: new Date().toISOString() })
}
