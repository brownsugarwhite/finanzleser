import { ScrollTrigger } from "@/lib/gsapConfig";
import { getActiveOverlay } from "@/lib/overlayController";

let pending: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounced ScrollTrigger.refresh(). Nach spät einlaufendem Content
 * (Iframes, async geladene Embeds, Bild-Loads) ändert sich die Dokumenthöhe
 * und alle ScrollTrigger-Positionen müssen neu vermessen werden — sonst
 * sitzen Trigger (z.B. Logo-/Leo-Batch-Flip) auf veralteten Positionen.
 *
 * Mehrere schnell aufeinanderfolgende Aufrufe (z.B. mehrere Iframe-Resizes)
 * werden zu einem einzigen refresh() zusammengefasst.
 */
export function refreshScrollTriggers(delay = 150) {
  if (typeof window === "undefined") return;
  if (pending) clearTimeout(pending);
  pending = setTimeout(() => {
    pending = null;
    // Nicht refreshen während ein Overlay offen ist (Inhalt skaliert/geblurrt
    // → falsche Messung). Nach dem Schließen refresht ContentScaler ohnehin.
    if (getActiveOverlay() !== null) return;
    ScrollTrigger.refresh();
  }, delay);
}
