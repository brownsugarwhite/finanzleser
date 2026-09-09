import type { Metadata, Viewport } from "next";
import { Open_Sans, Merriweather } from "next/font/google";
import { getNavItems, getSiteSettings, getMegamenuPreload } from "@/lib/wordpress";
import LandingBodyAttr from "@/components/ui/LandingBodyAttr";
import { JsonLd, organizationSchema, websiteSchema } from "@/components/seo/JsonLd";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { FADEN_AKTIV } from "@/lib/faden/flag";
import { getFadenOptionen } from "@/lib/faden/optionen";
import Huelle from "@/components/layout/Huelle";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  axes: ["wdth"],
});

const merriweather = Merriweather({
  variable: "--font-heading",
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
  const [navItems, siteSettings, megamenuPreload, fadenOptionen] = await Promise.all([
    getNavItems(),
    // Nur die alte Hülle braucht sie (TopBanner). Im Faden entfällt damit ein REST-Aufruf
    // je Render; die Werbeschalter holt sich ArticleLayout im Nicht-Faden-Zweig selbst.
    FADEN_AKTIV ? Promise.resolve(null) : getSiteSettings(),
    getMegamenuPreload().catch(() => ({})),
    // Level-Stufen für das Punktekonto; nur im Faden (Produktion ohne Schalter fragt nichts Neues ab).
    // Fangnetz erlaubt (CLAUDE.md, Falle 2, Ausnahme): reine Verbesserung, keine Existenz-Entscheidung —
    // ohne Antwort gelten die Standardstufen, und kein 404/Canonical hängt daran.
    FADEN_AKTIV ? getFadenOptionen().catch(() => null) : Promise.resolve(null),
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
        <Huelle navItems={navItems} megamenuPreload={megamenuPreload} siteSettings={siteSettings} level={fadenOptionen?.level}>
          {children}
        </Huelle>
      </body>
    </html>
  );
}
