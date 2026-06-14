"use client";

import { useEffect, useRef, useState } from "react";
import { useTransitionPhase } from "@/lib/usePageTransition";
import { subscribeMorph, getMorphPhase, type MorphPhase } from "@/lib/morphTransition";
import SiteLoader from "@/components/ui/SiteLoader";

// Erst nach dieser kurzen Schwelle anzeigen — sehr schnelle/gecachte Navigationen
// flashen keinen Loader.
const THRESHOLD_MS = 60;
// Mindestanzeigedauer: einmal sichtbar, mind. so lange zeigen (sonst „Blitz" bei
// schnellen Ladezeiten → wirkt wie „nicht sichtbar").
const MIN_VISIBLE_MS = 700;

/**
 * Zentraler Loader während des „pending"-Fensters einer Seiten-Transition
 * (zwischen Ausfaden der alten und Einfaden der neuen Seite).
 */
export default function PageTransitionLoader() {
  const phase = useTransitionPhase();
  const [morphPhase, setMorphPhase] = useState<MorphPhase>(getMorphPhase());
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAt = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => subscribeMorph(setMorphPhase), []);

  useEffect(() => {
    // Während eines aktiven Card→Artikel-Morphs bleibt die Phase „pending" bis der
    // Morph fertig ist — der Loader würde sonst über den Morph poppen.
    if (phase === "pending" && morphPhase === "idle") {
      if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
      timerRef.current = setTimeout(() => { shownAt.current = Date.now(); setShow(true); }, THRESHOLD_MS);
    } else {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      // Mindestanzeigedauer einhalten, damit der Loader nicht nur aufblitzt.
      setShow((cur) => {
        if (!cur) return false;
        const elapsed = Date.now() - shownAt.current;
        if (elapsed >= MIN_VISIBLE_MS) return false;
        hideTimer.current = setTimeout(() => setShow(false), MIN_VISIBLE_MS - elapsed);
        return true;
      });
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
      <SiteLoader size={48} />
    </div>
  );
}
