import type { Metadata, Viewport } from "next";
import { Open_Sans, Merriweather } from "next/font/google";
import { getNavItems, getSiteSettings, getMegamenuPreload } from "@/lib/wordpress";
import LandingBodyAttr from "@/components/ui/LandingBodyAttr";
import { JsonLd, organizationSchema, websiteSchema } from "@/components/seo/JsonLd";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { FADEN_AKTIV } from "@/lib/faden/flag";
import { getWerkzeugZahlen } from "@/lib/faden/werkzeugIndex";
import { getFadenOptionen } from "@/lib/faden/optionen";
import Huelle from "@/components/layout/Huelle";
import "./globals.css";

/**
 * 🚨 Die Variablennamen enden bewusst auf `-src` und heißen NICHT `--font-body`.
 *
 * next/font schreibt sie als Klassenregel auf <html>: `.__variable_x { --font-body: … }`.
 * app/tokens.css setzt auf demselben Element `:root { --font-body: var(--font-body, "Open
 * Sans", sans-serif) }`. Beide Regeln haben dieselbe Spezifität — es entscheidet die
 * Reihenfolge der Stylesheets. Gewinnt tokens.css, verweist die Eigenschaft auf sich
 * selbst; das ist laut Spezifikation ungültig, und zwar OHNE auf den Ersatzwert
 * zurückzufallen. Ergebnis: --font-body ist leer, alles fällt auf System-Sans und 16 px
 * zurück, Überschriften eingeschlossen.
 *
 * Genau das ist beim Aufteilen der Layout-Hüllen passiert: die Chunk-Reihenfolge kippte,
 * das Schrift-Stylesheet stand plötzlich VOR globals.css. Mit zwei verschiedenen Namen
 * gibt es weder Kollision noch Selbstbezug, und die Reihenfolge spielt keine Rolle mehr.
 */
const openSans = Open_Sans({
  variable: "--font-body-src",
  subsets: ["latin"],
  display: "swap",
  axes: ["wdth"],
});

const merriweather = Merriweather({
  variable: "--font-heading-src",
  subsets: ["latin"],
  display: "swap",
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz", "wdth"],
});


export const viewport: Viewport = {};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – Steuern, Finanzen, Versicherungen`,
    template: `%s`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Finconext GmbH" }],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} – Steuern, Finanzen, Versicherungen`,
    description: SITE_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} – Steuern, Finanzen, Versicherungen`,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [navItems, siteSettings, megamenuPreload, fadenOptionen, heroZahlen] = await Promise.all([
    getNavItems(),
    // Nur die alte Hülle braucht sie (TopBanner). Im Faden entfällt damit ein REST-Aufruf
    // je Render; die Werbeschalter holt sich ArticleLayout im Nicht-Faden-Zweig selbst.
    FADEN_AKTIV ? Promise.resolve(null) : getSiteSettings(),
    getMegamenuPreload().catch(() => ({})),
    // Level-Stufen für das Punktekonto; nur im Faden (Produktion ohne Schalter fragt nichts Neues ab).
    // Fangnetz erlaubt (CLAUDE.md, Falle 2, Ausnahme): reine Verbesserung, keine Existenz-Entscheidung —
    // ohne Antwort gelten die Standardstufen, und kein 404/Canonical hängt daran.
    FADEN_AKTIV ? getFadenOptionen().catch(() => null) : Promise.resolve(null),
    // Zahlen für den Landing-Hero. Der Hero gehört der Hülle, nicht der Startseite —
    // er bleibt oben im Faden stehen, auch wenn der Leser weiterblättert.
    FADEN_AKTIV ? getWerkzeugZahlen() : Promise.resolve(undefined),
  ]);

  return (
    <html lang="de" className={`${openSans.variable} ${merriweather.variable}`}>
      {/* suppressHydrationWarning: das Inline-Script unten setzt data-landing VOR der
          Hydration → bewusste Abweichung zur SSR-HTML, kein echter Mismatch. */}
      <body className={"antialiased" + (FADEN_AKTIV ? " faden-body" : "")} suppressHydrationWarning>
        {/* No-FOUC: data-landing synchron VOR dem Paint setzen, damit landing-spezifisches
            CSS (sticky-nav aus, Newsletter, Dotline, Logo-Claim, Mobile-Fixes) schon beim
            ersten Paint greift. LandingBodyAttr hält es danach für SPA-Navigation in Sync. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(location.pathname==='/')document.body.setAttribute('data-landing','')}catch(e){}`,
          }}
        />
        <LandingBodyAttr />
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
        {/* Die Weiche steckt in einer Client-Komponente — nur dort teilt next/dynamic den
            Chunk. Siehe components/layout/Huelle.tsx. */}
        <Huelle navItems={navItems} megamenuPreload={megamenuPreload} siteSettings={siteSettings} level={fadenOptionen?.level} heroZahlen={heroZahlen}>
          {children}
        </Huelle>
      </body>
    </html>
  );
}
