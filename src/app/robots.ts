import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

// App screens and private roster links are not for search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/week/", "/team/", "/welcome/", "/auth/", "/s/", "/r/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
