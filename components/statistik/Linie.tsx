"use client";

/**
 * Linienchart für Jahresreihen (siehe lib/statistik/darstellung.ts). Eine Linie zeigt,
 * was Säulen verschweigen: die Richtung zwischen zwei Punkten.
 *
 * Der Pfad zeichnet sich beim Auftritt — `pathLength="1"` plus `data-zeichnen`, gestartet
 * von lib/faden/erscheinen.ts. Deshalb braucht die Komponente selbst keine Animation.
 *
 * 🚨 Die Achse beginnt NICHT bei null, sondern eine Spanne unter dem kleinsten Wert.
 * Bei Beiträgen von 58 auf 76 € wäre eine Nullachse ehrlich, aber unlesbar — die
 * Bewegung verschwände. Dafür trägt die Achse ihre Werte sichtbar, und der Nullpunkt
 * ist als solcher erkennbar, wenn er im Bild liegt.
 */
import type { Segment } from "./StatistikKarte";
import { formatWert } from "@/lib/statistik/formeln";

const B = 640;
const H = 220;
const RAND = { links: 52, rechts: 18, oben: 18, unten: 34 };

export default function Linie({ segmente, einheit }: { segmente: Segment[]; einheit?: string }) {
  const werte = segmente.filter((s) => !s.aus && !s.ihr);
  if (werte.length < 2) return null;

  const zahlen = werte.map((s) => s.wert);
  const roh = { min: Math.min(...zahlen), max: Math.max(...zahlen) };
  // Etwas Luft nach oben und unten, damit die Linie nicht am Rahmen klebt.
  const spanne = roh.max - roh.min || Math.abs(roh.max) || 1;
  const min = roh.min - spanne * 0.18;
  const max = roh.max + spanne * 0.18;

  const x = (i: number) => RAND.links + (i / (werte.length - 1)) * (B - RAND.links - RAND.rechts);
  const y = (v: number) => H - RAND.unten - ((v - min) / (max - min)) * (H - RAND.oben - RAND.unten);

  const punkte = werte.map((s, i) => ({ s, x: x(i), y: y(s.wert), letzter: i === werte.length - 1 }));
  const pfad = punkte.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const gitter = [0.5, 1].map((t) => min + (max - min) * t);

  // Der Pfad zeichnet sich, sobald der Rahmen im Bild ist (lib/faden/erscheinen.ts).
  return (
    <div className="linie" data-erscheint="herz">
      <svg viewBox={`0 0 ${B} ${H}`} className="linie__svg" role="img" aria-label={werte.map((s) => `${s.label}: ${formatWert(s.wert, einheit)}`).join(", ")}>
        {/* Gitterlinien gestrichelt, die Grundlinie durchgezogen. */}
        {gitter.map((v, i) => (
          <line key={i} x1={RAND.links} x2={B - RAND.rechts} y1={y(v)} y2={y(v)} className="linie__gitter" />
        ))}
        <line x1={RAND.links} x2={B - RAND.rechts} y1={H - RAND.unten} y2={H - RAND.unten} className="linie__achse" />
        {[min + (max - min) * 0.5, max - spanne * 0.18].map((v, i) => (
          <text key={i} x={RAND.links - 8} y={y(v) + 4} className="linie__achsentext" textAnchor="end">{formatWert(Math.round(v), einheit)}</text>
        ))}

        <path d={pfad} className="linie__pfad" data-zeichnen="" pathLength="1" />

        {punkte.map((p) => (
          <g key={p.s.label}>
            <line x1={p.x} x2={p.x} y1={p.y} y2={H - RAND.unten} className="linie__fall" />
            <circle cx={p.x} cy={p.y} r="3.5" className={"linie__punkt" + (p.letzter ? " linie__punkt--letzter" : "")} />
            <text x={p.x} y={H - RAND.unten + 16} className="linie__label" textAnchor="middle">{p.s.label}</text>
            {p.letzter && <text x={p.x} y={p.y - 10} className="linie__wert" textAnchor="end">{formatWert(p.s.wert, einheit)}</text>}
          </g>
        ))}
      </svg>
    </div>
  );
}
