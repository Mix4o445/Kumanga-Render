import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep private / authenticated / non-content routes out of the index.
        disallow: [
          "/admin",
          "/settings",
          "/support",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/my-uploads",
          "/favorites",
          "/upload",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
