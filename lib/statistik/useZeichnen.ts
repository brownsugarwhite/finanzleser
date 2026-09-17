"use client";

/**
 * Auslöser für „zeichnet sich beim Lesen“ (Design A v2, Kicker „Alle Diagramme zeichnen sich beim Lesen“).
 *
 * Drei Zustände, in dieser Reihenfolge:
 *   „fertig“ — Server und erste Client-Rendung zeigen das fertige Diagramm. Kein
 *              Hydrations-Unterschied, kein Layout-Sprung, und ohne JavaScript bleibt es dabei.
 *   „ruht“   — der Effekt setzt die Form auf den Anfangszustand zurück.
 *   „zeigt“  — beim Eintritt ins Bild wird einmal gezeichnet.
 * Ohne den ersten Zustand liefe die Einblendung beim Laden einmal ins Leere und danach
 * beim Hereinscrollen ein zweites Mal.
 *
 * 🚨 IntersectionObserver, nicht ScrollTrigger. Jeder ScrollTrigger.refresh() — den im Faden
 * jede fertig geladene Checkliste auslöst — scrollt in GSAPs _refreshAll auf 0 und zurück und
 * bricht damit jeden laufenden weichen Scroll ab (gemessen: neunmal in vier Navigationen).
 * Für „Eintritt ins Bild“ braucht es keinen Trigger.
 */
import { useEffect, useRef, useState } from "react";

export type Zeichenstand = "fertig" | "ruht" | "zeigt";

export function useZeichnen<T extends HTMLElement = HTMLDivElement>(): [React.RefObject<T | null>, boolean, Zeichenstand] {
  const wurzel = useRef<T>(null);
  const [stand, setStand] = useState<Zeichenstand>("fertig");

  useEffect(() => {
    const el = wurzel.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setStand("ruht");
    const beobachter = new IntersectionObserver(
      (eintraege) => {
        if (!eintraege.some((e) => e.isIntersecting)) return;
        beobachter.disconnect();
        setStand("zeigt");
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    beobachter.observe(el);
    return () => beobachter.disconnect();
  }, []);

  return [wurzel, stand !== "ruht", stand];
}

/**
 * Zählwerk für den Kennzahlen-Vierer: 0 → Ziel in 1,3 s, sobald das Feld ins Bild kommt.
 * Nimmt den Zeichenstand, nicht nur ein Ja/Nein — sonst liefe das Zählwerk schon beim
 * Laden einmal durch und beim Hereinscrollen ein zweites Mal.
 */
export function useZaehlwerk(ziel: number, stand: Zeichenstand, dauer = 1300): number {
  const [wert, setWert] = useState(ziel);
  useEffect(() => {
    // Im Ruhezustand steht der Zielwert da, nicht die Null. Sichtbar ist das nie — der
    // ganze Block hat dann opacity 0 —, aber Suchmaschinen und Textauszüge lesen so die
    // echte Zahl statt „0". Beim Zeichnen springt sie auf 0 und zählt hoch; der Sprung
    // fällt mit dem Einblenden zusammen und ist deshalb unsichtbar.
    if (stand !== "zeigt") { setWert(ziel); return; }
    if (!Number.isFinite(ziel)) return;
    let rohr = 0;
    const start = performance.now();
    const schritt = (jetzt: number) => {
      const t = Math.min(1, (jetzt - start) / dauer);
      // dieselbe Verzögerungskurve wie die Diagramme: cubic-bezier(.2,.8,.2,1), hier als Näherung
      const e = 1 - Math.pow(1 - t, 3);
      setWert(ziel * e);
      if (t < 1) rohr = requestAnimationFrame(schritt);
      else setWert(ziel);
    };
    rohr = requestAnimationFrame(schritt);
    return () => cancelAnimationFrame(rohr);
  }, [ziel, stand, dauer]);
  return wert;
}
