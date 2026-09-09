"use client";

/**
 * Die Haarlinie an der Unterkante des Zeitungskopfs: wie weit der Leser im Dokument ist.
 *
 * Bewusst keine eigene Anzeige mit Zahl — im Design ist das eine 1-px-Linie, die man
 * nur wahrnimmt, wenn man sie sucht. Sie belohnt das Weiterlesen, ohne davon abzulenken.
 *
 * 🚨 `transform: scaleX()`, nicht `width`. Die Linie läuft bei jedem Scrollbild neu;
 * eine Breitenänderung hieße Layout und Paint in jedem Bild, eine Transformation
 * erledigt der Compositor. Dieselbe Regel wie am Fortschritts-Gleis (Fortschritt.tsx).
 *
 * 🚨 Und kein React-State: der Wert ändert sich im Bildtakt, ein Rendering pro Bild
 * zöge den halben Kopf samt Register mit. Der Balken wird direkt am DOM gesetzt.
 */
import { useEffect, useRef } from "react";

export default function Lesefortschritt() {
  const balken = useRef<HTMLElement>(null);

  useEffect(() => {
    let geplant = 0;
    const messen = () => {
      geplant = 0;
      const el = balken.current;
      if (!el) return;
      const weite = document.documentElement.scrollHeight - window.innerHeight;
      const anteil = weite > 0 ? Math.min(1, Math.max(0, window.scrollY / weite)) : 0;
      el.style.transform = `scaleX(${anteil})`;
      // Ganz am Anfang stört die Linie mehr, als sie hilft — sie erscheint erst, wenn
      // es etwas zu berichten gibt.
      el.style.opacity = anteil > 0.005 ? "1" : "0";
    };
    const anstossen = () => { if (!geplant) geplant = requestAnimationFrame(messen); };
    messen();
    window.addEventListener("scroll", anstossen, { passive: true });
    window.addEventListener("resize", anstossen, { passive: true });
    return () => {
      window.removeEventListener("scroll", anstossen);
      window.removeEventListener("resize", anstossen);
      if (geplant) cancelAnimationFrame(geplant);
    };
  }, []);

  return <i className="lesefortschritt" ref={balken} aria-hidden="true" />;
}
