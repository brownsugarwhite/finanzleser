"use client";

/**
 * Kreisdiagramm — Design A v2, Handoff Zeile 948–965, Logik 1871–1874.
 *
 * Ring mit zwei Hilfskreisen, Segmente zeichnen sich über stroke-dasharray, danach laufen
 * die Leader-Linien nach außen und die Beschriftung blendet auf. Überfahren verdickt das
 * Segment und dimmt die übrigen; die Mitte zeigt dann dessen Wert.
 *
 * Der Handoff rechnet mit Prozentwerten, die sich auf 100 summieren. Hier wird stattdessen
 * über die Summe normiert — für Prozentdaten ist das rechnerisch dasselbe, aber es trägt
 * auch die Bestandsstatistiken, von denen zwölf von fünfundzwanzig gerade keine
 * Prozentaufteilung sind.
 */
import { useState } from "react";
import type { StatKreis } from "@/lib/statistik/schema";
import { PALETTE } from "@/lib/statistik/schema";
import { useZeichnen } from "@/lib/statistik/useZeichnen";
import { formatWert } from "@/lib/statistik/formeln";

const CX = 220, CY = 125, R = 78, KC = 2 * Math.PI * R;
/** Mindestabstand zweier Beschriftungen auf derselben Seite, in Einheiten des viewBox. */
const MINDEST = 34;

export default function Kreis({ st }: { st: StatKreis }) {
  const [wurzel, an] = useZeichnen<HTMLDivElement>();
  const [aktiv, setAktiv] = useState(-1);
  const einheit = st.einheit ?? "%";
  const summe = st.stuecke.reduce((a, s) => a + s.wert, 0) || 1;
  /** Anteil am Ring in Prozent — bei Prozentdaten identisch mit dem Wert selbst. */
  const anteil = (w: number) => (w / summe) * 100;

  let lauf = 0;
  const roh = st.stuecke.map((s, i) => {
    const start = lauf;
    lauf += anteil(s.wert);
    const farbe = s.farbe || PALETTE[i % PALETTE.length];
    const mitte = ((start + anteil(s.wert) / 2) / 100) * 2 * Math.PI - Math.PI / 2;
    const cos = Math.cos(mitte), sin = Math.sin(mitte), rechts = cos >= 0;
    const ex = CX + cos * 108, ey = CY + sin * 108;
    const tx = rechts ? 340 : 100;
    const len = (KC * anteil(s.wert)) / 100;
    const dieses = aktiv === i;
    return {
      ...s,
      farbe,
      // Ein Segment in Tintengrau bekommt Tinte als Textfarbe — Grau auf Papier wäre zu blass.
      textFarbe: farbe.startsWith("rgba") ? "var(--ink)" : farbe,
      dicke: dieses ? 26 : 20,
      dash: an ? `${Math.max(0, len - 2)} ${KC - len + 2}` : `0 ${KC}`,
      offset: -((KC * start) / 100),
      verzug: `${i * 0.12}s`,
      leader: "",
      winkel: mitte,
      ex,
      eyRoh: ey,
      leaderVerzug: `${0.7 + i * 0.1}s`,
      px: CX + cos * 92,
      py: CY + sin * 92,
      lx: `${(tx / 440) * 100}%`,
      ly: "",
      schub: rechts ? "0" : "-100%",
      ausr: rechts ? "flex-start" : "flex-end",
      op: aktiv === -1 || dieses ? 1 : 0.35,
      rechts,
      ey,
      i,
    };
  });

  /**
   * Beschriftungen auseinanderschieben.
   *
   * Der Handoff setzt jede Beschriftung auf die Höhe der Segmentmitte. Bei zwei kleinen
   * Stücken nebeneinander liegen diese Höhen fast übereinander — in der Vorlage selbst
   * überlagern sich „Sonstiges" und „Elementar" deshalb. Hier werden die Höhen je Seite
   * sortiert und auf einen Mindestabstand gezogen; die Leader-Linie zeigt weiterhin auf
   * ihr Segment, sie bekommt nur einen Knick.
   */
  const stuecke = roh.map((x) => ({ ...x }));
  for (const seite of [true, false]) {
    const reihe = stuecke.filter((x) => x.rechts === seite).sort((a, b) => a.ey - b.ey);
    for (let k = 1; k < reihe.length; k++) {
      const abstand = reihe[k].ey - reihe[k - 1].ey;
      if (abstand < MINDEST) reihe[k].ey = reihe[k - 1].ey + MINDEST;
    }
    // Läuft die Reihe unten heraus, alles gemeinsam nach oben schieben.
    const letzter = reihe[reihe.length - 1];
    if (letzter && letzter.ey > 244) {
      const zurueck = letzter.ey - 244;
      for (const x of reihe) x.ey -= zurueck;
    }
  }
  for (const x of stuecke) {
    const tx = x.rechts ? 340 : 100;
    // Leader: vom Segmentrand nach außen, dann waagerecht auf die (verschobene) Texthöhe.
    x.leader = `${CX + Math.cos(x.winkel) * 89},${CY + Math.sin(x.winkel) * 89} ${x.ex},${x.eyRoh} ${x.rechts ? tx - 8 : tx + 8},${x.ey}`;
    x.ly = `${(x.ey / 250) * 100}%`;
  }

  const gewaehlt = aktiv >= 0 ? st.stuecke[aktiv] : null;

  return (
    <div className="st-kreis" ref={wurzel}>
      <svg viewBox="0 0 440 250" aria-label={st.stuecke.map((s) => `${s.label}: ${s.wert} ${einheit}`).join(", ")} role="img">
        <circle cx={CX} cy={CY} r={58} className="st-kreis__hilfe" />
        <circle cx={CX} cy={CY} r={98} className="st-kreis__hilfe" />
        {stuecke.map((s) => (
          <g key={s.label} style={{ opacity: s.op }} onMouseEnter={() => setAktiv(s.i)} onMouseLeave={() => setAktiv(-1)}>
            <circle
              cx={CX} cy={CY} r={R} fill="none" stroke={s.farbe} strokeWidth={s.dicke}
              transform={`rotate(-90 ${CX} ${CY})`}
              style={{ strokeDasharray: s.dash, strokeDashoffset: s.offset, transitionDelay: `${s.verzug}, 0s` }}
              className="st-kreis__stueck"
            />
            <polyline
              points={s.leader} fill="none" pathLength={1} className="st-kreis__leiter"
              style={{ strokeDashoffset: an ? 0 : 1, transitionDelay: s.leaderVerzug }}
            />
            <circle cx={s.px} cy={s.py} r={2} className="st-kreis__punkt" style={{ opacity: an ? 1 : 0, transitionDelay: s.leaderVerzug }} />
          </g>
        ))}
      </svg>
      {/* Zwei Ebenen, weil die Deckkraft zwei Aufgaben hat: außen das Einblenden beim
          Zeichnen (mit Verzug), innen das Abdunkeln beim Überfahren (ohne Verzug). In
          einer Ebene bremste der Verzug des Einblendens auch das Abdunkeln — die
          Beschriftung sprang erst eine Sekunde nach dem Zeiger an. */}
      {stuecke.map((s) => (
        <span
          key={s.label} className="st-kreis__marke"
          style={{ left: s.lx, top: s.ly, transform: `translate(${s.schub},-50%)`, alignItems: s.ausr, opacity: an ? 1 : 0, transitionDelay: s.leaderVerzug }}
          onMouseEnter={() => setAktiv(s.i)} onMouseLeave={() => setAktiv(-1)}
        >
          <span className="st-kreis__marke__inhalt" style={{ opacity: s.op, alignItems: s.ausr }}>
            <b style={{ color: s.textFarbe }}>{formatWert(s.wert, einheit)}</b>
            <span>{s.label}</span>
          </span>
        </span>
      ))}
      <div className="st-kreis__mitte">
        <b>{formatWert(gewaehlt ? gewaehlt.wert : summe, einheit)}</b>
        <span>{gewaehlt ? gewaehlt.label.toUpperCase() : (st.mitteText || "Leistungen").toUpperCase()}</span>
      </div>
    </div>
  );
}
