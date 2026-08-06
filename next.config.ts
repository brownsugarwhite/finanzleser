import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import { legacyRedirects } from "./lib/redirects.generated";
import { manualRedirects } from "./lib/redirects.manual";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist"],
  experimental: {
    // IONOS-Shared-Hosting ist unter Build-Last fragil. Da Artikel/Hauptkategorien jetzt
    // on-demand sind (kein Build-Prerender), ist die Build-Last wieder auf dem zuvor
    // funktionierenden Niveau (~Tool-Seiten). Retry fängt vereinzelte 5xx ab.
    staticGenerationRetryCount: 3,
  },
  // pdfjs lädt seinen (Fake-)Worker per dynamischem Import nach — der wird vom
  // File-Tracing nicht erkannt und fehlt sonst in der Netlify-Function. Für die
  // Routen, die zur Laufzeit PDFs parsen, explizit mitkopieren.
  outputFileTracingIncludes: {
    "/api/checkliste-data/[slug]": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
    "/finanztools/checklisten/[slug]": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },
  async redirects() {
    return [
      // Tool-Übersichts-Kurzpfade → /finanztools/* (ersetzen die früheren SSR-Stub-Pages,
      // die pro Aufruf eine Function-Invocation kosteten; hier = CDN-Redirect).
      { source: "/rechner", destination: "/finanztools/rechner", permanent: true },
      { source: "/vergleiche", destination: "/finanztools/vergleiche", permanent: true },
      { source: "/checklisten", destination: "/finanztools/checklisten", permanent: true },
      // 301 Redirects für zusammengefasste Beiträge (42)
      { source: "/aktienfonds", destination: "/finanzen/altersvorsorge/fondsgebundene-lebensversicherung", permanent: true },
      { source: "/annuitaetendarlehen", destination: "/finanzen/kredite-bauen/kredite", permanent: true },
      { source: "/beitragsbemessungsgrenze", destination: "/versicherungen/sozialversicherung/beitragsbemessungsgrenzen", permanent: true },
      { source: "/beitragsbemessungsgrenze-krankenversicherung", destination: "/versicherungen/sozialversicherung/beitragsbemessungsgrenzen", permanent: true },
      { source: "/beitragsbemessungsgrenze-rentenversicherung", destination: "/versicherungen/sozialversicherung/beitragsbemessungsgrenzen", permanent: true },
      { source: "/beitragssaetze", destination: "/versicherungen/sozialversicherung/beitragsbemessungsgrenzen", permanent: true },
      { source: "/berufskleidung-von-der-steuer-absetzen", destination: "/steuern/steuererklaerung/arbeitskleidung-von-der-steuer-absetzen", permanent: true },
      { source: "/berufsunfaehigkeitsversicherung-fuer-auszubildende", destination: "/versicherungen/berufsunfaehigkeit/berufsunfaehigkeitsversicherung", permanent: true },
      { source: "/berufsunfaehigkeitsversicherung-fuer-beamte", destination: "/versicherungen/berufsunfaehigkeit/berufsunfaehigkeitsversicherung", permanent: true },
      { source: "/berufsunfaehigkeitsversicherung-fuer-studenten", destination: "/versicherungen/berufsunfaehigkeit/berufsunfaehigkeitsversicherung", permanent: true },
      { source: "/berufsunfaehigkeitsversicherung-mit-vorerkrankungen", destination: "/versicherungen/berufsunfaehigkeit/berufsunfaehigkeitsversicherung", permanent: true },
      { source: "/betriebsrente", destination: "/versicherungen/altersvorsorge/betriebliche-altersversorgung", permanent: true },
      { source: "/computer-von-der-steuer-absetzen", destination: "/steuern/steuererklaerung/arbeitsmittel", permanent: true },
      { source: "/darlehen", destination: "/finanzen/kredite-bauen/kredite", permanent: true },
      { source: "/erwerbsunfaehigkeitsrente", destination: "/versicherungen/berufsunfaehigkeit/erwerbsminderungsrente", permanent: true },
      { source: "/investmentfonds", destination: "/finanzen/altersvorsorge/fondsgebundene-lebensversicherung", permanent: true },
      { source: "/krankengeld-fuer-selbststaendige", destination: "/versicherungen/krankenversicherung/krankengeld", permanent: true },
      { source: "/krankenkassenbeitrag", destination: "/versicherungen/krankenversicherung/krankenversicherungsbeitraege", permanent: true },
      { source: "/kredit-sondertilgung", destination: "/finanzen/kredite-bauen/kredite", permanent: true },
      { source: "/kuendigung-gesetzliche-krankenkasse", destination: "/recht/arbeitsrecht/kuendigung-krankenversicherung", permanent: true },
      { source: "/kuendigung-private-krankenversicherung", destination: "/recht/arbeitsrecht/kuendigung-krankenversicherung", permanent: true },
      { source: "/lebensversicherung-beitragsfrei", destination: "/versicherungen/altersvorsorge/lebensversicherung", permanent: true },
      { source: "/lebensversicherung-kuendigen", destination: "/versicherungen/altersvorsorge/lebensversicherung", permanent: true },
      { source: "/lebensversicherung-verkaufen", destination: "/versicherungen/altersvorsorge/lebensversicherung", permanent: true },
      { source: "/mischfonds", destination: "/finanzen/altersvorsorge/fondsgebundene-lebensversicherung", permanent: true },
      { source: "/perde-op-versicherung", destination: "/versicherungen/tierversicherungen/pferdeversicherung", permanent: true },
      { source: "/pferdekrankenversicherung-vergleich", destination: "/versicherungen/tierversicherungen/pferdeversicherung", permanent: true },
      { source: "/pflegeversicherung-krankenkasse", destination: "/versicherungen/pflegeversicherung/pflegeversicherung", permanent: true },
      { source: "/private-krankenversicherung-arbeitslose", destination: "/versicherungen/krankenversicherung/private-krankenversicherung", permanent: true },
      { source: "/private-krankenversicherung-beamte", destination: "/versicherungen/krankenversicherung/private-krankenversicherung", permanent: true },
      { source: "/private-krankenversicherung-kinder", destination: "/versicherungen/krankenversicherung/private-krankenversicherung", permanent: true },
      { source: "/private-krankenversicherung-rentner", destination: "/versicherungen/krankenversicherung/private-krankenversicherung", permanent: true },
      { source: "/private-rentenversicherung", destination: "/versicherungen/altersvorsorge/rentenversicherung", permanent: true },
      { source: "/ratenkredit", destination: "/finanzen/kredite-bauen/kredite", permanent: true },
      { source: "/reiseruecktrittsversicherung", destination: "/versicherungen/krankenversicherung/reiseversicherung", permanent: true },
      { source: "/rentenfonds", destination: "/finanzen/altersvorsorge/fondsgebundene-lebensversicherung", permanent: true },
      { source: "/steuererklaerung-2025", destination: "/steuern/steuerarten/steuererklaerung", permanent: true },
      { source: "/steuerformulare-2025", destination: "/steuern/steuerarten/steuerformulare-2024", permanent: true },
      { source: "/steuerformulare", destination: "/steuern/steuerarten/steuerformulare-2024", permanent: true },
      { source: "/steuerklassenwahl", destination: "/steuern/steuererklaerung/steuerklassen", permanent: true },
      { source: "/steuerklassenwechsel", destination: "/steuern/steuererklaerung/steuerklassen", permanent: true },
      { source: "/steuersoftware-steuererklaerung", destination: "/steuern/steuererklaerung/elster", permanent: true },
      // HINWEIS: KEINE Groß-/Klein-Redirects für Legal-Seiten (/Datenschutz → /datenschutz).
      // Next.js matcht Redirect-`source` case-INSENSITIV → eine solche Regel fängt AUCH die
      // korrekte lowercase-URL und redirectet sie auf sich selbst = Endlos-Loop (308×∞).
      // Der CleverReach-DOI-Link ist auf lowercase umgestellt; kapitalisierte Alt-Links
      // müssten via Middleware (pathname !== toLowerCase) behandelt werden, nicht hier.
      // Manuell kuratierte Redirects (GSC-Arbeitsliste 2026-08-06) — VOR den generierten,
      // damit sie deren ungenaue Übersichts-Ziele überschreiben (erster Treffer gewinnt).
      ...manualRedirects,
      // Auto-generierte Legacy-Flach-URL-Redirects (~642) für konsolidierte/entfallene
      // Beiträge & Tools. Quelle: scripts/generate-legacy-redirects.mjs → lib/redirects.generated.ts.
      // Review: scripts/output/legacy-redirects.review.txt (medium/low confidence prüfen).
      ...legacyRedirects,
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "finanzleser.local",
        port: "",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "www.finanzleser.de",
        port: "",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "staging.finanzleser.de",
        port: "",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
  async rewrites() {
    // Endgültig entfernte Alt-Inhalte ohne Nachfolger → 410 Gone (URL bleibt, Status
    // kommt aus app/api/gone). redirects() kann kein 410; rewrite behält den Pfad.
    const GONE = [
      "/aenderungen-2019",
      "/ampel-kabinett-nach-73-tagen-im-amt",
      "/neue-regelungen-ab-juli-2025",
      "/neue-gesetzes-und-pflichtaenderungen-ab-2026",
      "/hochwasserschutz-kann-fuer-europa-kostspielig-werden",
    ];
    return GONE.map((source) => ({ source, destination: "/api/gone" }));
  },
  async headers() {
    // /suche ist durch searchParams dynamisch (Function pro Request). Der Durable-Cache
    // pro ?q= fängt Wiederholungs-Queries (v. a. Bots) ohne Function ab. Browser-Cache
    // bleibt aus (Next setzt für dynamische Seiten private/no-cache — korrekt).
    const sucheCache = {
      source: "/suche",
      headers: [
        { key: "Netlify-CDN-Cache-Control", value: "public, durable, s-maxage=900, stale-while-revalidate=86400" },
        { key: "Netlify-Vary", value: "query=q" },
      ],
    };
    // Staging: noindex für die ganze Site (env-basiert, nicht branch-basiert)
    const isStaging = process.env.NEXT_PUBLIC_SITE_URL?.includes("staging.");
    if (!isStaging) return [sucheCache];
    return [
      sucheCache,
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
