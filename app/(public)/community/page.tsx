import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gwatc.cloud"

export const metadata: Metadata = {
  title: "ì»¤ë??ˆí‹°",
  description: "ê°•ì›?¹ë³„?ì¹˜??ë³´ì¡°ê¸°ê¸°?¼í„°??ê³µì??¬í•­, ?œë™ê°¤ëŸ¬ë¦? ë³´ì¡°ê¸°ê¸° ?œë¹„???¬ë? ??ì»¤ë??ˆí‹° ?•ë³´ë¥??•ì¸?˜ì„¸??",
  openGraph: {
    title: "ì»¤ë??ˆí‹° | GWATC ë³´ì¡°ê¸°ê¸°?¼í„°",
    description: "ê°•ì›?¹ë³„?ì¹˜??ë³´ì¡°ê¸°ê¸°?¼í„°??ê³µì??¬í•­, ?œë™ê°¤ëŸ¬ë¦? ë³´ì¡°ê¸°ê¸° ?œë¹„???¬ë? ??ì»¤ë??ˆí‹° ?•ë³´ë¥??•ì¸?˜ì„¸??",
    url: `${baseUrl}/community`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/community`,
  },
}

export default function CommunityPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb items={[{ label: "ì»¤ë??ˆí‹°", href: "/community" }]} className="mb-6" />
      <h1 className="text-responsive-xl font-bold text-foreground mb-6">
        ì»¤ë??ˆí‹°
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
        <a
          href="/notices"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">ê³µì??¬í•­</h2>
          <p className="text-sm text-muted-foreground">
            ?¼í„°??ì£¼ìš” ê³µì??¬í•­???•ì¸?˜ì„¸??
          </p>
        </a>
        <a
          href="/community/gallery"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">?œë™ê°¤ëŸ¬ë¦?/h2>
          <p className="text-sm text-muted-foreground">
            ?¼í„°???¤ì–‘???œë™ ?¬ì§„???•ì¸?˜ì„¸??
          </p>
        </a>
        <a
          href="/community/cases"
          className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">ë³´ì¡°ê¸°ê¸° ?œë¹„???¬ë?</h2>
          <p className="text-sm text-muted-foreground">
            ?¤ì œ ?œë¹„???¬ë?ë¥??•ì¸?˜ì„¸??
          </p>
        </a>
      </div>
    </div>
  )
}

