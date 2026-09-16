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
  const dritteDef = def.kursblatt?.dritteSpalte
    ? def.spalten.find((s) => s.key === def.kursblatt!.dritteSpalte!.key)
    : undefined;
  // Dieselbe Regel wie bei Chips und Register: kennt der Schnappschuss die Kennzahl noch
  // nicht, stünde hier eine Spalte voller Gedankenstriche.
  const dritte = dritteDef && z.aktuelle.produkte.some((p) => dritteDef.key in p.kennzahlen) ? dritteDef : undefined;
  const details = def.spalten.filter((s) => s !== haupt && s !== total && s !== dritte);
  const gesamt = z.aktuelle.produkte.length;
  const ohneText = def.kursblatt?.ohne?.text;

  return (
    <section className="kb-liste" data-dritte={dritte ? "an" : "aus"}>
      <b className="kb-liste__titel">Alle {gesamt - z.ausgeschlossen} {def.mehrzahl}</b>

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
            : `${z.zeilen.length} von ${gesamt - z.ausgeschlossen} ${dativ(def.mehrzahl)} · Zeile antippen für Details`}
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

      {/* Der Kopfstapel trägt die Doppellinie, das Band darin die Versalien in Tinte. */}
      <div className="kb__kopfstapel kb-liste__kopfstapel">
      <div className="kb-liste__kopf">
        {/* K:183 „Anbieter · Produkt" — die Spalte trägt beides, den Namen der Bank und
            den des Tarifs. `def.einzahl` wäre hier falsch: das ist das Produkt, nicht der,
            der es anbietet („Festgeldkonto · Produkt"). */}
        <span className="kb-liste__kopf-namen">Anbieter · Produkt</span>
        <span className="kb-liste__kopf-rechts">{haupt.kurz ?? haupt.label}</span>
        {total && <span className="kb-liste__kopf-rechts kb-liste__kopf-total">{total.kurz ?? total.label}</span>}
        {dritte && <span className="kb-liste__kopf-dritte">{dritte.kurz ?? dritte.label}</span>}
        <span />
      </div>
      </div>

      {z.zeilen.slice(0, z.gezeigt).map((p, i) => (
        <Zeile
          key={p.id}
          def={def} p={p} haupt={haupt} total={total} dritte={dritte} details={details}
          maximum={z.maximum}
          ist={best?.id === p.id}
          hell={hover === p.id}
          offen={offen === p.id}
          gemerkt={gemerkt.includes(p.id)}
          stempel={stempel}
          animation={herz === "none" ? undefined : `${herz} .7s var(--kurve) ${(i * 0.05 * tempo).toFixed(2)}s both`}
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

      {/* Was aussortiert wurde, wird genannt — stilles Weglassen wäre eine Auswahl,
          die niemand nachvollziehen kann (F:224). */}
      {z.ausgeschlossen > 0 && ohneText && (
        <p className="kb-liste__ausgeschlossen">
          {z.ausgeschlossen === 1
            ? `Ein weiteres Angebot ${ohneText} steht nicht in der Liste.`
            : `${z.ausgeschlossen} weitere ${def.mehrzahl} ${ohneText} stehen nicht in der Liste.`}
        </p>
      )}
    </section>
  );
}
