import type gsap from "@/lib/gsapConfig";

/**
 * Hängt an eine GSAP-Timeline einen Count-up für ein Ergebnis-Element.
 * Liest den final gerenderten DE-formatierten Wert ("1.234,56 €", "12,5 %", "1.000"),
 * zählt von 0 hoch und formatiert pro Tick im selben Format zurück (Präfix/Suffix/Dezimalstellen bleiben).
 */
export function animateCountUp(
  el: HTMLElement,
  tl: gsap.core.Timeline,
  position: number,
  duration = 0.7
) {
  const finalText = el.textContent ?? "";
  const m = finalText.match(/-?\d[\d.]*(?:,\d+)?/);
  if (!m || m.index === undefined) return;

  const numStr = m[0];
  const prefix = finalText.slice(0, m.index);
  const suffix = finalText.slice(m.index + numStr.length);
  const decimals = numStr.includes(",") ? numStr.split(",")[1].length : 0;
  const target = parseFloat(numStr.replace(/\./g, "").replace(",", "."));
  if (!isFinite(target)) return;

  const fmt = (n: number) =>
    n.toLocaleString("de-DE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  const obj = { v: 0 };
  el.textContent = prefix + fmt(0) + suffix;
  tl.to(
    obj,
    {
      v: target,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = prefix + fmt(obj.v) + suffix;
      },
      onComplete: () => {
        el.textContent = finalText; // exakter Endzustand
      },
    },
    position
  );
}
