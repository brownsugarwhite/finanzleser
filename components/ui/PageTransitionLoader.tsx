"use client";

import { useEffect, useRef, useState } from "react";
import { useTransitionPhase } from "@/lib/usePageTransition";
import { subscribeMorph, getMorphPhase, type MorphPhase } from "@/lib/morphTransition";
import CircularLoader from "@/components/ui/CircularLoader";

// Erst nach dieser Schwelle anzeigen — schnelle/gecachte Navigationen flashen
// keinen Spinner.
const THRESHOLD_MS = 130;

/**
 * Zentraler Loader während des „pending"-Fensters einer Seiten-Transition
 * (zwischen Ausfaden der alten und Einfaden der neuen Seite).
 */
export default function PageTransitionLoader() {
  const phase = useTransitionPhase();
  const [morphPhase, setMorphPhase] = useState<MorphPhase>(getMorphPhase());
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => subscribeMorph(setMorphPhase), []);

  useEffect(() => {
    // Während eines aktiven Card→Artikel-Morphs bleibt die Phase „pending" bis der
    // Morph fertig ist — der Loader würde sonst über den Morph poppen.
    if (phase === "pending" && morphPhase === "idle") {
      timerRef.current = setTimeout(() => setShow(true), THRESHOLD_MS);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      setShow(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, morphPhase]);

  if (!show) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 9000,
      }}
    >
      <CircularLoader size={40} stroke={3} />
    </div>
  );
}
