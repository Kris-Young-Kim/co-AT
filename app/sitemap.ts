import { MetadataRoute } from "next"
import { getRecentNotices } from "@/actions/notice-actions"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gwatc.cloud"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ?•ì  ?˜ì´ì§€??  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services/consultation`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services/exhibition`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services/custom-support`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services/aftercare`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services/education-promotion`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/notices`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/info`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/info/government-support`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/info/devices`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ]

  // ?™ì  ?˜ì´ì§€: ê³µì??¬í•­
  let noticePages: MetadataRoute.Sitemap = []
  try {
    const notices = await getRecentNotices(100) // ìµœë? 100ê°?ê³µì??¬í•­ ?¬í•¨
    noticePages = notices.map((notice) => ({
      url: `${baseUrl}/notices/${notice.id}`,
      lastModified: new Date(notice.created_at),
      changeFrequency: "weekly" as const,
      priority: notice.is_pinned ? 0.8 : 0.6,
    }))
  } catch (error) {
    console.error("[Sitemap] ê³µì??¬í•­ ì¡°íšŒ ?¤íŒ¨:", error)
  }

  return [...staticPages, ...noticePages]
}
