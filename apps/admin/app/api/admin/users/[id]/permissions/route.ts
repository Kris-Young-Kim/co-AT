import { clerkClient } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { hasManagerPermission } from "@co-at/auth"
import { APP_KEYS, type AppKey, type UserRole } from "@co-at/types"
import { NextResponse } from "next/server"

const VALID_ROLES: UserRole[] = ['user', 'staff', 'manager', 'admin']
const VALID_APP_KEYS = Object.values(APP_KEYS)

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await hasManagerPermission()) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { id } = await params
  const supabase = createAdminClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('clerk_user_id, role')
    .eq('id', id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
  }

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(profile.clerk_user_id)
  const meta = clerkUser.publicMetadata as { role?: string; apps?: string[] }

  return NextResponse.json({
    role: meta.role ?? profile.role,
    apps: meta.apps ?? [],
  })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await hasManagerPermission()) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { id } = await params
  const { role, apps } = await req.json() as { role: UserRole; apps: AppKey[] }

  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: '유효하지 않은 역할입니다' }, { status: 400 })
  }
  if (!Array.isArray(apps) || apps.some(a => !VALID_APP_KEYS.includes(a))) {
    return NextResponse.json({ error: '유효하지 않은 앱 키가 포함되어 있습니다' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('clerk_user_id')
    .eq('id', id)
    .single()

  if (fetchError || !profile) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
  }

  const [supabaseResult, clerkResult] = await Promise.allSettled([
    supabase.from('profiles').update({ role }).eq('id', id),
    (async () => {
      const client = await clerkClient()
      return client.users.updateUserMetadata(profile.clerk_user_id, {
        publicMetadata: { role, apps },
      })
    })(),
  ])

  if (supabaseResult.status === 'rejected') {
    return NextResponse.json({ error: 'Supabase 역할 업데이트 실패', details: String(supabaseResult.reason) }, { status: 500 })
  }
  if (clerkResult.status === 'rejected') {
    return NextResponse.json({ error: 'Clerk 메타데이터 업데이트 실패', details: String(clerkResult.reason) }, { status: 500 })
  }

  return NextResponse.json({ success: true, role, apps })
}
