import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gwatc.cloud"

export const metadata: Metadata = {
  title: "?ë‹´ ë°??•ë³´?œê³µ",
  description: "?„í™”ë¥??µí•œ ë³´ì¡°ê¸°ê¸° ?ë‹´ ë°??•ë³´ ?œê³µ ?œë¹„?¤ì? ?¤ì–‘??ë³´ì¡°ê¸°ê¸°ë¥?ì§ì ‘ ì²´í—˜?´ë³¼ ???ˆëŠ” ì²´í—˜ ?œë¹„?¤ë? ?œê³µ?©ë‹ˆ??",
  openGraph: {
    title: "?ë‹´ ë°??•ë³´?œê³µ | GWATC ë³´ì¡°ê¸°ê¸°?¼í„°",
    description: "?„í™”ë¥??µí•œ ë³´ì¡°ê¸°ê¸° ?ë‹´ ë°??•ë³´ ?œê³µ ?œë¹„?¤ì? ?¤ì–‘??ë³´ì¡°ê¸°ê¸°ë¥?ì§ì ‘ ì²´í—˜?´ë³¼ ???ˆëŠ” ì²´í—˜ ?œë¹„?¤ë? ?œê³µ?©ë‹ˆ??",
    url: `${baseUrl}/services/consultation`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/services/consultation`,
  },
}

export default function ConsultationPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "ì£¼ìš”?¬ì—…", href: "/services" },
          { label: "?ë‹´ ë°??•ë³´?œê³µ", href: "/services/consultation" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        ?ë‹´ ë°??•ë³´?œê³µ
      </h1>
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
        <div className="grid gap-6 md:grid-cols-2 mt-8">
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-3">ì½œì„¼??/h2>
            <p className="text-sm text-muted-foreground">
              ?„í™”ë¥??µí•œ ë³´ì¡°ê¸°ê¸° ?ë‹´ ë°??•ë³´ ?œê³µ ?œë¹„?¤ì…?ˆë‹¤.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-3">ì²´í—˜</h2>
            <p className="text-sm text-muted-foreground">
              ?¤ì–‘??ë³´ì¡°ê¸°ê¸°ë¥?ì§ì ‘ ì²´í—˜?´ë³¼ ???ˆëŠ” ?œë¹„?¤ì…?ˆë‹¤.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

