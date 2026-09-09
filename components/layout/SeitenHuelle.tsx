/**
 * Die Hülle der alten Seite: Lesezeichen, Logo, Nav, Megamenü, Morph-Übergänge,
 * progressiver Blur, Leo-Dock.
 *
 * 🚨 Warum das eine eigene Datei ist: In app/layout.tsx standen beide Hüllen — die alte
 * und die des Fadens — als gewöhnliche Importe nebeneinander. Ein `if` zur Laufzeit
 * ändert daran nichts: Der Bündler packt beide Bäume in denselben Layout-Chunk. Im Faden
 * lagen damit LogoBar samt Lottie-Daten, MegaMenu, MobileMegaMenu, BookmarkNav und
 * LeoIcon im Bundle jeder einzelnen Seite, obwohl nichts davon je gerendert wird.
 * Jetzt lädt app/layout.tsx die Hülle über next/dynamic — nur die tatsächlich gerenderte.
 *
 * Der Inhalt ist unverändert aus app/layout.tsx übernommen; nur die Daten kommen als
 * Eigenschaften herein statt aus den Gettern im Layout.
 */
import type { ReactNode } from "react";
import { Providers } from "@/app/providers";
import { NavProvider } from "@/lib/NavContext";
import type { NavItem } from "@/lib/NavContext";
import type { MegamenuPreload, getSiteSettings } from "@/lib/wordpress";
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
import RouteChangeRefresh from "@/components/ui/RouteChangeRefresh";
import MorphTransitionLayer from "@/components/sections/MorphTransitionLayer";
import { PageTransitionProvider } from "@/lib/usePageTransition";

export default function SeitenHuelle({
  children, navItems, megamenuPreload, siteSettings,
}: {
  children: ReactNode;
  navItems: NavItem[];
  megamenuPreload: MegamenuPreload;
  siteSettings: Awaited<ReturnType<typeof getSiteSettings>>;
}) {
  return (
    <>
      <RouteChangeRefresh />
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
    </>
  );
}
