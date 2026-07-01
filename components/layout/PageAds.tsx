import type { CSSProperties, ReactNode } from "react";
import AdSlot, { type AdFormat } from "@/components/ui/AdSlot";
import PageAdRails from "./PageAdRails";
import { cn } from "@/lib/cn";
import type { PageAdsSettings } from "@/lib/types";

/**
 * Generisches Werbe-Gerüst für Nicht-Artikel-Seiten (Tools, Anbieter, Listen).
 * Legt einen optionalen Top-Banner zwischen Heading und Content, flankiert die
 * zentrierte Content-Spalte (Breite `contentWidth`) mit sticky Rails und richtet
 * Heading + Content über `.page-ad-col` exakt aneinander aus.
 *
 * variant="tool": Tool-Seiten (Rechner/Vergleich/Checkliste). Der Frame ist auf
 * 1200px gedeckelt, die Rails sitzen in den Seitenbändern INNERHALB des Frames
 * (nie über den Bildrand hinaus), werden nur bei genug Platz gezeigt und enden 40px
 * vor der Newsletter-Section. Ohne variant bleibt das bisherige Verhalten (Kategorie-
 * Seiten mit eigenen CSS-Overrides).
 */
interface PageAdsProps {
  ads?: PageAdsSettings;
  /** Breite der zentrierten Content-Spalte in px (z. B. 728 Tools, 1040 Listen). */
  contentWidth: number;
  heading?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  topFormat?: AdFormat;
  railWidth?: number;
  railGap?: number;
  /** "tool" = gedeckelter 1200-Frame + Band-Rails (Rechner/Vergleich/Checkliste). */
  variant?: "tool";
}

export default function PageAds({ ads, contentWidth, heading, children, contentClassName, topFormat = "billboard", railWidth, railGap, variant }: PageAdsProps) {
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
      <div className={cn("page-ad-frame", variant === "tool" && "page-ad-frame--tool")}>
        {/* Heading: bei aktiven Rails über die Gesamtbreite (Frame), sonst Content-Breite. */}
        {heading && <div className={cn("page-ad-heading", showRails && "page-ad-heading--wide")}>{heading}</div>}
        <div className="page-ad-region">
          {showRails && <PageAdRails variant={variant} contentWidth={contentWidth} railGap={railGap ?? 24} />}
          <div className={cn("page-ad-col", contentClassName)}>
            {showTop && (
              <div className="page-ad-top">
                <AdSlot format={topFormat} fullWidth={topFull} />
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
