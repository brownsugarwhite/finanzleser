"use client";

/**
 * Das Siegel — „BESTWERT“ über dem Rahmen des Gewinners, klein auch in der Listenzeile.
 *
 * 🚨 Der Glanz ist eine FOLIE, kein Aufdruck. Das Schimmerbild steht im Fenster still,
 * während das Siegel darüber hinwegscrollt — daraus entsteht der Eindruck, das Licht
 * breche sich je nach Blickwinkel anders. Ein mitscrollender Verlauf sieht dagegen aus
 * wie gedruckt.
 *
 * 🚨 `background-attachment: fixed` kann das hier NICHT leisten: es bezieht sich nur
 * dann aufs Fenster, wenn KEIN Vorfahr eine `transform` trägt — und das Siegel ist
 * gedreht (und wird beim Rechnen zusätzlich animiert). Ein transformierter Vorfahr macht
 * sich selbst zum Bezugsrahmen, die Folie klebte wieder am Siegel. Deshalb wird die
 * Verschiebung gemessen: `background-position` folgt der Fensterposition des Siegels.
 *
 * Billig gehalten: ein passiver Scroll-Zuhörer, auf einen Frame gedrosselt, und er läuft
 * nur, solange das Siegel überhaupt im Bild ist (IntersectionObserver).
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:123 (groß, rotate −11°,
 * fl-stempel mit .5 s Verzug) und :191 (klein, rotate −6°, nur im breiten Satz), in der
 * Fassung von Runde 2 („Siegel statt Stempel“).
 */
import { useEffect, useRef } from "react";

export default function Siegel({
  text, klein = false, animation,
}: {
  text: string;
  klein?: boolean;
  /** Name der Keyframes aus useLauf — wechselt bei jeder Neuberechnung, damit sie neu läuft. */
  animation?: string;
}) {
  const folie = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = folie.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let imBild = false;
    let geplant = 0;
    const setzen = () => {
      geplant = 0;
      const r = el.getBoundingClientRect();
      // Der Farbort folgt der Fensterposition: 0 % am oberen Rand, 100 % am unteren.
      // Waagerecht dasselbe, damit auch ein breites Fenster die Folie kippen lässt.
      const y = (r.top + r.height / 2) / window.innerHeight;
      const x = (r.left + r.width / 2) / window.innerWidth;
      el.style.backgroundPosition = `${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%`;
    };
    const anstossen = () => { if (imBild && !geplant) geplant = requestAnimationFrame(setzen); };

    const io = new IntersectionObserver(([e]) => { imBild = e.isIntersecting; anstossen(); }, { rootMargin: "80px" });
    io.observe(el);
    window.addEventListener("scroll", anstossen, { passive: true });
    window.addEventListener("resize", anstossen, { passive: true });
    setzen();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", anstossen);
      window.removeEventListener("resize", anstossen);
      if (geplant) cancelAnimationFrame(geplant);
    };
  }, []);

  return (
    <span
      className={"kb-siegel" + (klein ? " kb-siegel--klein" : "")}
      style={animation && animation !== "none" ? { animation: `${animation} .7s var(--kurve) .5s both` } : undefined}
    >
      <i className="kb-siegel__folie" ref={folie} aria-hidden="true" />
      <b className="kb-siegel__text">{text}</b>
    </span>
  );
}
