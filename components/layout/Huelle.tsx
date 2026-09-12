"use client";

/**
 * Die Weiche zwischen alter Hülle und Faden-Hülle.
 *
 * 🚨 Warum das eine Client-Komponente ist und nicht einfach ein `?:` in app/layout.tsx:
 * `next/dynamic` teilt den Client-Chunk nur, wenn es in einer Client-Komponente steht.
 * In einer Server-Komponente aufgerufen, verzögert es bloß das Server-Rendern — der
 * Bündler legt beide Bäume trotzdem in den Layout-Chunk. Nachgemessen (ANALYZE=true):
 * mit der Weiche im Layout blieben LogoBar samt Lottie-Daten, MegaMenu, MobileMegaMenu,
 * BookmarkNav und LeoIcon im Bundle jeder Faden-Seite, obwohl sie dort nie rendern.
 *
 * `children` kommt weiterhin serverseitig gerendert herein und wird nur durchgereicht;
 * an der Server-Komponenten-Natur der Seiten ändert sich dadurch nichts.
 */
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import type { NavItem } from "@/lib/NavContext";
import type { MegamenuPreload, getSiteSettings } from "@/lib/wordpress";
import type { Level } from "@/lib/faden/optionen";
import type { HeroZahlen } from "@/components/faden/hero/HeroLanding";
import { FADEN_AKTIV } from "@/lib/faden/flag";

const SeitenHuelle = dynamic(() => import("@/components/layout/SeitenHuelle"));
const FadenHuelle = dynamic(() => import("@/components/faden/FadenHuelle"));

export default function Huelle({
  children, navItems, megamenuPreload, siteSettings, level, heroZahlen,
}: {
  children: ReactNode;
  navItems: NavItem[];
  megamenuPreload: MegamenuPreload;
  siteSettings: Awaited<ReturnType<typeof getSiteSettings>> | null;
  level?: Level[];
  heroZahlen?: HeroZahlen;
}) {
  if (FADEN_AKTIV) {
    return <FadenHuelle navItems={navItems} megamenuPreload={megamenuPreload} level={level} heroZahlen={heroZahlen}>{children}</FadenHuelle>;
  }
  return <SeitenHuelle navItems={navItems} megamenuPreload={megamenuPreload} siteSettings={siteSettings!}>{children}</SeitenHuelle>;
}
