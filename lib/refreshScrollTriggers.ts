import { ScrollTrigger } from "@/lib/gsapConfig";

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
    ScrollTrigger.refresh();
  }, delay);
}
