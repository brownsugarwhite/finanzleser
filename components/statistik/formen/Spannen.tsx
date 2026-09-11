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
import { formatWert } from "@/lib/statistik/formeln";

export default function Spannen({ st }: { st: StatSpannen }) {
  const [wurzel, an] = useZeichnen<HTMLDivElement>();
  const alle = st.zeilen.flatMap((z) => [z.min, z.max]);
  const von = st.skala?.von ?? 0;
  const bis = st.skala?.bis ?? (Math.max(...alle, 0) * 1.1 || 1);
  const pct = (v: number) => `${((v - von) / (bis - von)) * 100}%`;
  const breite = (v: number) => `${(v / (bis - von)) * 100}%`;
  const z = (v: number) => formatWert(v, st.einheit);

  return (
    <div className="st-spannen" ref={wurzel}>
      {st.zeilen.map((zeile, i) => (
        <div key={zeile.name} className="st-spannen__zeile">
          <span className="st-spannen__name">{zeile.name}</span>
          <div className="st-spannen__bahn" role="img" aria-label={`${zeile.name}: ${z(zeile.min)} bis ${z(zeile.max)}, Median ${z(zeile.median)}`}>
            <i className="st-spannen__grund" />
            <i className="st-spannen__balken" style={{ left: pct(zeile.min), width: breite(zeile.max - zeile.min), transform: `scaleX(${an ? 1 : 0})`, transitionDelay: `${i * 0.1}s` }} />
            <i className="st-spannen__median" style={{ left: pct(zeile.median), transform: `scale(${an ? 1 : 0})`, transitionDelay: `${0.5 + i * 0.1}s` }} />
            <span className="st-spannen__min" aria-hidden="true" style={{ left: pct(zeile.min), opacity: an ? 1 : 0, transitionDelay: `${i * 0.1}s` }}>{z(zeile.min)}</span>
            <span className="st-spannen__max" aria-hidden="true" style={{ left: pct(zeile.max), opacity: an ? 1 : 0, transitionDelay: `${i * 0.1}s` }}>{z(zeile.max)}</span>
            <span className="st-spannen__medianwert" aria-hidden="true" style={{ left: pct(zeile.median), opacity: an ? 1 : 0, transitionDelay: `${0.5 + i * 0.1}s` }}>{z(zeile.median)}</span>
          </div>
        </div>
      ))}
      <div className="st-spannen__skala"><span>{z(von)}</span><span>{z(bis)}</span></div>
    </div>
  );
}
