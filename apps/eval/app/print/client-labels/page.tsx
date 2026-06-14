import { getAllClientsForLabels } from '@/actions/client-actions'
import { ClientLabelsPrintPage } from '@/eval/components/print/ClientLabelsPrintPage'

export default async function ClientLabelsPage() {
  const result = await getAllClientsForLabels()
  const clients = result.success ? result.clients ?? [] : []

  return <ClientLabelsPrintPage clients={clients} />
}
