"use client";

/**
 * Statistik aus dem Meta-Feld `statistiken` — der Weg der 190 Bestandsbeiträge.
 *
 * Die Daten bleiben, wie sie sind (lib/types.ts, FadenStatistik); nur die Darstellung ist
 * seit Design A v2 dieselbe wie bei den Gutenberg-Blöcken: keine Kästen, keine Rundungen,
 * keine Chips-Legende — alles steht direkt auf dem Papier. Der Handoff dazu:
 * „Keine Kartenboxen mit Schatten im Faden.“
 *
 * Zuordnung der drei Bestandsarten auf die Formen des Handoffs:
 *   torte   → Kreis         (Handoff 948–965) — über die Summe normiert
 *   saeulen → Säulen        (Handoff 966–985) — eine Reihe; mehrere Reihen wählt der Umschalter
 *   balken  → Balkenliste   — die einzige Form ohne Vorlage, siehe formen/Balkenliste.tsx
 *
 * Was der Handoff nicht kennt, aber der Bestand braucht, bleibt erhalten und wird nur in
 * die Zeitungssprache übersetzt: der Umschalter zwischen Reihen (13 Statistiken) und der
 * Regler mit Neuberechnung über einen Rechner der Seite (8 Statistiken).
 */
import { useMemo, useState } from "react";
import type { FadenStatistik, StatistikWert } from "@/lib/types";
import { useRates } from "@/lib/hooks/useRates";
import { rechne, formatWert } from "@/lib/statistik/formeln";
import { FORM_NAME, PALETTE } from "@/lib/statistik/schema";
import Kreis from "./formen/Kreis";
import Saeulen from "./formen/Saeulen";
import Balkenliste from "./formen/Balkenliste";
import { useZeichnen } from "@/lib/statistik/useZeichnen";

export const FARBEN = PALETTE;

export interface Segment extends StatistikWert { farbe: string; aus: boolean; hervor: boolean; ihr?: boolean }

/** Der Kicker trägt denselben Formnamen wie bei den Blöcken. */
const KICKER: Record<FadenStatistik["art"], string> = { torte: FORM_NAME.kreis, saeulen: FORM_NAME.saeulen, balken: "Statistik" };

export default function StatistikKarte({ st }: { st: FadenStatistik }) {
  const rates = useRates();
  const [wurzel, , stand] = useZeichnen<HTMLElement>();
  const [reihe, setReihe] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  const [regler, setRegler] = useState(st.regler?.start ?? 0);
  const aktuelle = st.reihen[Math.min(reihe, st.reihen.length - 1)];

  // „Ihr Wert“ aus dem Regler: über den Rechner der Seite oder linear zum Bezugswert.
  const ihrWert = useMemo<number | null>(() => {
    const r = st.regler;
    if (!r) return null;
    if (r.formel.typ === "rechner") return rechne(r.formel, regler, rates);
    const bezug = aktuelle.werte.find((w) => w.label === r.formel.bezug);
    if (!bezug || !r.start) return null;
    return bezug.wert * (regler / r.start);
  }, [st.regler, regler, rates, aktuelle]);

  const segmente: Segment[] = useMemo(() => {
    const basis: Segment[] = aktuelle.werte.map((w, i) => ({
      ...w,
      farbe: w.farbe || (st.art === "torte" ? PALETTE[i % PALETTE.length] : PALETTE[0]),
      aus: false,
      hervor: hover === w.label,
    }));
    if (ihrWert != null && st.art !== "torte" && st.regler?.imDiagramm) {
      basis.push({ label: `Ihr Wert (${formatWert(regler, st.regler?.einheit)})`, wert: ihrWert, farbe: "var(--pink)", aus: false, hervor: hover === "__ihr", ihr: true });
    }
    return basis;
  }, [aktuelle, hover, ihrWert, regler, st.art, st.regler?.einheit, st.regler?.imDiagramm]);

  const q = st.quelle;

  return (
    <section ref={wurzel} className={`st st--bestand st--${st.art} st--rahmen-oben`} data-stand={stand} aria-label={st.titel}>
      <div className="st__kopf">
        <span className="kicker">{KICKER[st.art]} · {st.titel}</span>
        {st.untertitel && <p className="st__unter">{st.untertitel}</p>}
      </div>

      {st.reihen.length > 1 && (
        <div className="st__umschalter" role="tablist" aria-label={st.umschalter?.label || "Auswahl"}>
          {st.umschalter?.label && <span className="kicker">{st.umschalter.label}</span>}
          {st.reihen.map((r, i) => (
            <button key={r.key} type="button" role="tab" aria-selected={i === reihe} className={"st__chip" + (i === reihe ? " st__chip--aktiv" : "")} onClick={() => setReihe(i)}>{r.label}</button>
          ))}
        </div>
      )}

      {st.art === "torte" && (
        <Kreis
          st={{
            art: "kreis",
            titel: st.titel,
            einheit: st.einheit,
            // „Leistungen“ ist die Beschriftung des Handoff-Beispiels (Hausratschäden). Der
            // Bestand zeigt alles Mögliche — Kinder, Erbschaften, Steuerklassen —, deshalb
            // hier die neutrale Summenbeschriftung.
            mitteText: "Gesamt",
            stuecke: aktuelle.werte.map((w, i) => ({ ...w, farbe: w.farbe || PALETTE[i % PALETTE.length] })),
          }}
        />
      )}
      {st.art === "saeulen" && (
        <Saeulen st={{ art: "saeulen", titel: st.titel, einheit: st.einheit, reihen: [{ label: aktuelle.label }], kategorien: segmente.filter((s) => !s.ihr).map((s) => ({ label: s.label, werte: [s.wert] })) }} />
      )}
      {st.art === "balken" && <Balkenliste segmente={segmente} einheit={st.einheit} onHover={setHover} />}

      {st.regler && (
        <div className="st__regler">
          <label>
            <span className="kicker">{st.regler.label}</span>
            <b>{formatWert(regler, st.regler.einheit)}</b>
            <input type="range" min={st.regler.min} max={st.regler.max} step={st.regler.schritt} value={regler} onChange={(e) => setRegler(Number(e.target.value))} aria-label={st.regler.label} />
          </label>
          <span className="st__regler-ergebnis">
            {ihrWert == null ? "Für diesen Wert liegt keine Berechnung vor." : <>{st.regler.ergebnis || "Ihr Wert"}: <b>{formatWert(ihrWert, st.regler.ergebnisEinheit ?? st.einheit)}</b></>}
          </span>
        </div>
      )}

      {st.hinweis && <p className="st__hinweis">{st.hinweis}</p>}
      {q?.name && (
        <p className="st__quelle">
          Quelle: {q.url ? <a href={q.url} target="_blank" rel="noopener noreferrer" data-faden-aus="">{q.name}</a> : q.name}
          {q.stand ? `, Stand ${q.stand}` : ""}
          {q.sekundaer ? " (Sekundärquelle)" : ""}
        </p>
      )}
    </section>
  );
}
