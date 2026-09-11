"use client";

/**
 * Zeitstrahl — Design A v2, Handoff Zeile 934–942, Logik 1918.
 *
 * Kein SVG: eine waagerechte Haarlinie, darauf Knoten von 9 px; die Beschriftungen hängen
 * abwechselnd über und unter der Achse an einem Fallstrich. Die letzte Station rückt nach
 * links, damit sie nicht über den Satzspiegel hinausläuft.
 */
import type { StatZeitstrahl } from "@/lib/statistik/schema";

export default function Zeitstrahl({ st }: { st: StatZeitstrahl }) {
  const n = st.stationen.length;
  return (
    <div className="st-zeit">
      {st.stationen.map((z, i) => {
        const x = z.x ?? (n > 1 ? (i * 100) / (n - 1) : 50);
        const oben = i % 2 === 0;
        const rechts = x > 80;
        return (
          <div key={z.marke + i} className="st-zeit__station" style={{ left: `${x}%` }}>
            <i className="st-zeit__knoten" />
            <i className="st-zeit__strich" style={{ top: oben ? "40px" : "75px" }} />
            <span
              className="st-zeit__text"
              style={{ top: oben ? "0" : "104px", transform: `translateX(${rechts ? "-100%" : x === 0 ? "0" : "-50%"})`, alignItems: rechts ? "flex-end" : x === 0 ? "flex-start" : "center" }}
            >
              <b>{z.marke}</b>
              <span>{z.text}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
