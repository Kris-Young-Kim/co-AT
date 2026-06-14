import { getClientById } from '@/actions/client-actions'
import { PrintButton } from '@/eval/components/print/PrintButton'
import { notFound } from 'next/navigation'
import { ClientLabelView } from '@/eval/components/print/ClientLabelView'

interface Props {
  params: Promise<{ clientId: string }>
}

export default async function ClientLabelPrintPage({ params }: Props) {
  const { clientId } = await params
  const result = await getClientById(clientId)
  if (!result.success || !result.client) notFound()

  const client = result.client
  const qrToken = (client as any).qr_token as string | undefined
  if (!qrToken) notFound()

  return (
    <>
      <div className="fixed top-4 right-4 no-print z-10">
        <PrintButton />
      </div>
      <ClientLabelView
        clients={[{
          id: client.id,
          name: client.name,
          birth_date: client.birth_date ?? null,
          registration_number: (client as any).registration_number ?? null,
          qr_token: qrToken,
        }]}
      />
    </>
  )
}
