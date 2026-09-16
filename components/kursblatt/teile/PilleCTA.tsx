/**
 * Die Pille — der Haupt-Knopf des Kursblatts.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:140-144 (Gewinner,
 * 48 px mit Hover-Füllung), :194-198 (Listenzeile, 42 px ohne Outline), :299
 * („Ausrechnen“, fester Knopf, der beim Rechnen schrumpft), :349 („Angebote ansehen“).
 *
 * 🚨 Die Form selbst steht seit dem 16.09.2026 in app/knoepfe.css als `.pille` und gilt
 * für die ganze Seite — hier bleibt nur, was das Kursblatt eigenhändig mitbringt: die
 * drei Glyphen und die Werkzeugfarbe.
 *
 * 🚨 Die Hover-Füllung braucht KEIN JavaScript. Der Prototyp führt dafür `ctaFill` und
 * `hoverTop` im Zustand (K:482, :485) — nötig, weil sie auch dann läuft, wenn die MAUS
 * ÜBER DER ZEILE steht, nicht über der Pille. In CSS ist genau das ein Nachfahren-
 * Selektor: `.kb__zeile:hover .pille__fuell { width: 100% }`. Zwei Zustandsfelder
 * weniger, und die Füllung läuft auch ohne Hydration.
 */
import Link from "next/link";
import type { ReactNode } from "react";

export type Glyph = "extern" | "gleich" | "hoch";

const PFAD: Record<Glyph, ReactNode> = {
  // K:143 — Pfeil nach außen: „Zum Anbieter“.
  extern: <path d="M4 12L12 4M6 4h6v6" />,
  // K:299 — Gleichheitszeichen: „Ausrechnen“.
  gleich: <path d="M3 6h10M3 10h10" />,
  // K:349 — Pfeil nach oben: „Angebote ansehen“, zurück in den Vergleich.
  hoch: <path d="M8 13V3M4 7l4-4 4 4" />,
};

export interface PilleProps {
  text: string;
  glyph: Glyph;
  /** Farbe des runden Knopfes und der Füllung. */
  werkzeug: "tuerkis" | "magenta";
  href?: string;
  onClick?: () => void;
  /** 48 px mit Outline (Vorgabe) oder 42 px ohne (Listenzeile). */
  klein?: boolean;
  /** Türkis von rechts einlaufen lassen — nur dort, wo die Pille eine Zeile abschließt. */
  fuellung?: boolean;
  /** Im schmalen Satz nur den Knopf zeigen. */
  nurKnopf?: boolean;
  /** Knopf schrumpft, solange gerechnet wird (K:299). */
  schrumpft?: boolean;
  rel?: string;
  target?: string;
  ariaLabel?: string;
}

export default function PilleCTA({
  text, glyph, werkzeug, href, onClick, klein = false, fuellung = false,
  nurKnopf = false, schrumpft = false, rel, target, ariaLabel,
}: PilleProps) {
  const klassen = [
    "pille",
    klein ? "pille--klein" : "",
    fuellung ? "pille--fuellt" : "",
    nurKnopf ? "pille--nur-knopf" : "",
  ].filter(Boolean).join(" ");

  const inneres = (
    <>
      {fuellung && <i className="pille__fuell" aria-hidden="true" />}
      <span className="pille__text">{text}</span>
      <span className="pille__scheibe" data-schrumpft={schrumpft ? "an" : "aus"} aria-hidden="true">
        <svg width={klein ? 14 : 16} height={klein ? 14 : 16} viewBox="0 0 16 16" fill="none" stroke="var(--auf-tinte)" strokeWidth={glyph === "gleich" ? 2.2 : 2} strokeLinecap="round" strokeLinejoin="round">
          {PFAD[glyph]}
        </svg>
      </span>
    </>
  );

  const stil = { "--pille-farbe": werkzeug === "magenta" ? "var(--pink)" : "var(--tuerkis)" } as React.CSSProperties;

  if (href) {
    return (
      <Link href={href} className={klassen} style={stil} rel={rel} target={target} aria-label={ariaLabel ?? text}>
        {inneres}
      </Link>
    );
  }
  return (
    <button type="button" className={klassen} style={stil} onClick={onClick} aria-label={ariaLabel ?? text}>
      {inneres}
    </button>
  );
}
