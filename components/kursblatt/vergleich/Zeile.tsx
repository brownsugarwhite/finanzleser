"use client";

/**
 * Eine Zeile der Angebotsliste.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:186-209. Logo, Name mit
 * Mini-Stempel, die Hauptzahl mit Balken, die Gesamtzahl, die Pille — darunter „Details“
 * und „Merken“, und ein Fach, das über die Zeilenhöhe aufklappt.
 *
 * 🚨 Keine Nummerierung. Der Handoff ist da deutlich (README „Fidelity“): Listen haben
 * keinen Rang, links steht das Bank-Logo in einem Rahmen.
 */
import type { DefLite, SpalteDef, VergleichProdukt } from "@/lib/financeads/typen";
import { formatKennwert } from "@/lib/financeads/format";
import { mitVorzeichen } from "@/lib/financeads/kursblatt";
import PilleCTA from "@/components/kursblatt/teile/PilleCTA";
import Siegel from "@/components/kursblatt/teile/Siegel";
import { Logorahmen, MerkenKnopf, Punktzeile } from "@/components/kursblatt/teile/Kleinteile";

export interface ZeileProps {
  def: DefLite;
  p: VergleichProdukt;
  haupt: SpalteDef;
  /** Die Zahl rechts neben der Hauptzahl (Rate, Ertrag …). */
  total?: SpalteDef;
  /** Dritte Spalte, wo die Registry eine vorsieht (Festgeld: Land). */
  dritte?: SpalteDef;
  /** Was im aufgeklappten Fach steht. */
  details: SpalteDef[];
  maximum: number;
  ist: boolean;
  hell: boolean;
  offen: boolean;
  gemerkt: boolean;
  stempel: string;
  animation?: string;
  onHover: (id: number | null) => void;
  onToggle: () => void;
  onMerken: () => void;
}

export default function Zeile({
  def, p, haupt, total, dritte, details, maximum, ist, hell, offen, gemerkt, stempel, animation,
  onHover, onToggle, onMerken,
}: ZeileProps) {
  const wert = p.kennzahlen[haupt.key];
  const anteil = typeof wert === "number" && maximum ? Math.max(8, (Math.abs(wert) / maximum) * 100) : 0;
  const punktKey = def.kursblatt?.dritteSpalte?.punkt;
  const dritterText = dritte ? formatKennwert(dritte, p.kennzahlen[dritte.key]) : "";

  return (
    <div
      className="kb__zeile"
      data-ist={ist ? "an" : "aus"}
      data-hell={hell ? "an" : "aus"}
      style={animation ? { animation } : undefined}
      onMouseEnter={() => onHover(p.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Beim Überfahren wachsen zwei Haarlinien von außen aufeinander zu (K:187-188). */}
      <i className="kb__zeile-linie kb__zeile-linie--oben" aria-hidden="true" />
      <i className="kb__zeile-linie kb__zeile-linie--unten" aria-hidden="true" />

      <div className="kb__zeile-raster">
        <Logorahmen quelle={p.logo} name={p.anbieter} groesse="zeile" />

        <div className="kb__zeile-namen">
          <b>{p.anbieter}</b>
          <span>{p.tarif}</span>
        </div>

        <div className="kb__zeile-haupt">
          <b>{mitVorzeichen(haupt, wert)}</b>
          <i className="kb__zeile-balken" style={{ width: `${anteil}%` }} aria-hidden="true" />
          {/* Im schmalen Satz rücken Gesamtzahl und dritte Spalte unter die Hauptzahl
              (K:519 / F:148) — dieselbe Zeile, nur untereinander statt nebeneinander. */}
          {total && (
            <span className="kb__zeile-total-eng">
              {formatKennwert(total, p.kennzahlen[total.key])}
              {dritte ? ` · ${dritterText}` : ` / ${def.totalLabel?.split("/").pop()?.trim() ?? ""}`}
            </span>
          )}
        </div>

        {total && <b className="kb__zeile-total">{formatKennwert(total, p.kennzahlen[total.key])}</b>}

        {dritte && (
          <span className="kb__zeile-dritte">
            <i data-gut={punktKey && p.kennzahlen[punktKey] === true ? "an" : "aus"} aria-hidden="true" />
            {dritterText}
          </span>
        )}

        {/* 🚨 Das Siegel sitzt RECHTS über der Pille, nicht neben dem Namen: so steht es
            in der Vorlage, und so kostet es keine Spaltenbreite — ein Siegel hinter einem
            langen Anbieternamen drückt die Zahlenspalten zusammen. */}
        <span className="kb__zeile-pille">
          {ist && <Siegel text={def.kursblatt?.stempel ?? "Bestwert"} klein animation={stempel} />}
        <PilleCTA
          text="Zum Anbieter" glyph="extern" werkzeug="tuerkis" fuellung klein
          href={p.link} rel="sponsored nofollow noopener" target="_blank"
          ariaLabel={`Zum Anbieter ${p.anbieter}`}
        />
        </span>
      </div>

      <div className="kb__zeile-aktionen">
        <button type="button" className="kb__details-knopf" aria-expanded={offen} onClick={onToggle}>
          <span>Details</span>
          <i data-offen={offen ? "an" : "aus"} aria-hidden="true" />
        </button>
        <MerkenKnopf gemerkt={gemerkt} onKlick={onMerken} klein />
      </div>

      {/* Das Fach klappt über die Zeilenhöhe auf — der Inhalt steht im HTML, nur verborgen. */}
      <div className="kb__details" data-offen={offen ? "an" : "aus"}>
        <div>
          <div className="kb__details-raster">
            {details.map((s) => (
              <Punktzeile
                key={s.key}
                k={s.label}
                v={formatKennwert(s, p.kennzahlen[s.key])}
                ton={s.art === "haken" && p.kennzahlen[s.key] === true ? "gut" : undefined}
              />
            ))}
            {p.hinweis && (
              <details className="kb__pflicht">
                <summary>Pflichtangaben</summary>
                <p>{p.hinweis}</p>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
