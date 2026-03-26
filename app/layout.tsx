import type { Metadata, Viewport } from "next";
import { Open_Sans, Merriweather } from "next/font/google";
import { Providers } from "./providers";
import { NavProvider } from "@/lib/NavContext";
import { getNavItems } from "@/lib/wordpress";
import BookmarkNav from "@/components/layout/BookmarkNav";
import LogoBadge from "@/components/layout/LogoBadge";
import ProgressiveBlur from "@/components/ui/ProgressiveBlur";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const merriweather = Merriweather({
  variable: "--font-heading",
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
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
        <NavProvider items={navItems}>
          <Providers>{children}</Providers>
          <ProgressiveBlur height={150} />
          <LogoBadge />
          <BookmarkNav />
        </NavProvider>
      </body>
    </html>
  );
}
