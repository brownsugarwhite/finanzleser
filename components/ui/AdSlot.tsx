import { ADSENSE_ENABLED, type AdFormat } from "@/lib/ads";
import AdPlaceholder from "@/components/ads/AdPlaceholder";
import AdSenseUnit from "@/components/ads/AdSenseUnit";

/**
 * Werbe-Slot — zentrale Weiche für alle Positionen (Artikel-Top, Tool-Seiten,
 * Kategorien, Anbieter, Suche, Dokumente). Ob eine Position überhaupt rendert,
 * entscheiden weiterhin die WP-Site-Settings-Booleans in den Layouts.
 *
 * - Ohne NEXT_PUBLIC_ADSENSE=1: grauer Platzhalter wie bisher (server-rendered).
 * - Mit Flag: echte AdSense-Unit (consent-gated über "marketing", siehe AdSenseUnit).
 *
 * Formate (IAB 2026): billboard 970×250, leaderboard 728×90, skyscraper 160×600,
 * halfpage 300×600, rectangle 300×250, mobile 320×100.
 */
export type { AdFormat };

export default function AdSlot({
  format,
  className,
  fullWidth = false,
}: {
  format: AdFormat;
  className?: string;
  /** Streckt den Slot auf 100% der Spaltenbreite (statt fixer IAB-Breite). */
  fullWidth?: boolean;
}) {
  if (!ADSENSE_ENABLED) {
    return <AdPlaceholder format={format} className={className} fullWidth={fullWidth} />;
  }
  return <AdSenseUnit format={format} className={className} fullWidth={fullWidth} />;
}
