import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import ProgressiveBlur from "@/components/ui/ProgressiveBlur";

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
        <ProgressiveBlur height={120} color="255,255,255" />
        {children}
      </body>
    </html>
  );
}
