"use client";

/**
 * Verlaufskurve mit Scrubber — im Kreditrechner die Restschuld über die Laufzeit.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:318-335, Rechnung
 * :500-504. Die Linie zeichnet sich einmal ein (fl-zeichnen, 1,6 s), danach folgt beim
 * Überfahren eine gestrichelte Magenta-Linie mit Punkt und Beschriftung.
 *
 * Achsen- und Jahresbeschriftungen stehen als echte `<text>` (README-Umsetzungshinweis);
 * nur die Scrubber-Fahne bleibt HTML — sie ist ein Kasten mit Grund und Innenabstand.
 */
import { useState } from "react";

export interface KurveProps {
  titel: string;
  /** Werte je Schritt; Index 0 ist der Startwert. */
  werte: number[];
  /** Beschriftung unter der Achse für Schritt i (nur an den Jahresmarken gerufen). */
  xText: (i: number) => string;
  /** Text der Scrubber-Fahne. */
  scrubText: (i: number, v: number) => string;
  /** Beschriftung der beiden Hilfslinien. */
  yText: (v: number) => string;
  /** Marken auf der Achse alle `takt` Schritte (Kredit: 12 Monate). */
  takt?: number;
  /** Animationsname aus useLauf, damit die Linie bei jedem Ergebnis neu zeichnet. */
  zeichnen?: string;
  /** Kurve ist bedienbar, sobald ein Ergebnis offen ist. */
  aktiv?: boolean;
}

const B = 640, H = 220, LINKS = 10, RECHTS = 630, UNTEN = 200, OBEN = 30;

export default function Verlaufskurve({
  titel, werte, xText, scrubText, yText, takt = 12, zeichnen = "fl-zeichnen", aktiv = true,
}: KurveProps) {
  const [stelle, setStelle] = useState<number | null>(null);

  const n = Math.max(1, werte.length - 1);
  const hoch = werte[0] || 1;
  const x = (i: number) => LINKS + (i / n) * (RECHTS - LINKS);
  const y = (v: number) => UNTEN - (v / hoch) * (UNTEN - OBEN);

  const punkte = werte.map((v, i) => [x(i), y(v)] as const);
  const pfad = punkte.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("");
  const flaeche = `${pfad} L${RECHTS} ${UNTEN} L${LINKS} ${UNTEN} Z`;

  const marken: number[] = [];
  for (let i = takt; i <= n; i += takt) marken.push(i);

  const sx = stelle !== null ? x(stelle) : 0;
  const sy = stelle !== null ? y(werte[stelle]) : 0;

  const fahren = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!aktiv) return;
    const k = e.currentTarget.getBoundingClientRect();
    const fr = ((e.clientX - k.left) / k.width) * B;
    const i = Math.round(Math.min(1, Math.max(0, (fr - LINKS) / (RECHTS - LINKS))) * n);
    if (i !== stelle) setStelle(i);
  };

  return (
    <div className="kb-kurve">
      <div className="kb-kurve__kopf">
        <span className="kb__kicker">{titel}</span>
        <span className="kb__hinweis kb-kurve__bedienhinweis">Mit der Maus über die Linie fahren</span>
        <span className="kb__hinweis kb-kurve__bedienhinweis kb-kurve__bedienhinweis--touch">Linie berühren für Details</span>
      </div>
      <div className="kb-kurve__buehne">
        <svg viewBox={`0 0 ${B} ${H}`} width="100%" className="kb-kurve__bild" onPointerMove={fahren} onPointerLeave={() => setStelle(null)}>
          <line x1={LINKS} y1={UNTEN} x2={RECHTS} y2={UNTEN} stroke="var(--ink)" strokeWidth={1} />
          <line x1={LINKS} y1={OBEN} x2={RECHTS} y2={OBEN} stroke="rgba(51,74,39,.15)" strokeWidth={1} />
          <line x1={LINKS} y1={(OBEN + UNTEN) / 2} x2={RECHTS} y2={(OBEN + UNTEN) / 2} stroke="rgba(51,74,39,.15)" strokeWidth={1} />
          <path d={flaeche} fill="rgba(51,74,39,.06)" />
          <path
            d={pfad} fill="none" stroke="var(--ink)" strokeWidth={1.5}
            pathLength={1} strokeDasharray={1} strokeDashoffset={1}
            className="kb-kurve__linie"
            style={zeichnen === "none" ? { strokeDashoffset: 0 } : { animation: `${zeichnen} 1.6s ease-out .4s both` }}
          />
          {marken.map((i) => (
            <g key={i}>
              <line x1={x(i).toFixed(1)} y1={UNTEN} x2={x(i).toFixed(1)} y2={UNTEN + 5} stroke="var(--ink)" strokeWidth={1} />
              <text x={x(i).toFixed(1)} y={H - 2} className="kb-kurve__achse" textAnchor="middle">{xText(i)}</text>
            </g>
          ))}
          <text x={LINKS + 2} y={OBEN - 4} className="kb-kurve__achse">{yText(hoch)}</text>
          <text x={LINKS + 2} y={(OBEN + UNTEN) / 2 - 4} className="kb-kurve__achse">{yText(hoch / 2)}</text>
          {stelle !== null && (
            <g className="kb-kurve__scrub">
              <line x1={sx.toFixed(1)} y1={20} x2={sx.toFixed(1)} y2={UNTEN} stroke="var(--pink)" strokeWidth={1} strokeDasharray="3 3" />
              <circle cx={sx.toFixed(1)} cy={sy.toFixed(1)} r={5} fill="var(--auf-tinte)" stroke="var(--pink)" strokeWidth={2} />
            </g>
          )}
        </svg>
        {stelle !== null && (
          <div
            className="kb-kurve__fahne"
            style={{ left: `${(sx / B) * 100}%`, transform: sx > B / 2 ? "translateX(-100%)" : "none" }}
          >
            {scrubText(stelle, werte[stelle])}
          </div>
        )}
      </div>
    </div>
  );
}
