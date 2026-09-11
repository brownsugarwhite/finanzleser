"use client";

/**
 * Anteilsleiste — Design A v2, Handoff Zeile 624–631, Logik 1895–1896.
 *
 * Ein gestapelter Balken über die volle Breite; die Beschriftungen hängen an Fallstrichen
 * darunter. Überfahren dimmt die übrigen Segmente.
 *
 * 🚨 Der Handoff wechselt die Strichlänge starr ab (22 px, 58 px, 22 px …). Bei seinen
 * eigenen Blindwerten geht das auf, bei echten Daten nicht: Am 11.09.2026 lief im Block
 * „So werden Pflegebedürftige versorgt" der lange Fallstrich von „12 % Vollstationär im
 * Heim" (Mitte 92 %) mitten durch die Beschriftung von „2 % Eingliederungshilfe"
 * (Mitte 99 %, nach links gekippt, also über die 92 % hinweg).
 *
 * Deshalb wird die Tiefe hier berechnet statt abgezählt: Jede Beschriftung bekommt die
 * flachste Reihe, in der weder ihr eigener Fallstrich durch fremden Text läuft noch ihr
 * Text mit einem Nachbarn derselben Reihe überlappt. Die Breiten werden dafür aus der
 * Zeichenzahl geschätzt — großzügig, damit die Schätzung im Zweifel eine Reihe zu tief
 * geht statt eine zu flach.
 */
import { useState } from "react";
import type { StatAnteilsleiste } from "@/lib/statistik/schema";
import { PALETTE } from "@/lib/statistik/schema";
import { formatWert } from "@/lib/statistik/formeln";

/** Erste Reihe wie im Handoff; jede weitere eine Textzeile tiefer. */
const REIHE_0 = 22;
const REIHE_ABSTAND = 24;
/** Höhe der Leiste plus Luft unter der tiefsten Beschriftung. */
const LEISTE = 18;
const TEXT_HOEHE = 20;

/**
 * Geschätzte Textbreite in Pixeln. `b` ist 13 px Open Sans halbfett, der Name 12,5 px
 * Merriweather, dazwischen 6 px Abstand. Bewusst eine Spur zu groß gerechnet.
 */
function breiteSchaetzen(wert: string, label: string): number {
  return wert.length * 8 + 6 + label.length * 7 + 4;
}

export default function Anteilsleiste({ st }: { st: StatAnteilsleiste }) {
  const [aktiv, setAktiv] = useState(-1);
  const einheit = st.einheit ?? "%";

  // 1) Lage und Ausrichtung jeder Beschriftung. Ab 82 % kippt sie nach links, sonst liefe
  //    sie aus dem Satzspiegel.
  let lauf = 0;
  const roh = st.stuecke.map((s, i) => {
    const mitte = lauf + s.wert / 2;
    lauf += s.wert;
    const rechts = mitte > 82;
    const text = formatWert(s.wert, einheit);
    // In Prozent der Leiste gerechnet, damit alles im selben Maß bleibt. 728 px ist die
    // Satzbreite des Fadens; schmaler wird die Schätzung großzügiger, das ist die sichere
    // Richtung.
    const breitePz = (breiteSchaetzen(text, s.label) / 728) * 100;
    return {
      ...s,
      i,
      text,
      mitte,
      rechts,
      farbe: s.farbe || PALETTE[i % PALETTE.length],
      // Waagerechte Ausdehnung des Textkastens und Lage des Fallstrichs.
      von: rechts ? mitte - breitePz : mitte,
      bis: rechts ? mitte : mitte + breitePz,
      strich: mitte,
    };
  });

  // 2) Tiefen vergeben. Für jede Beschriftung die flachste Reihe suchen, in der
  //    (a) kein schon gesetzter Text weiter oben von ihrem Fallstrich durchschnitten wird,
  //    (b) ihr eigener Text keinen Nachbarn derselben Reihe überlappt.
  const gesetzt: { von: number; bis: number; strich: number; reihe: number }[] = [];
  const stuecke = roh.map((s) => {
    let reihe = 0;
    for (; reihe < roh.length; reihe++) {
      const durchschnitten = gesetzt.some((g) => g.reihe < reihe && s.strich > g.von && s.strich < g.bis);
      const ueberlappt = gesetzt.some((g) => g.reihe === reihe && s.von < g.bis && s.bis > g.von);
      // Zusätzlich: ein schon gesetzter Strich weiter unten darf nicht durch DIESEN Text laufen.
      const schneidetFremd = gesetzt.some((g) => g.reihe > reihe && g.strich > s.von && g.strich < s.bis);
      if (!durchschnitten && !ueberlappt && !schneidetFremd) break;
    }
    gesetzt.push({ von: s.von, bis: s.bis, strich: s.strich, reihe });
    return { ...s, reihe };
  });

  const tiefste = stuecke.reduce((m, s) => Math.max(m, s.reihe), 0);
  const hoehe = LEISTE + REIHE_0 + tiefste * REIHE_ABSTAND + TEXT_HOEHE + 6;

  return (
    <div className="st-anteile" style={{ height: `${hoehe}px` }}>
      {/* Die Leiste trägt keine eigene Beschriftung: Wert und Name stehen direkt darunter
          als Text und werden ohnehin vorgelesen. */}
      <div className="st-anteile__leiste" aria-hidden="true">
        {stuecke.map((s) => (
          <i
            key={s.label}
            style={{ width: `${s.wert}%`, background: s.farbe, opacity: aktiv === -1 || aktiv === s.i ? 1 : 0.3 }}
            onMouseEnter={() => setAktiv(s.i)}
            onMouseLeave={() => setAktiv(-1)}
          />
        ))}
      </div>
      {stuecke.map((s) => (
        <div
          key={s.label}
          className="st-anteile__marke"
          style={{
            left: `${s.mitte}%`,
            alignItems: s.rechts ? "flex-end" : "flex-start",
            transform: s.rechts ? "translateX(-100%)" : undefined,
            opacity: aktiv === -1 || aktiv === s.i ? 1 : 0.3,
          }}
        >
          <i style={{ height: `${REIHE_0 + s.reihe * REIHE_ABSTAND}px`, margin: s.rechts ? "0 0 0 auto" : 0 }} />
          <span><b style={{ color: s.farbe }}>{s.text}</b><span>{s.label}</span></span>
        </div>
      ))}
    </div>
  );
}
