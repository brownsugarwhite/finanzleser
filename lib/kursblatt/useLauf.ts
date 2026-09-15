"use client";

import { useEffect, useRef, useState } from "react";
import { reduzierteBewegung } from "@/lib/faden/belohnung";

/**
 * Der Neustart-Trick der Übergabe.
 *
 * README des Kursblatt-Handoffs, „Bewegung (Herzschlag-Prinzip)“: „jede Keyframe-
 * Animation existiert doppelt (fl-herz/fl-herz2, fl-mitte/fl-mitte2, …); ein Zähler
 * `lauf` (erhöht bei jeder Änderung der Eingaben/Filter/Sortierung) wechselt den Namen
 * und startet die Animation neu.“ Im Prototyp: Kursblatt.dc.html:470-472.
 *
 * Warum überhaupt: eine laufende CSS-Animation startet nicht neu, wenn sich nur ein
 * Wert ändert — der Knoten müsste aus dem DOM. Ein anderer Name ist eine andere
 * Animation, und die läuft von vorn.
 *
 * 🚨 Start bei 0 auf Server und erstem Client-Render — kein Hydrationsunterschied.
 * Der Zähler steigt erst im Effekt, also nach der Hydration.
 */
export function useLauf(signatur: string) {
  const [lauf, setLauf] = useState(0);
  const vorher = useRef<string | null>(null);

  useEffect(() => {
    if (vorher.current !== null && vorher.current !== signatur) setLauf((l) => l + 1);
    vorher.current = signatur;
  }, [signatur]);

  const a = lauf % 2 ? "2" : "";
  // Bei reduzierter Bewegung gibt es nichts neu zu starten — die CSS-Bremse in
  // kursblatt.css schaltet die Animationen ohnehin ab; "none" spart den Namenswechsel.
  const aus = reduzierteBewegung();

  return {
    lauf,
    herz: aus ? "none" : `fl-herz${a}`,
    mitte: aus ? "none" : `fl-mitte${a}`,
    spalte: aus ? "none" : `fl-spalte${a}`,
    druck: aus ? "none" : `fl-druck${a}`,
    stempel: aus ? "none" : `fl-stempel${a}`,
    flach: aus ? "none" : `fl-stempelflach${a}`,
    zeichnen: aus ? "none" : `fl-zeichnen${a}`,
    knoten: aus ? "none" : `fl-knoten${a}`,
  };
}

export type Lauf = ReturnType<typeof useLauf>;
