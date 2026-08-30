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
        //
        // "/suche?" 🚨 der teuerste Pfad der Seite für Crawler — aber NUR mit Query.
        //
        // Die Route ist durch searchParams dynamisch (Function pro Request), lädt sechs
        // WordPress-Abfragen (Rechner, Vergleiche, Checklisten, Dokumente, Site-Settings,
        // Posts) und cached per `Netlify-Vary: query=q` PRO Suchbegriff. Jede neue Query
        // ist damit ein eigener Cache-Miss und eine eigene Function von rund drei
        // Sekunden. Netlify rechnet nach GB-Sekunden ab (231 GB-Hrs = 74 % der Rechnung
        // im August), und ein Bot, der Suchparameter durchprobiert, erzeugt davon
        // beliebig viele. Suchergebnisse zu einem Begriff gehören ohnehin nicht in den
        // Index (Thin Content).
        //
        // Bewusst MIT Fragezeichen und ohne Wildcard: Disallow ist präfixbasiert, das
        // trifft /suche?q=… und lässt /suche selbst frei. Ein pauschales "/suche" würde
        // dem Sitemap-Eintrag (app/sitemap.ts) widersprechen und in der Search Console
        // als "durch robots.txt blockiert" auflaufen — und weil die Seite kein noindex
        // trägt, könnte Google sie dann nicht einmal mehr sauber deindexieren.
        disallow: ["/api/", "/suche?"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
