"use client";

/**
 * Spannen — Design A v2, Handoff Zeile 986–1004, Logik 1879–1881.
 *
 * Je Zeile ein Balken von min bis max auf gemeinsamer Skala, darauf der Median als
 * magentafarbener Punkt. Der Balken fährt von links aus, der Punkt setzt sich mit
 * Überschwung darauf.
 */
import type { StatSpannen } from "@/lib/statistik/schema";
import { useZeichnen } from "@/lib/statistik/useZeichnen";

export default function Spannen({ st }: { st: StatSpannen }) {
  const [wurzel, an] = useZeichnen<HTMLDivElement>();
  const alle = st.zeilen.flatMap((z) => [z.min, z.max]);
  const von = st.skala?.von ?? 0;
  const bis = st.skala?.bis ?? (Math.max(...alle, 0) * 1.1 || 1);
  const pct = (v: number) => `${((v - von) / (bis - von)) * 100}%`;
  const breite = (v: number) => `${(v / (bis - von)) * 100}%`;
  const e = st.einheit ? ` ${st.einheit}` : "";

  return (
    <div className="st-spannen" ref={wurzel}>
      {st.zeilen.map((z, i) => (
        <div key={z.name} className="st-spannen__zeile">
          <span className="st-spannen__name">{z.name}</span>
          <div className="st-spannen__bahn" role="img" aria-label={`${z.name}: ${z.min} bis ${z.max}${e}, Median ${z.median}${e}`}>
            <i className="st-spannen__grund" />
            <i className="st-spannen__balken" style={{ left: pct(z.min), width: breite(z.max - z.min), transform: `scaleX(${an ? 1 : 0})`, transitionDelay: `${i * 0.1}s` }} />
            <i className="st-spannen__median" style={{ left: pct(z.median), transform: `scale(${an ? 1 : 0})`, transitionDelay: `${0.5 + i * 0.1}s` }} />
            <span className="st-spannen__min" style={{ left: pct(z.min), opacity: an ? 1 : 0, transitionDelay: `${i * 0.1}s` }}>{z.min}{e}</span>
            <span className="st-spannen__max" style={{ left: pct(z.max), opacity: an ? 1 : 0, transitionDelay: `${i * 0.1}s` }}>{z.max}{e}</span>
            <span className="st-spannen__medianwert" style={{ left: pct(z.median), opacity: an ? 1 : 0, transitionDelay: `${0.5 + i * 0.1}s` }}>{z.median}{e}</span>
          </div>
        </div>
      ))}
      <div className="st-spannen__skala"><span>{von}{e}</span><span>{bis}{e}</span></div>
    </div>
  );
}
