import type { Metadata, Viewport } from "next";
import { Open_Sans, Merriweather } from "next/font/google";
import { Providers } from "./providers";
import { NavProvider } from "@/lib/NavContext";
import { getNavItems } from "@/lib/wordpress";
import BookmarkNav from "@/components/layout/BookmarkNav";
import LogoBadge from "@/components/layout/LogoBadge";
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
        <div className="bookmark-section" style={{ width: "100%", height: "50px", marginTop: "23px", position: "sticky", top: "23px", zIndex: 52, display: "flex", justifyContent: "flex-end" }}>
          <BookmarkNav />
        </div>
        <NavProvider items={navItems}>
          <Providers>{children}</Providers>
          <ProgressiveBlur height={150} />
          <LogoBadge />
        </NavProvider>
      </body>
    </html>
  );
}
