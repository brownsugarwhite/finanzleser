"use client";

/**
 * „Alle N Angebote“ — Filterzeile, Sortierung, Tabellenkopf und die Zeilen.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:167-212 und
 * „… Festgeld & Eingaben“:133-161.
 *
 * Die Spalten stehen fest (Logo · Name · Hauptzahl · Gesamtzahl · Pille), die Zahlen
 * darin kommen aus der Registry. Was in den Details steht, ist alles, was weder Haupt-
 * noch Gesamtzahl ist — darunter die sieben Kreditfelder, die der Prototyp erfunden hatte
 * und die jetzt echt sind.
 */
import type { DefLite, SpalteDef, VergleichProdukt } from "@/lib/financeads/typen";
import type { VergleichZustand } from "@/lib/financeads/useVergleichZustand";
import { dativ } from "@/lib/financeads/kursblatt";
import { Chip } from "@/components/kursblatt/teile/Kleinteile";
import Zeile from "./Zeile";

export interface AlleAngeboteProps {
  def: DefLite;
  z: VergleichZustand;
  haupt: SpalteDef;
  total?: SpalteDef;
  best?: VergleichProdukt;
  hover: number | null;
  onHover: (id: number | null) => void;
  offen: number | null;
  onOeffnen: (id: number | null) => void;
  gemerkt: number[];
  onMerken: (id: number) => void;
  stempel: string;
  herz: string;
  tempo: number;
}

export default function AlleAngebote({
  def, z, haupt, total, best, hover, onHover, offen, onOeffnen, gemerkt, onMerken, stempel, herz, tempo,
}: AlleAngeboteProps) {
  const details = def.spalten.filter((s) => s !== haupt && s !== total);
  const gesamt = z.aktuelle.produkte.length;

  return (
    <section className="kb-liste">
      <b className="kb-liste__titel">Alle {gesamt} {def.mehrzahl}</b>

      {z.chips.length > 0 && (
        <div className="kb-liste__filter">
          <span className="kb-liste__filter-label">Nur mit:</span>
          {z.chips.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              aktiv={Boolean(z.filter[f.key])}
              treffer={z.treffer[f.key]}
              onKlick={() => z.schalte(f.key)}
            />
          ))}
        </div>
      )}

      <div className="kb-liste__zeile">
        <span className="kb-liste__zahl">
          {z.zeilen.length === 0
            ? "Kein Angebot erfüllt alle Filter – einen Filter lösen."
            : `${z.zeilen.length} von ${gesamt} ${dativ(def.mehrzahl)} · Zeile antippen für Details`}
        </span>
        {def.sortierung.length > 1 && (
          <div className="kb-liste__sortieren" role="tablist" aria-label="Sortieren">
            <span>Sortieren:</span>
            {def.sortierung.map((s) => (
              <button
                key={s.key} type="button" role="tab" aria-selected={z.sortKey === s.key}
                className="kb-liste__tab" data-aktiv={z.sortKey === s.key ? "an" : "aus"}
                onClick={() => z.setSortKey(s.key)}
              >
                {s.label}
                <i aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="kb-liste__kopf">
        <span className="kb-liste__kopf-namen">{def.einzahl} · Produkt</span>
        <span className="kb-liste__kopf-rechts">{haupt.kurz ?? haupt.label}</span>
        {total && <span className="kb-liste__kopf-rechts kb-liste__kopf-total">{total.kurz ?? total.label}</span>}
        <span />
      </div>

      {z.zeilen.slice(0, z.gezeigt).map((p, i) => (
        <Zeile
          key={p.id}
          def={def} p={p} haupt={haupt} total={total} details={details}
          maximum={z.maximum}
          ist={best?.id === p.id}
          hell={hover === p.id}
          offen={offen === p.id}
          gemerkt={gemerkt.includes(p.id)}
          stempel={stempel}
          animation={herz === "none" ? undefined : `${herz} .7s var(--kb-kurve) ${(i * 0.05 * tempo).toFixed(2)}s both`}
          onHover={onHover}
          onToggle={() => onOeffnen(offen === p.id ? null : p.id)}
          onMerken={() => onMerken(p.id)}
        />
      ))}

      {z.zeilen.length > z.gezeigt && (
        <button type="button" className="kb-liste__mehr" onClick={z.zeigeAlle}>
          Alle {z.zeilen.length} {def.mehrzahl} zeigen
        </button>
      )}
    </section>
  );
}
