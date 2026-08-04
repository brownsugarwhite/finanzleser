import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /_next/ NICHT blockieren: Google braucht /_next/static + /_next/image zum Rendern.
        // /test/ + /components/ existieren nicht mehr (Routen entfernt) — Disallow-Einträge
        // würden nur interne Struktur verraten, ohne etwas zu schützen.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
