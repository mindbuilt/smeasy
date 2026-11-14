import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { guides } from "@/content/guides";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/guides/`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/faq/`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contact/`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/privacy/`, changeFrequency: "yearly", priority: 0.3 },
    ...guides.map((g) => ({ url: `${SITE_URL}/guides/${g.slug}/`, lastModified: g.updated, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
