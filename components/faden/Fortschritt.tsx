"use client";

/**
 * Fortschritt im Faden: eine gestrichelte Linie in der Gasse zwischen linker Randspalte
 * und Mittelspalte, ein Kreis je Kapitel und ein Querstrich je Abschnitt.
 *
 * Das Gleis reicht vom Kopf der linken Randspalte bis zum Ende des Stroms — es steht
 * im Dokument still, während der Leser daran vorbeiscrollt. Bewegung entsteht allein durch den Füllbalken, und der zieht
 * bewusst nach: er läuft dem Sollwert entgegen, statt hart daran zu kleben.
 *
 * 🚨 Drei Dinge halten das Nachziehen weich — fällt eines weg, ruckelt es:
 *
 *  1. **React rendert hier nicht mit.** Der Balken wird im Bildtakt direkt am DOM
 *     gesetzt. Über `useState` wäre es ein React-Rendering pro Bild, samt Abgleich
 *     aller Marken — bei einem langen Ratgeber sind das schnell 20 Knoten.
 *  2. **`transform: scaleY()` statt `height`.** Höhe ändern heißt Layout und Paint in
 *     jedem Bild; eine Transformation erledigt der Compositor.
 *  3. **Glättung über die Zeit, nicht über Bilder.** Ein fester Anteil je Bild liefe
 *     auf einem 120-Hz-Schirm doppelt so schnell wie auf 60 Hz und würde bei jedem
 *     ausgelassenen Bild stocken. `dt` macht die Bewegung geräteunabhängig.
 *
 * Dazu liest die Schleife nur `scrollY` — die Lage des Gleises steht aus der Messung
 * fest. Ein `getBoundingClientRect()` im Scroll-Handler wäre ein erzwungenes Layout
 * bei jedem Scroll-Ereignis.
 *
 * Nur ab 1440 px sichtbar (darunter sind die Randspalten Schubladen, die Gasse fehlt);
 * `prefers-reduced-motion` schaltet Nachziehen und Puls ab.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

interface Marke { oben: number; art: "kapitel" | "abschnitt" }
interface Mass { oben: number; hoehe: number; dokOben: number; marken: Marke[] }

/** Anteil der Fensterhöhe, an dem die Lesestelle angenommen wird. */
const LESELINIE = 0.42;
/** Anteil der Reststrecke je 60-Hz-Bild. Höher = strafferes Nachziehen. */
const GLAETTE = 0.28;
const BILD = 1000 / 60;

export default function Fortschritt() {
  const pathname = usePathname();
  const [mass, setMass] = useState<Mass | null>(null);
  const fuell = useRef<HTMLElement | null>(null);
  const marken = useRef<(HTMLElement | null)[]>([]);
  const massRef = useRef<Mass | null>(null);
  massRef.current = mass;

  /** Gleis, Kapitel und Abschnitte einmessen. */
  const messen = useCallback(() => {
    const faden = document.getElementById("faden");
    const strom = document.getElementById("strom");
    if (!faden || !strom) return;
    const f = faden.getBoundingClientRect();
    const s = strom.getBoundingClientRect();
    // 🚨 Das Gleis beginnt NICHT am Strom, sondern an der Randspalte daneben.
    //
    // Auf der Startseite steht der Hero im Strom (FadenLanding rendert ihn dort), die
    // Randspalten fangen aber erst darunter an (`body[data-landing] .rand { margin-top }`).
    // Am Strom gemessen ragte das Gleis deshalb über die volle Hero-Höhe in eine Gasse
    // hinauf, die es dort gar nicht gibt — links davon stand nichts.
    // Als Schublade (mobil, position: fixed) taugt die Randspalte nicht als Maß.
    const rand = document.getElementById("randLinks");
    const r = rand && getComputedStyle(rand).position !== "fixed" ? rand.getBoundingClientRect() : null;
    const anfang = r && r.height ? Math.max(s.top, r.top) : s.top;
    const liste: Marke[] = [];
    strom.querySelectorAll<HTMLElement>(".kapitel").forEach((k) => {
      // Der Kreis sitzt auf der Haarlinie der Kapitelkopfzeile, nicht an der Oberkante
      // des Kapitels: die Linie liegt auf der Mittelachse der Kopfzeile (app/faden.css,
      // `.kapitel__kopf` mit `align-items: center`), und dorthin gehört die Marke, damit
      // Gleis und Kopfzeile auf einer Höhe stehen.
      const kopf = k.querySelector<HTMLElement>(".kapitel__kopf");
      const kr = (kopf ?? k).getBoundingClientRect();
      liste.push({ oben: (kopf ? (kr.top + kr.bottom) / 2 : kr.top) - anfang, art: "kapitel" });
      // Abschnitte aus derselben Quelle wie die Verlaufsleiste (`[data-toc-titel]`,
      // siehe lib/faden/useAbschnittAktiv.ts) — so zeigen Gleis und Liste dasselbe.
      // Zugeklappte Kapitel haben keinen Inhalt im DOM und liefern folgerichtig nichts.
      k.querySelectorAll<HTMLElement>("[data-toc-titel]").forEach((a) => {
        liste.push({ oben: a.getBoundingClientRect().top - anfang, art: "abschnitt" });
      });
    });
    liste.sort((a, b) => a.oben - b.oben);
    // Marken oberhalb des Gleisanfangs (auf der Startseite alles, was im Hero liegt)
    // hätten eine negative Lage und haengten über dem Gleis in der Luft.
    setMass({ oben: anfang - f.top, hoehe: s.bottom - anfang, dokOben: anfang + window.scrollY, marken: liste.filter((m) => m.oben >= 0) });
  }, []);

  useEffect(() => {
    messen();
    const strom = document.getElementById("strom");
    if (!strom) return;
    // Der Strom wächst und schrumpft: Kapitel klappen auf, Leo antwortet, Werkzeuge laden.
    const ro = new ResizeObserver(() => messen());
    ro.observe(strom);
    const mo = new MutationObserver(() => messen());
    mo.observe(strom, { childList: true });
    window.addEventListener("resize", messen);
    return () => { ro.disconnect(); mo.disconnect(); window.removeEventListener("resize", messen); };
  }, [messen, pathname]);

  useEffect(() => {
    const m = massRef.current;
    if (!m || !m.hoehe) return;
    const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ist = -1;
    let lauf: number | null = null;
    let zuletzt = 0;
    // Klassen nur bei Wechsel anfassen — sonst schreibt die Schleife 20-mal je Bild
    // denselben Wert und macht den Stilrechner unnötig wach.
    let standKapitel = -2;
    let standAbschnitt = -2;

    const zeichnen = (wert: number) => {
      if (fuell.current) fuell.current.style.transform = `scaleY(${wert / m.hoehe})`;
      let kap = -1;
      let abs = -1;
      m.marken.forEach((mk, i) => {
        if (mk.oben > wert + 1) return;
        if (mk.art === "kapitel") { kap = i; abs = -1; } else abs = i;
      });
      if (kap === standKapitel && abs === standAbschnitt) return;
      m.marken.forEach((mk, i) => {
        const el = marken.current[i];
        if (!el) return;
        el.classList.toggle("erreicht", mk.oben <= wert + 1);
        el.classList.toggle("jetzt", i === kap || i === abs);
      });
      standKapitel = kap;
      standAbschnitt = abs;
    };

    const sollwert = () =>
      Math.max(0, Math.min(m.hoehe, window.scrollY + window.innerHeight * LESELINIE - m.dokOben));

    const schritt = (zeit: number) => {
      const dt = Math.min(64, zuletzt ? zeit - zuletzt : BILD);
      zuletzt = zeit;
      const ziel = sollwert();
      // Zeitbasierte exponentielle Glättung: derselbe Verlauf bei 60, 120 oder 144 Hz.
      const anteil = 1 - Math.pow(1 - GLAETTE, dt / BILD);
      ist += (ziel - ist) * anteil;
      if (Math.abs(ziel - ist) < 0.3) { ist = ziel; zeichnen(ist); lauf = null; return; }
      zeichnen(ist);
      lauf = requestAnimationFrame(schritt);
    };

    const wecken = () => {
      if (reduziert) { ist = sollwert(); zeichnen(ist); return; }
      if (lauf === null) { zuletzt = 0; lauf = requestAnimationFrame(schritt); }
    };

    ist = sollwert();
    zeichnen(ist);
    window.addEventListener("scroll", wecken, { passive: true });
    window.addEventListener("resize", wecken);
    return () => {
      window.removeEventListener("scroll", wecken);
      window.removeEventListener("resize", wecken);
      if (lauf !== null) cancelAnimationFrame(lauf);
    };
  }, [mass]);

  if (!mass || mass.marken.length === 0) return null;

  return (
    <div className="fortschritt" style={{ top: mass.oben, height: mass.hoehe }} aria-hidden="true">
      <i className="fortschritt__gleis" />
      <i
        className="fortschritt__fuell"
        ref={(el) => { fuell.current = el; }}
        style={{ height: mass.hoehe, transform: "scaleY(0)" }}
      />
      {mass.marken.map((mk, i) => (
        <i
          key={i}
          ref={(el) => { marken.current[i] = el; }}
          className={mk.art === "kapitel" ? "fortschritt__punkt" : "fortschritt__strich"}
          style={{ top: mk.oben }}
        />
      ))}
    </div>
  );
}
