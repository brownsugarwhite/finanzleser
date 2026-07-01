import type { Metadata, Viewport } from "next";
import { Open_Sans, Merriweather } from "next/font/google";
import { Providers } from "./providers";
import { NavProvider } from "@/lib/NavContext";
import { getNavItems, getSiteSettings, getMegamenuPreload } from "@/lib/wordpress";
import BookmarkNav from "@/components/layout/BookmarkNav";
import LogoBar from "@/components/layout/LogoBar";
import TopNav from "@/components/layout/TopNav";
import ContentScaler from "@/components/layout/ContentScaler";
import MegaMenuWrapper from "@/components/layout/MegaMenuWrapper";
import FinanztoolsMenu from "@/components/layout/FinanztoolsMenu";
import PoweredByLine from "@/components/ui/PoweredByLine";
import ProgressiveBlur from "@/components/ui/ProgressiveBlur";
import LeoIcon from "@/components/ui/LeoIcon";
import TopBanner from "@/components/ui/TopBanner";
import LandingBodyAttr from "@/components/ui/LandingBodyAttr";
import RouteChangeRefresh from "@/components/ui/RouteChangeRefresh";
import MorphTransitionLayer from "@/components/sections/MorphTransitionLayer";
import { PageTransitionProvider } from "@/lib/usePageTransition";
import { JsonLd, organizationSchema, websiteSchema } from "@/components/seo/JsonLd";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, DEFAULT_OG_IMAGE } from "@/lib/seo";
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
  const [navItems, siteSettings, megamenuPreload] = await Promise.all([
    getNavItems(),
    getSiteSettings(),
    getMegamenuPreload().catch(() => ({})),
  ]);

  return (
    <html lang="de" className={`${openSans.variable} ${merriweather.variable}`}>
      {/* suppressHydrationWarning: das Inline-Script unten setzt data-landing VOR der
          Hydration → bewusste Abweichung zur SSR-HTML, kein echter Mismatch. */}
      <body className="antialiased" suppressHydrationWarning>
        {/* No-FOUC: data-landing synchron VOR dem Paint setzen, damit landing-spezifisches
            CSS (sticky-nav aus, Newsletter, Dotline, Logo-Claim, Mobile-Fixes) schon beim
            ersten Paint greift. LandingBodyAttr hält es danach für SPA-Navigation in Sync. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(location.pathname==='/')document.body.setAttribute('data-landing','')}catch(e){}`,
          }}
        />
        <LandingBodyAttr />
        <RouteChangeRefresh />
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
        <TopBanner
          text={siteSettings.top_banner.text}
          linkType={siteSettings.top_banner.link_type}
          linkValue={siteSettings.top_banner.link_value}
          visibility={siteSettings.top_banner.visibility}
        />
        {/* Mobile-only Leo Dock-Slot — sticky top-left, gegenüber Bookmark.
            Position direkt nach TopBanner im Flow, sticky ab top:13px.
            Leo wird zur Laufzeit per JS hier rein-/rausreparented. */}
        <div id="leo-dock-slot-mobile" />
        <Providers>
        <NavProvider items={navItems}>
        <PageTransitionProvider>
          <div className="bookmark-section">
            <div className="bookmark-section__inner"><BookmarkNav /></div>
          </div>
          <LogoBar />
          <TopNav />
          {/* DotLine + „powered by" auf den Nicht-Landing-Seiten (auf der Landing ist
              .sticky-nav ausgeblendet; dort rendert LandingIntro Dotline + Quicklinks).
              Hier KEINE Quicklinks und KEIN Pfeil (nur Landing), max-width 90vw. */}
          <div className="sticky-nav dotline-animated">
            <PoweredByLine style={{ width: "100%", maxWidth: "90vw", paddingLeft: 280, paddingRight: 50 }} />
          </div>
          <ContentScaler />
          <MegaMenuWrapper preloaded={megamenuPreload} />
          <FinanztoolsMenu />
          <div className="scalable-content">
            {children}
          </div>
          <MorphTransitionLayer />
          <ProgressiveBlur height={120} />
          <LeoIcon />
        </PageTransitionProvider>
        </NavProvider>
        </Providers>
      </body>
    </html>
  );
}
