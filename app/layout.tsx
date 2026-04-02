import type { Metadata, Viewport } from "next";
import { Open_Sans, Merriweather } from "next/font/google";
import { Providers } from "./providers";
import { NavProvider } from "@/lib/NavContext";
import { getNavItems } from "@/lib/wordpress";
import BookmarkNav from "@/components/layout/BookmarkNav";
import TopNav from "@/components/layout/TopNav";
import PoweredByLine from "@/components/ui/PoweredByLine";
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
          <div style={{ width: "100%", height: "50px", position: "sticky", top: "23px", zIndex: 156, marginTop: "-50px", pointerEvents: "none" }}>
            <div className="logo-wrapper" style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: "50px", pointerEvents: "auto", width: "fit-content" }}>
              <a href="/"><img src="/icons/fl_logo.svg" alt="finanzleser" style={{ width: "225px", height: "auto", display: "block", marginTop: "19px" }} /></a>
              <span style={{ fontFamily: "'Merriweather', serif", fontStyle: "italic", fontSize: "18px", fontWeight: "300", color: "var(--color-text-medium)", whiteSpace: "nowrap", marginTop: "8px" }}>Das digitale Finanzmagazin</span>
            </div>
          </div>
          <TopNav />
          {/* DotLine + Powered by */}
          <div className="sticky-nav" style={{ position: "relative", zIndex: 50, width: "100%", display: "flex", justifyContent: "start", marginBottom: "36px", marginTop: "3px", pointerEvents: "none" }}>
            <PoweredByLine style={{ minWidth: "1100px", width: "100%", paddingLeft: 280, paddingRight: 350 }} />
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
