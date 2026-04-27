import type { Metadata, Viewport } from "next";
import { Open_Sans, Merriweather } from "next/font/google";
import { Providers } from "./providers";
import { NavProvider } from "@/lib/NavContext";
import { getNavItems } from "@/lib/wordpress";
import BookmarkNav from "@/components/layout/BookmarkNav";
import LogoBar from "@/components/layout/LogoBar";
import TopNav from "@/components/layout/TopNav";
import ContentScaler from "@/components/layout/ContentScaler";
import MegaMenuWrapper from "@/components/layout/MegaMenuWrapper";
import FinanztoolsMenu from "@/components/layout/FinanztoolsMenu";
import PoweredByLine from "@/components/ui/PoweredByLine";
import ProgressiveBlur from "@/components/ui/ProgressiveBlur";
import MayaIcon from "@/components/ui/MayaIcon";
import TopBanner from "@/components/ui/TopBanner";
import LandingBodyAttr from "@/components/ui/LandingBodyAttr";
import RouteChangeRefresh from "@/components/ui/RouteChangeRefresh";
import ArticlePreviewProvider from "@/components/sections/ArticlePreviewProvider";
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


export const viewport: Viewport = {
  viewportFit: "cover",
};

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
  const navItems = await getNavItems();

  return (
    <html lang="de" className={`${openSans.variable} ${merriweather.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <LandingBodyAttr />
        <RouteChangeRefresh />
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
        <TopBanner text="Der neue Finanzleser ist da. Abonnieren Sie jetzt unseren Newsletter!" />
        <Providers>
        <NavProvider items={navItems}>
        <ArticlePreviewProvider>
          <div className="bookmark-section">
            <div className="bookmark-section__inner"><BookmarkNav /></div>
          </div>
          <LogoBar />
          <TopNav />
          {/* DotLine + Powered by */}
          <div className="sticky-nav dotline-animated">
            <PoweredByLine style={{ minWidth: "1200px", width: "80%", paddingLeft: 280, paddingRight: 0 }} />
          </div>
          <ContentScaler />
          <MegaMenuWrapper />
          <FinanztoolsMenu />
          <div className="scalable-content">
            {children}
          </div>
          <ProgressiveBlur height={120} />
          <MayaIcon />
        </ArticlePreviewProvider>
        </NavProvider>
        </Providers>
      </body>
    </html>
  );
}
