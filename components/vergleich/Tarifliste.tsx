"use client";

/**
 * Die Tarifliste — Design A v2, Handoff Zeile 768–779: Kopfzeile in Versalien, Zeilen als
 * Grid, links Anbieter und Tarifname (mit Bestwert-Stempel), in der Mitte die Kennzahlen,
 * rechts die eine große Zahl mit Balken. Der Balken misst den Wert an der größten Zahl der
 * Liste; die Bestwert-Zeile ist getönt und ihr Balken türkis.
 *
 * Anders als im Handoff trägt jede Zeile ihren Partnerlink — die Übergabe-Pille des
 * Prototyps gibt es hier nicht, der Leser will zum Angebot, nicht in den Aktenkoffer.
 */
import { useState } from "react";
import type { DefLite, SpalteDef, VergleichProdukt } from "@/lib/financeads/typen";
import { formatKennwert } from "@/lib/financeads/format";

export default function Tarifliste({ def, zeilen, haupt, mittel, best, maximum, gezeigt }: {
  def: DefLite;
  zeilen: VergleichProdukt[];
  /** Die große Spalte rechts (Bestwert-Kennzahl). */
  haupt: SpalteDef;
  mittel: SpalteDef[];
  best?: number;
  /** Bezugsgröße des Balkens. */
  maximum: number;
  gezeigt: number;
}) {
  const [offen, setOffen] = useState<Set<number>>(new Set());
  const spalten = `minmax(0,1.6fr) ${mittel.map(() => ".8fr").join(" ")} .9fr`;
  const toggle = (id: number) => setOffen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="vgl__liste" style={{ ["--vgl-spalten" as string]: spalten }}>
      <div className="vgl__kopf" role="row">
        <span className="vgl__kopfzelle">{def.einzahl}</span>
        {mittel.map((s) => <span key={s.key} className={"vgl__kopfzelle vgl__kopfzelle--mitte" + (s.schmal ? " vgl__zelle--schmal" : "")}>{s.kurz || s.label}</span>)}
        <span className="vgl__kopfzelle vgl__kopfzelle--rechts">{def.totalLabel || haupt.kurz || haupt.label}</span>
      </div>
      <ol className="vgl__zeilen">
        {zeilen.slice(0, gezeigt).map((p, i) => {
          const wert = p.kennzahlen[haupt.key];
          const anteil = typeof wert === "number" && maximum > 0 ? Math.max(0.04, Math.min(1, Math.abs(wert) / maximum)) : 0;
          const istBest = p.id === best;
          const details = p.vorteile.length > 0 || !!p.hinweis;
          return (
            <li key={p.id} className={"vgl__zeile" + (istBest ? " vgl__zeile--best" : "")} style={{ animationDelay: `${Math.min(i, 12) * 0.05}s` }}>
              <div className="vgl__tarif">
                <b className="vgl__anbieter">{p.anbieter}</b>
                <span className="vgl__tarifname">
                  <span>{p.tarif}</span>
                  {istBest && <i className="vgl__stempel">Bestwert</i>}
                </span>
                <span className="vgl__aktionen">
                  {details && (
                    <button type="button" className="vgl__details-knopf" aria-expanded={offen.has(p.id)} onClick={() => toggle(p.id)}>
                      {offen.has(p.id) ? "Weniger" : "Details"}
                    </button>
                  )}
                  <a className="vgl__link" href={p.link} target="_blank" rel="sponsored nofollow noopener" data-faden-aus="">Zum Angebot<i aria-hidden="true">↗</i></a>
                </span>
              </div>
              {mittel.map((s) => (
                <span key={s.key} className={"vgl__zelle vgl__zelle--mitte" + (s.schmal ? " vgl__zelle--schmal" : "") + (s.art === "haken" ? " vgl__zelle--haken" : "")} data-label={s.kurz || s.label}>
                  {s.art === "haken" ? <span className={p.kennzahlen[s.key] === true ? "vgl__ja" : "vgl__nein"} aria-label={`${s.label}: ${p.kennzahlen[s.key] === true ? "ja" : "nein"}`}>{p.kennzahlen[s.key] === true ? "✓" : "–"}</span> : formatKennwert(s, p.kennzahlen[s.key])}
                </span>
              ))}
              <div className="vgl__zelle vgl__zelle--rechts">
                <b className="vgl__zahl">{formatKennwert(haupt, wert)}</b>
                <span className="vgl__balken" aria-hidden="true"><i style={{ width: `${anteil * 100}%` }} /></span>
              </div>
              {offen.has(p.id) && (
                <div className="vgl__details">
                  {p.vorteile.length > 0 && <ul className="vgl__vorteile">{p.vorteile.map((v) => <li key={v}>{v}</li>)}</ul>}
                  {p.hinweis && <details className="vgl__pflicht"><summary>Pflichtangaben des Anbieters</summary><pre>{p.hinweis}</pre></details>}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
