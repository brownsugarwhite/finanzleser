"use client";

import { useEffect, useRef, useState } from "react";
import { reduzierteBewegung } from "@/lib/faden/belohnung";

/**
 * Zählwerk des Kursblatts: der Wert läuft vom ALTEN zum neuen, beim ersten Mal von 0.
 *
 * README des Handoffs, „Bewegung“: „Zählwerke: 950 ms × tempo, ease-out-cubic
 * (1−(1−p)³), requestAnimationFrame; Werte laufen vom alten zum neuen Wert (beim Laden
 * von 0).“ Im Prototyp: Kursblatt.dc.html:412-417.
 *
 * 🚨 Nicht `useZaehlwerk` aus lib/statistik/useZeichnen.ts: das zählt immer bei 0 los und
 * hängt am Sichtbarwerden. Hier ändert sich der Zielwert bei jeder Eingabe, und ein
 * Sprung zurück auf 0 wäre bei jedem Tastendruck ein Flackern.
 *
 * Der Startwert ist das Ziel, nicht 0 — so steht im gelieferten HTML die echte Zahl und
 * nicht eine Null, die Suchmaschinen und Textauszüge mitnehmen.
 */
export function useZaehlwerkKb(ziel: number, dauer = 950): number {
  const [wert, setWert] = useState(ziel);
  const zeigt = useRef(ziel);
  zeigt.current = wert;
  const erster = useRef(true);

  useEffect(() => {
    if (!Number.isFinite(ziel)) return;
    if (reduzierteBewegung()) { setWert(ziel); return; }
    const von = erster.current ? 0 : zeigt.current;
    erster.current = false;
    if (von === ziel) { setWert(ziel); return; }
    const start = performance.now();
    let rohr = 0;
    const schritt = (jetzt: number) => {
      const t = Math.min(1, (jetzt - start) / dauer);
      const e = 1 - Math.pow(1 - t, 3);
      setWert(von + (ziel - von) * e);
      if (t < 1) rohr = requestAnimationFrame(schritt);
      else setWert(ziel);
    };
    rohr = requestAnimationFrame(schritt);
    return () => cancelAnimationFrame(rohr);
    // `zeigt.current` steht bewusst nicht in den Abhängigkeiten: es ist der Startwert
    // dieses Laufs, nicht sein Auslöser. Als Ref sieht die Regel es ohnehin nicht.
  }, [ziel, dauer]);

  return wert;
}
