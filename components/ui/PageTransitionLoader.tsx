"use client";

import { useEffect, useRef, useState } from "react";
import { useTransitionPhase } from "@/lib/usePageTransition";
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
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phase === "pending") {
      timerRef.current = setTimeout(() => setShow(true), THRESHOLD_MS);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      setShow(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase]);

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
