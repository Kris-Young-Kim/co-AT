import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: '?¸ì¦ ?„ìš”' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: '?Œì¼???†ìŠµ?ˆë‹¤' }, { status: 400 })
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: '?Œì¼ ?¬ê¸°??20MB ?´í•˜?¬ì•¼ ?©ë‹ˆ?? }, { status: 400 })
  }

  const supabase = createAdminClient()
  const ext = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${ext}`
  const isImage = file.type.startsWith('image/')

  const { data, error } = await supabase.storage
    .from('chat-files')
    .upload(fileName, file, { contentType: file.type, upsert: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from('chat-files')
    .getPublicUrl(data.path)

  return NextResponse.json({
    url: urlData.publicUrl,
    name: file.name,
    size: file.size,
    type: isImage ? 'image' : 'file',
  })
}
