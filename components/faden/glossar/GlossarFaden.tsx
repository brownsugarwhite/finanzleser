"use client";

/**
 * Der Faden vom Wort zum Zettel.
 *
 * Tippt der Leser im Text auf einen grünen Begriff, zeichnet sich eine dünne Kurve vom
 * Wort zur rechten Randspalte, und dort legt sich der Begriff als Zettel auf den Stapel.
 * Aus Design A v2, Screen 6 — der Effekt, der erklärt, wohin die Erklärung wandert. Ohne
 * ihn erscheint der Zettel einfach, und niemand sieht den Zusammenhang.
 *
 * 🚨 Ein Overlay über der ganzen Hülle, `position: fixed`, `pointer-events: none`. Der
 * Faden darf nichts anfassen und nichts verschieben; er liegt über allem und ist nach
 * 2,6 Sekunden wieder weg — oder früher, sobald gescrollt wird, denn dann stimmen seine
 * beiden Enden nicht mehr.
 *
 * 🚨 Keine React-Zustände im Bildtakt. Die Kurve wird EINMAL gerechnet, wenn das Ereignis
 * kommt; danach läuft nur noch CSS. Ein Neuberechnen beim Scrollen wäre teuer und
 * sinnlos: der Faden soll ja gerade nicht mitwandern, sondern verschwinden.
 */
import { useEffect, useRef, useState } from "react";
import { reduzierteBewegung } from "@/lib/faden/belohnung";

interface Zug { d: string; x1: number; y1: number; x2: number; y2: number }

/** Das Ereignis, das BegriffMenue beim Antippen eines Begriffs auslöst. */
export interface FadenZiehen { slug: string; anker: HTMLElement }

export default function GlossarFaden() {
  const [zug, setZug] = useState<Zug | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const weg = () => {
      if (timer.current) { clearTimeout(timer.current); timer.current = null; }
      setZug(null);
    };

    const ziehen = (ev: Event) => {
      const { slug, anker } = (ev as CustomEvent<FadenZiehen>).detail || {};
      if (!slug || !anker || reduzierteBewegung()) return;

      // Der Zettel steht erst nach dem nächsten Rendern im DOM — zwei Aufgaben später
      // ist er da. `setTimeout` statt `requestAnimationFrame`: in einem verborgenen Tab
      // liefe rAF nicht, und dann hinge der Faden nie ab (dieselbe Falle wie in
      // lib/faden/erscheinen.ts).
      timer.current = setTimeout(() => {
        const zettel = document.querySelector<HTMLElement>(`#glossarRail [data-k="${CSS.escape(slug)}"]`);
        const rail = document.getElementById("randRechts");
        // Ohne sichtbare Randspalte gibt es kein Ziel — auf schmalen Fenstern liegt das
        // Glossar in einer Schublade, da wäre der Faden eine Linie ins Nichts.
        if (!zettel || !rail || !rail.offsetParent || getComputedStyle(rail).opacity === "0") return;

        const a = anker.getBoundingClientRect();
        const z = zettel.getBoundingClientRect();
        const x1 = a.right;
        const y1 = a.top + a.height / 2;
        const x2 = z.left;
        const y2 = z.top + Math.min(16, z.height / 2);
        // Eine kubische Kurve, die erst waagerecht aus dem Wort tritt und waagerecht am
        // Zettel ankommt — ein gerader Strich sähe aus wie ein Fehler im Layout.
        const bogen = Math.max(40, Math.abs(x2 - x1) * 0.42);
        const d = `M${x1} ${y1} C${x1 + bogen} ${y1}, ${x2 - bogen} ${y2}, ${x2} ${y2}`;
        setZug({ d, x1, y1, x2, y2 });

        timer.current = setTimeout(() => setZug(null), 2600);
      }, 0);
    };

    document.addEventListener("faden:begriff-faden", ziehen as EventListener);
    window.addEventListener("scroll", weg, { passive: true });
    window.addEventListener("resize", weg, { passive: true });
    return () => {
      document.removeEventListener("faden:begriff-faden", ziehen as EventListener);
      window.removeEventListener("scroll", weg);
      window.removeEventListener("resize", weg);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!zug) return null;
  return (
    <svg className="glossar-faden" aria-hidden="true">
      <path d={zug.d} pathLength="1" />
      <circle className="glossar-faden__knoten glossar-faden__knoten--start" cx={zug.x1} cy={zug.y1} r="4" />
      <circle className="glossar-faden__knoten glossar-faden__knoten--ziel" cx={zug.x2} cy={zug.y2} r="4" />
    </svg>
  );
}
