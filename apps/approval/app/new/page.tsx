import { getVehicles } from '@/actions/approval-actions'
import NewDocumentForm from './NewDocumentForm'

export default async function NewDocumentPage() {
  const vehicles = await getVehicles()
  return <NewDocumentForm vehicles={vehicles} />
}
