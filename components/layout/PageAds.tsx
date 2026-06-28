import type { CSSProperties, ReactNode } from "react";
import AdSlot, { type AdFormat } from "@/components/ui/AdSlot";
import PageAdRails from "./PageAdRails";
import { cn } from "@/lib/cn";
import type { PageAdsSettings } from "@/lib/types";

/**
 * Generisches Werbe-Gerüst für Nicht-Artikel-Seiten (Tools, Anbieter, Listen).
 * Legt einen optionalen Top-Banner zwischen Heading und Content, flankiert die
 * zentrierte Content-Spalte (Breite `contentWidth`) mit sticky Rails und richtet
 * Heading + Content über `.page-ad-col` exakt aneinander aus. Alles server-
 * renderbar; sichtbar nur, wenn die jeweiligen `ads`-Schalter true sind.
 *
 * Pattern je Seite:
 *   <PageAds ads={settings.ads.<typ>} contentWidth={850} heading={<Heading/>}>
 *     {tool oder liste}
 *   </PageAds>
 *
 * WICHTIG: PageAds spannt volle Breite (Rails sitzen in den Viewport-Rändern) —
 * NICHT in einen schmalen, zentrierten Wrapper packen.
 */
interface PageAdsProps {
  ads?: PageAdsSettings;
  /** Breite der zentrierten Content-Spalte in px (z. B. 850 Tools, 1040 Listen). */
  contentWidth: number;
  /** Optionaler Kopfbereich (Breadcrumb/Kategorie/H1/Beschreibung) — fluchtet mit dem Content. */
  heading?: ReactNode;
  children: ReactNode;
  /** Zusätzliche Klassen für die Content-Spalte. */
  contentClassName?: string;
  /** Top-Banner-Format: 'billboard' (voll, default) oder z. B. 'leaderboard' (schmal, wie Artikel). */
  topFormat?: AdFormat;
  /** Feste Rail-Breite in px (überschreibt die responsive --ad-rail-w). */
  railWidth?: number;
  /** Horizontaler Abstand Content↔Rail in px (überschreibt --ad-rail-gap). */
  railGap?: number;
}

export default function PageAds({ ads, contentWidth, heading, children, contentClassName, topFormat = "billboard", railWidth, railGap }: PageAdsProps) {
  const showTop = !!ads?.top;
  const showRails = !!ads?.rails;
  const style = {
    ["--page-content-w" as string]: `${contentWidth}px`,
    ...(railWidth ? { ["--ad-rail-w" as string]: `${railWidth}px` } : {}),
    ...(railGap != null ? { ["--ad-rail-gap" as string]: `${railGap}px` } : {}),
  } as CSSProperties;
  const topFull = topFormat === "billboard";

  return (
    <div className="page-ads" style={style}>
      {/* Heading spannt über die GESAMTBREITE (Content + Rails) — aber nur wenn
          Rails aktiv sind; sonst auf Content-Breite. */}
      {heading && <div className={cn("page-ad-heading", showRails && "page-ad-heading--wide")}>{heading}</div>}
      <div className="page-ad-region">
        {showRails && <PageAdRails />}
        <div className={cn("page-ad-col", contentClassName)}>
          {/* Top-Banner (Billboard voll, oder schmal z. B. Leaderboard). */}
          {showTop && (
            <div className="page-ad-top">
              <AdSlot format={topFormat} fullWidth={topFull} />
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
