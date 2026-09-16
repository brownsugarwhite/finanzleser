"use client";

/**
 * Die Zinskurve — der beste Wert je Laufzeit, darunter der Durchschnitt.
 *
 * Vorlage: „Finanzleser Festgeld & Eingaben - Kursblatt.dc.html“:74-88, Rechnung
 * :230-236. Maße 1:1: SVG 640×210, Grundlinie y 190 von x 30 bis 610, Punkte auf
 * x = 70 + i/(n−1)·540, Höhe y = 190 − (v−lo)/(hi−lo)·150, Gitter in 0,5-Schritten.
 *
 * Die Punkte sind HTML-Knöpfe über dem SVG, keine `<circle>`: sie brauchen 44 px
 * Tastfläche, Fokus und `aria-label` — alles, was ein SVG-Kreis erst mit Umwegen bekommt.
 *
 * 🚨 Die Kurve zeigt den ZINS, nicht den Ertrag. Warum, steht bei `zinskurve()` in
 * lib/financeads/kursblatt.ts: die Laufzeit-Varianten des Schnappschusses liegen alle
 * beim Basisbetrag, und der Zins ist betragsneutral, der Ertrag nicht.
 */
import { Fragment, useState } from "react";
import type { KurveWert } from "@/lib/financeads/kursblatt";
import type { SpalteDef } from "@/lib/financeads/typen";
import { formatKennwert } from "@/lib/financeads/format";
import { fmtProzent } from "@/lib/kursblatt/zahl";
import { useEng } from "@/lib/kursblatt/useEng";

export interface ZinskurveProps {
  punkte: KurveWert[];
  /** Spalte, deren Werte aufgetragen sind — sie liefert die Formatierung. */
  spalte: SpalteDef;
  /** Der gerade gewählte Parameterwert („36“). */
  wert: string;
  onWert: (wert: string) => void;
  /** Animationsname aus useLauf für das Zeichnen der Linie. */
  zeichnen: string;
}

/**
 * Beschriftung der Kurve.
 *
 * 🚨 Nicht `formatKennwert`: das schreibt ganze Zahlen ohne Nachkomma („3 %“), und in
 * einer Achse, die in halben Punkten zählt, steht dann „3 %“ neben „2,50 %“. Der Handoff
 * gibt beide Stellenzahlen ausdrücklich vor — Gitter eine Stelle, Punktwert zwei
 * (F:231, F:222).
 */
function achsenText(spalte: SpalteDef, wert: number, dez: number): string {
  return spalte.art === "prozent" ? fmtProzent(wert, dez) : formatKennwert({ ...spalte, ab: false }, wert);
}

/** F:232 — Skala in halben Prozentpunkten, unten mindestens bis 1,5. */
function skala(punkte: KurveWert[]): { lo: number; hi: number; linien: number[] } {
  const lo = Math.floor(Math.min(...punkte.map((p) => p.schnitt), 1.5) * 2) / 2;
  const hi = Math.ceil(Math.max(...punkte.map((p) => p.best)) * 2) / 2 + 0.25;
  const linien: number[] = [];
  for (let g = Math.ceil(lo * 2) / 2; g <= hi; g += 0.5) linien.push(Number(g.toFixed(1)));
  return { lo, hi, linien };
}

export default function Zinskurve({ punkte, spalte, wert, onWert, zeichnen }: ZinskurveProps) {
  const [zeiger, setZeiger] = useState<number | null>(null);
  const [ref, eng] = useEng<HTMLDivElement>();
  if (punkte.length < 3) return null;

  const { lo, hi, linien } = skala(punkte);
  const X = (i: number) => 70 + (i / (punkte.length - 1)) * 540;
  const Y = (v: number) => 190 - ((v - lo) / (hi - lo)) * 150;
  const pfad = (hole: (p: KurveWert) => number) =>
    punkte.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(hole(p)).toFixed(1)}`).join("");
  // Der Knopf sitzt in Prozent über dem SVG, damit er jede Satzbreite mitgeht.
  const proz = (v: number, ganz: number) => `${((v / ganz) * 100).toFixed(2)}%`;
  const aktiv = punkte.findIndex((p) => p.wert === wert);

  return (
    <div className="kb-zinskurve" ref={ref}>
      {/* 🚨 Alles, was in PROZENT auf dem viewBox-Raster sitzt, gehört in einen Kasten, der
          GENAU so hoch ist wie das SVG. Vorher lagen Punkte, Werte und Gitterzahlen direkt
          in `.kb-zinskurve` — und die trägt unten 22 px Polster für die Achsenbeschriftung.
          `top: 90,48 %` bezog sich damit auf SVG + Polster statt aufs SVG: gemessen am
          16.09.2026 saß jeder Punkt 20 px zu tief, also sichtbar UNTER seiner eigenen
          Linie, und die unterste Gitterzahl stand unter der Achse statt auf ihr. */}
      <div className="kb-zinskurve__feld">
      <svg viewBox="0 0 640 210" width="100%" aria-hidden="true">
        <line x1="30" y1="190" x2="610" y2="190" stroke="var(--ink)" strokeWidth={1} />
        {linien.map((g) => (
          <line key={g} x1="30" y1={Y(g).toFixed(1)} x2="610" y2={Y(g).toFixed(1)} stroke="var(--ink-12)" strokeWidth={1} />
        ))}
        <path className="kb-zinskurve__schnitt" d={pfad((p) => p.schnitt)} />
        <path
          className="kb-zinskurve__best"
          d={pfad((p) => p.best)}
          pathLength={1}
          style={{ animation: zeichnen === "none" ? undefined : `${zeichnen} 1.4s ease-out .2s both` }}
        />
        {aktiv >= 0 && (
          <line
            className="kb-zinskurve__stiel"
            x1={X(aktiv).toFixed(1)} y1={Y(punkte[aktiv].best).toFixed(1)}
            x2={X(aktiv).toFixed(1)} y2="190"
          />
        )}
      </svg>

      {linien.map((g) => (
        <span key={g} className="kb-zinskurve__gitter-wert" style={{ top: proz(Y(g), 210) }}>
          {achsenText(spalte, g, 1)}
        </span>
      ))}

      {punkte.map((p, i) => {
        const ist = p.wert === wert;
        const hell = zeiger === i;
        return (
          <Fragment key={p.wert}>
            <button
              type="button"
              className="kb-zinskurve__punkt"
              data-ist={ist ? "an" : "aus"}
              data-hell={hell ? "an" : "aus"}
              style={{ left: proz(X(i), 640), top: proz(Y(p.best), 210) }}
              aria-label={`${p.label} wählen – bis ${achsenText(spalte, p.best, 2)}`}
              aria-pressed={ist}
              onClick={() => onWert(p.wert)}
              onMouseEnter={() => setZeiger(i)}
              onMouseLeave={() => setZeiger(null)}
              onFocus={() => setZeiger(i)}
              onBlur={() => setZeiger(null)}
            />
            <span
              className="kb-zinskurve__wert"
              data-ist={ist ? "an" : "aus"}
              data-hell={hell ? "an" : "aus"}
              style={{ left: proz(X(i), 640), top: proz(Y(p.best) - 12, 210) }}
              aria-hidden="true"
            >
              {achsenText(spalte, p.best, 2)}
            </span>
          </Fragment>
        );
      })}
      </div>

      {/* Die Achsenbeschriftung steht UNTER dem Feld — sie braucht Platz, den das SVG
          nicht hat, und darf die Prozentrechnung darin nicht verschieben. */}
      {punkte.map((p, i) => (
        <span
          key={`a${p.wert}`}
          className="kb-zinskurve__achse"
          data-ist={p.wert === wert ? "an" : "aus"}
          style={{ left: proz(X(i), 640) }}
          aria-hidden="true"
        >
          {eng ? p.kurz : p.label}
        </span>
      ))}
    </div>
  );
}
