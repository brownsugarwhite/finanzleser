import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import ProgressiveBlur from "@/components/ui/ProgressiveBlur";
import OverlayScrollbar from "@/components/ui/OverlayScrollbar";
import BookmarkNav from "@/components/ui/BookmarkNav";
import FixedNav from "@/components/ui/FixedNav";
import LogoAnimation from "@/components/ui/LogoAnimation";
import MegaMenu from "@/components/ui/MegaMenu";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${outfit.variable} ${inter.variable}`}>
      <body className="antialiased">
        <ProgressiveBlur height={150} color="255,255,255" />
        <OverlayScrollbar />
        <BookmarkNav />
        <FixedNav />
        <LogoAnimation />
        <MegaMenu />
        {children}
      </body>
    </html>
  );
}
