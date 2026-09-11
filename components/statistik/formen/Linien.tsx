"use client";

/**
 * Liniendiagramm — Design A v2, Handoff Zeile 649–668, Logik 1901–1906.
 *
 * Eine oder zwei Linien auf einem 640×220-Feld. Die Pfade zeichnen sich über
 * stroke-dashoffset; unter jedem Stützpunkt steht ein Fallstrich bis zur Grundlinie.
 * Der letzte Punkt der ersten Reihe ist magenta — er ist der Wert, um den es geht.
 */
import type { StatLinien } from "@/lib/statistik/schema";
import { useZeichnen } from "@/lib/statistik/useZeichnen";

const LINKS = 60, RECHTS = 620, OBEN = 60, UNTEN = 180;
const REIHENFARBE = ["var(--ink)", "var(--green)"];

export default function Linien({ st }: { st: StatLinien }) {
  const [wurzel, an] = useZeichnen<HTMLDivElement>();
  const alle = st.reihen.flatMap((r) => r.werte);
  const min = st.yAchse?.min ?? Math.floor(Math.min(...alle));
  const max = st.yAchse?.max ?? Math.ceil(Math.max(...alle));
  const n = st.achse.length;

  const X = (i: number) => (n > 1 ? LINKS + (i * (RECHTS - LINKS)) / (n - 1) : (LINKS + RECHTS) / 2);
  const Y = (v: number) => (max > min ? UNTEN - ((v - min) / (max - min)) * (UNTEN - OBEN) : UNTEN);
  const pfad = (werte: number[]) => werte.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");

  const haupt = st.reihen[0];
  const e = st.einheit ? ` ${st.einheit}` : "";
  const notizY = st.reihen[1] ? Y(st.reihen[1].werte[n - 1]) - 6 : OBEN;

  return (
    <div className="st-linien" ref={wurzel}>
      {haupt.werte.map((v, i) => (
        <b key={`w${i}`} className="st-linien__wert" style={{ left: `${(X(i) / 640) * 100}%`, top: `${((Y(v) - 8) / 220) * 100}%`, color: i === n - 1 ? "var(--pink)" : "var(--ink)" }}>
          {v}{e}
        </b>
      ))}
      {st.achse.map((a, i) => (
        <span key={`a${i}`} className="st-linien__achse" style={{ left: `${(X(i) / 640) * 100}%` }}>{a}</span>
      ))}
      {st.notiz && <span className="st-linien__notiz" style={{ top: `${(notizY / 220) * 100}%` }}>{st.notiz}</span>}
      <svg viewBox="0 0 640 220" role="img" aria-label={st.reihen.map((r) => `${r.label}: ${r.werte.join(", ")}`).join("; ")}>
        <line x1={40} y1={UNTEN} x2={RECHTS} y2={UNTEN} className="st-linien__grund" />
        <line x1={40} y1={120} x2={RECHTS} y2={120} className="st-linien__raster" />
        <line x1={40} y1={OBEN} x2={RECHTS} y2={OBEN} className="st-linien__raster" />
        <text x={36} y={UNTEN + 4} textAnchor="end" className="st-linien__skala">{min}</text>
        <text x={36} y={124} textAnchor="end" className="st-linien__skala">{Math.round((min + max) / 2)}</text>
        <text x={36} y={OBEN + 4} textAnchor="end" className="st-linien__skala">{max}</text>
        {st.reihen.map((r, j) => (
          <path
            key={r.label} d={pfad(r.werte)} fill="none" pathLength={1} className="st-linien__pfad"
            stroke={r.farbe || REIHENFARBE[j]} strokeWidth={j ? 1 : 1.5}
            style={{ strokeDashoffset: an ? 0 : 1, transitionDelay: `${j * 0.2}s` }}
          />
        ))}
        {haupt.werte.map((v, i) => (
          <g key={`p${i}`}>
            <line x1={X(i)} y1={Y(v)} x2={X(i)} y2={UNTEN} className="st-linien__fall" />
            <circle cx={X(i)} cy={Y(v)} r={3.5} className="st-linien__punkt" stroke={i === n - 1 ? "var(--pink)" : "var(--ink)"} />
          </g>
        ))}
      </svg>
    </div>
  );
}
