"use client"

import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * Î∏åÎ†à?úÌÅ¨???§ÎπÑÍ≤åÏù¥??Ïª¥Ìè¨?åÌä∏
 * Íµ¨Ï°∞?îÎêú ?∞Ïù¥??Schema.org BreadcrumbList) ?¨Ìï®
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const pathname = usePathname()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gwatc.cloud"

  // Íµ¨Ï°∞?îÎêú ?∞Ïù¥???ùÏÑ±
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "??,
        item: baseUrl,
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: item.label,
        item: `${baseUrl}${item.href}`,
      })),
    ],
  }

  return (
    <>
      {/* Íµ¨Ï°∞?îÎêú ?∞Ïù¥??(JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <nav
        aria-label="Î∏åÎ†à?úÌÅ¨??
        className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}
      >
        <Link
          href="/"
          className="hover:text-foreground transition-colors flex items-center gap-1"
          aria-label="?àÏúºÎ°??¥Îèô"
        >
          <Home className="h-4 w-4" />
        </Link>
        {items.map((item, index) => (
          <div key={item.href} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            {index === items.length - 1 ? (
              <span className="text-foreground font-medium" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </>
  )
}
