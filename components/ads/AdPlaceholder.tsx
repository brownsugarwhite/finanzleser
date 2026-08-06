import { cn } from "@/lib/cn";
import { AD_SIZES, type AdFormat } from "@/lib/ads";

// Grauer Werbeplatzhalter in IAB-Größe (kein border-radius). Server-safe —
// wird sowohl von AdSlot (Flag aus) als auch von AdSenseUnit (kein Consent)
// gerendert und muss byte-identisch zum bisherigen AdSlot-Markup bleiben.
export default function AdPlaceholder({
  format,
  className,
  fullWidth = false,
}: {
  format: AdFormat;
  className?: string;
  fullWidth?: boolean;
}) {
  const { w, h } = AD_SIZES[format];
  return (
    <div
      className={cn("pg-slot", className)}
      data-slot-format={format}
      role="complementary"
      style={{
        width: fullWidth ? "100%" : w,
        maxWidth: "100%",
        aspectRatio: `${w} / ${h}`,
        background: "rgba(0, 0, 0, 0.10)",
        borderRadius: 0,
        marginInline: "auto",
      }}
    />
  );
}
