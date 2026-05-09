import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'

interface Props {
  params: Promise<{ qr_token: string }>
}

export default async function QrScanPage({ params }: Props) {
  const { qr_token } = await params
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('inventory')
    .select('id')
    .eq('qr_token', qr_token)
    .single()

  if (!data) notFound()
  redirect(`/devices/${data.id}`)
}
