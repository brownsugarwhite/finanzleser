import type { Metadata, Viewport } from "next";
import { Open_Sans, Merriweather } from "next/font/google";
import { Providers } from "./providers";
import { NavProvider } from "@/lib/NavContext";
import { getNavItems } from "@/lib/wordpress";
import BookmarkNav from "@/components/layout/BookmarkNav";
import TopNav from "@/components/layout/TopNav";
import DotSpacer from "@/components/ui/DotSpacer";
import ProgressiveBlur from "@/components/ui/ProgressiveBlur";
import TopBanner from "@/components/ui/TopBanner";
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
  title: "finanzleser.de – Steuern, Finanzen, Versicherungen",
  description: "Ratgeber, Rechner und Vergleiche zu Steuern, Geldanlage und Versicherungen.",
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
        <TopBanner text="Der neue Finanzleser ist da. Abonnieren Sie jetzt unseren Newsletter!" />
        <NavProvider items={navItems}>
          <div className="bookmark-section" style={{ width: "100%", height: "50px", marginTop: "23px", position: "sticky", top: "23px", zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
            <BookmarkNav />
          </div>
          {/* Logo Bar */}
          <div style={{ width: "100%", position: "sticky", top: "23px", zIndex: 156, marginTop: "-50px", pointerEvents: "none" }}>
            <div className="logo-wrapper" style={{ height: "50px", display: "flex", alignItems: "center", paddingLeft: "50px", pointerEvents: "auto", width: "fit-content" }}>
              <a href="/"><img src="/icons/fl_logo.svg" alt="finanzleser" style={{ width: "190px", height: "auto", display: "block" }} /></a>
            </div>
          </div>
          <TopNav />
          {/* DotLine + Powered by */}
          <div className="sticky-nav" style={{ position: "relative", zIndex: 50, width: "100%", display: "flex", justifyContent: "center", marginBottom: "36px", marginTop: "13px", pointerEvents: "none" }}>
            <div style={{ maxWidth: "60%", width: "100%", paddingLeft: 70, display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <DotSpacer noMargin maxWidth="100%" />
              </div>
              <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap", paddingBottom: 2 }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-text-medium)" }}>powered by</span>
                <img src="/icons/finconext_logo.svg" alt="Finconext" style={{ width: "80px", height: "auto" }} />
              </div>
            </div>
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <Providers>{children}</Providers>
          </div>
          <ProgressiveBlur height={150} />
        </NavProvider>
      </body>
    </html>
  );
}
