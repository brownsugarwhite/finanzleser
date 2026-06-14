import { cn } from "@/lib/cn";

/**
 * Werbe-Platzhalter. Rendert vorerst nur eine graue Fläche in IAB-Standardgröße
 * (kein border-radius). Hier wird später das echte Ad-Markup eingesetzt — entweder
 * ein Drittanbieter-Script-Slot oder Eigenwerbung für die finanzleser-Tools.
 *
 * Formate (IAB 2026): billboard 970×250, leaderboard 728×90, skyscraper 160×600,
 * halfpage 300×600, rectangle 300×250, mobile 320×100.
 */
export type AdFormat =
  | "billboard"
  | "superleaderboard"
  | "leaderboard"
  | "skyscraper"
  | "halfpage"
  | "rectangle"
  | "mobile";

const AD_SIZES: Record<AdFormat, { w: number; h: number }> = {
  billboard: { w: 970, h: 250 },
  superleaderboard: { w: 970, h: 90 },
  leaderboard: { w: 728, h: 90 },
  skyscraper: { w: 160, h: 600 },
  halfpage: { w: 300, h: 600 },
  rectangle: { w: 300, h: 250 },
  mobile: { w: 320, h: 100 },
};

export default function AdSlot({
  format,
  className,
}: {
  format: AdFormat;
  className?: string;
}) {
  const { w, h } = AD_SIZES[format];
  return (
    <div
      className={cn("ad-slot", className)}
      data-ad-format={format}
      role="complementary"
      aria-label="Werbung"
      style={{
        width: w,
        maxWidth: "100%",
        aspectRatio: `${w} / ${h}`,
        background: "rgba(0, 0, 0, 0.10)",
        borderRadius: 0,
        marginInline: "auto",
      }}
    />
  );
}
