import type { MetadataRoute } from "next";
import { HOLDING_PAGE, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

// App screens and private roster links are not for search engines.
export default function robots(): MetadataRoute.Robots {
  // While the holding page is up, nothing should be indexed.
  if (HOLDING_PAGE) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/week/", "/team/", "/settings/", "/welcome/", "/auth/", "/s/", "/r/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
