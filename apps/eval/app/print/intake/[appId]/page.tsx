import { getIntakeRecordsByApplication } from '@/actions/intake-actions'
import { getClientById } from '@/actions/client-actions'
import { IntakePrintView } from '@/eval/components/print/IntakePrintView'
import { PrintButton } from '@/eval/components/print/PrintButton'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface IntakePrintPageProps {
  params: Promise<{ appId: string }>
}

export default async function IntakePrintPage({ params }: IntakePrintPageProps) {
  const { appId } = await params

  const intakeResult = await getIntakeRecordsByApplication(appId)
  if (!intakeResult.success || !intakeResult.records?.length) notFound()

  const supabase = await createClient()
  const { data: app } = await supabase.from('applications').select('client_id').eq('id', appId).single()
  if (!app) notFound()

  const clientResult = await getClientById((app as { client_id: string }).client_id)
  if (!clientResult.success || !clientResult.client) notFound()

  return (
    <>
      <PrintButton />
      <IntakePrintView intake={intakeResult.records[0]} client={clientResult.client} />
    </>
  )
}
