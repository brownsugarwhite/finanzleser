"use client";

/**
 * Der Körper eines Kapitels — und seine Klappbewegung, in BEIDE Richtungen.
 *
 * Vorlage: „Finanzleser Faden A v2 — Zeitung", Zeile 338. Dort ist jedes Kapitel eine
 * Rasterzeile, die zwischen `0fr` und `1fr` läuft; Aufschlagen und Zusammenfalten sehen
 * deshalb gleich aus. Bis zum 17.09.2026 wuchs hier nur das Aufklappen (WAAPI, 360 ms) —
 * zugeklappt wurde hart, weil der Inhalt im selben Bild aus dem Baum flog.
 *
 * Der Trick dagegen ist `zeigt`: Beim Zuklappen bleibt der Inhalt stehen, bis die
 * Bewegung fertig ist, erst danach hängt er aus. Beim Aufklappen ist er sofort da, wird
 * gemessen und von 0 an aufgezogen.
 *
 * `immer` ist für das lebende Kapitel: dort bleibt der Inhalt IM BAUM, auch zugeklappt.
 * Zwei Gründe, beide hart:
 *   1. `lib/faden/schnappschuss.ts` greift beim Navigieren `.kapitel__inhalt` und misst
 *      jede Insel aus. Ein ausgehängtes Kapitel läge als leerer Schnappschuss im Verlauf.
 *   2. Ein Aushängen risse den ganzen Artikel samt Inseln ab und baute ihn beim
 *      Aufklappen neu auf — für eine Handbewegung viel zu teuer.
 * Zugeklappt steht es auf `height: 0; overflow: hidden`: Das Kapitel ist 0 px hoch, seine
 * Kinder behalten aber ihre echte Geometrie — genau das, was `greifen()` messen muss.
 *
 * 🚨 `data-zu` wird von Hand gesetzt, nicht aus dem JSX. React fasst nur an, was es
 * selbst rendert; so kann die Animation das Attribut für ihre Dauer wegnehmen, ohne dass
 * der nächste Render es wieder hinschreibt.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

const DAUER = 360;
const KURVE = "cubic-bezier(.2,.8,.2,1)";

function reduziert(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function KapitelInhalt({ offen, immer = false, klasse = "kapitel__inhalt", children }: { offen: boolean; immer?: boolean; klasse?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const anim = useRef<Animation | null>(null);
  // Ob der Inhalt im Baum steht. Beim Zuklappen bleibt er, bis die Bewegung durch ist.
  const [zeigt, setZeigt] = useState(offen || immer);
  if ((offen || immer) && !zeigt) setZeigt(true);
  const war = useRef(offen);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Erstlauf oder ein Render ohne Klappwechsel: nur den Ruhezustand festschreiben.
    if (war.current === offen) {
      if (!offen && !anim.current) el.setAttribute("data-zu", "");
      else if (offen) el.removeAttribute("data-zu");
      return;
    }
    war.current = offen;
    anim.current?.cancel();
    anim.current = null;
    if (reduziert() || typeof el.animate !== "function") {
      if (!offen) { el.setAttribute("data-zu", ""); if (!immer) setZeigt(false); } else el.removeAttribute("data-zu");
      return;
    }
    // Während der Bewegung misst und malt der Browser die echte Höhe — der Ruhezustand
    // kommt erst danach zurück.
    el.removeAttribute("data-zu");
    const h = el.getBoundingClientRect().height;
    const bilder: Keyframe[] = offen
      ? [{ height: "0px", opacity: 0 }, { height: `${h}px`, opacity: 1 }]
      : [{ height: `${h}px`, opacity: 1 }, { height: "0px", opacity: 0 }];
    el.style.overflow = "hidden";
    const a = el.animate(bilder, { duration: DAUER, easing: KURVE });
    anim.current = a;
    const fertig = () => {
      if (anim.current !== a) return;
      anim.current = null;
      el.style.overflow = "";
      if (!offen) { el.setAttribute("data-zu", ""); if (!immer) setZeigt(false); }
    };
    a.addEventListener("finish", fertig, { once: true });
    a.addEventListener("cancel", () => { if (anim.current === a) { anim.current = null; el.style.overflow = ""; } }, { once: true });
    // Notbremse: Verschluckt der Browser die Animation (Tab im Hintergrund), darf das
    // Kapitel nicht halb offen stehen bleiben.
    const uhr = setTimeout(() => { if (anim.current === a) { try { a.finish(); } catch { fertig(); } } }, DAUER + 200);
    return () => clearTimeout(uhr);
  }, [offen, immer]);

  return <div className={"klappe " + klasse} ref={ref}>{zeigt && children}</div>;
}
