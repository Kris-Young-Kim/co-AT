import { getClientById, getClientHistory } from "@/actions/client-actions"
import { ClientProfileCard } from "@/components/features/crm/ClientProfileCard"
import { ClientHistoryTable } from "@/components/features/crm/ClientHistoryTable"
import { IntakeRecordForm } from "@/components/features/intake/IntakeRecordForm"
import { ProcessLogForm } from "@/components/features/process/ProcessLogForm"
import { hasAdminOrStaffPermission } from "@co-at/auth"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface ClientDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  // ê¶Œí•œ ?•ì¸
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) {
    console.log("[?€?ì ?ì„¸] ê¶Œí•œ ?†ìŒ - ?ˆìœ¼ë¡?ë¦¬ë‹¤?´ë ‰??)
    redirect("/")
  }

  const { id } = await params

  // ?€?ì ?•ë³´ ì¡°íšŒ
  const clientResult = await getClientById(id)
  if (!clientResult.success || !clientResult.client) {
    notFound()
  }

  // ?œë¹„???´ë ¥ ì¡°íšŒ
  const historyResult = await getClientHistory(id)
  const history = historyResult.success ? historyResult.history || [] : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            ëª©ë¡?¼ë¡œ
          </Link>
        </Button>
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          ?€?ì ?ì„¸ ?•ë³´
        </h1>
        <p className="text-muted-foreground">
          {clientResult.client.name}?˜ì˜ ?ì„¸ ?•ë³´ ë°??œë¹„???´ìš© ?´ë ¥
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">ê¸°ë³¸ ?•ë³´</TabsTrigger>
          <TabsTrigger value="history">?œë¹„???´ë ¥</TabsTrigger>
          <TabsTrigger value="intake">?ë‹´ ê¸°ë¡</TabsTrigger>
          <TabsTrigger value="process">?œë¹„??ì§„í–‰ ê¸°ë¡</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ClientProfileCard client={clientResult.client} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <ClientHistoryTable history={history} />
        </TabsContent>

        <TabsContent value="intake" className="space-y-6">
          <IntakeRecordForm
            clientId={id}
            onSuccess={() => {
              // ?±ê³µ ??ì²˜ë¦¬ (?? ?˜ì´ì§€ ?ˆë¡œê³ ì¹¨)
              window.location.reload()
            }}
          />
        </TabsContent>

        <TabsContent value="process" className="space-y-6">
          <ProcessLogForm
            clientId={id}
            onSuccess={() => {
              // ?±ê³µ ??ì²˜ë¦¬ (?? ?˜ì´ì§€ ?ˆë¡œê³ ì¹¨)
              window.location.reload()
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}








