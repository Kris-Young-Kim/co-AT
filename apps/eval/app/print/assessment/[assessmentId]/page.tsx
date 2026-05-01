import { getDomainAssessmentById } from '@/actions/assessment-actions'
import { getClientById } from '@/actions/client-actions'
import { AssessmentPrintView } from '@/eval/components/print/AssessmentPrintView'
import { PrintButton } from '@/eval/components/print/PrintButton'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface AssessmentPrintPageProps {
  params: Promise<{ assessmentId: string }>
}

export default async function AssessmentPrintPage({ params }: AssessmentPrintPageProps) {
  const { assessmentId } = await params

  const assessmentResult = await getDomainAssessmentById(assessmentId)
  if (!assessmentResult.success || !assessmentResult.assessment) notFound()

  const assessment = assessmentResult.assessment
  const supabase = await createClient()
  const { data: app } = await supabase
    .from('applications')
    .select('client_id')
    .eq('id', assessment.application_id)
    .single()
  if (!app) notFound()

  const clientResult = await getClientById((app as { client_id: string }).client_id)
  if (!clientResult.success || !clientResult.client) notFound()

  return (
    <>
      <PrintButton />
      <AssessmentPrintView assessment={assessment} client={clientResult.client} />
    </>
  )
}
