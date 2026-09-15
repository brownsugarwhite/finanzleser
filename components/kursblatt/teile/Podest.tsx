"use client";

/**
 * Das Podest — der Gewinner im gezeichneten Rahmen, dahinter Platz 2 und 3.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:115-165 (Kredit, drei)
 * und „… Festgeld & Eingaben“:97-131 (Festgeld, nur der Gewinner). Wie viele Plätze es
 * gibt, sagt `def.kursblatt.podest` — beim Festgeld ist der zweitbeste Ertrag keine
 * Auszeichnung wert, beim Kredit schon.
 *
 * 🚨 Die Merkmale mit grünem Haken sind im Prototyp „Sondertilgung kostenlos“,
 * „Sofortzusage“, „Ratenpause“ — drei Felder, die financeads nicht liefert (gemessen
 * 15.09.2026). An ihre Stelle treten die echten Vorteile aus `benefits[].text.de`, die
 * jedes Produkt mitbringt. Dieselbe Form, nur nicht erfunden.
 */
import type { KursblattDef, SpalteDef, VergleichProdukt } from "@/lib/financeads/typen";
import { formatKennwert } from "@/lib/financeads/format";
import PilleCTA from "./PilleCTA";
import Stempel from "./Stempel";
import { Logorahmen, MerkenKnopf, Punktzeile, StrichLink } from "./Kleinteile";

export interface PodestProps {
  haupt: SpalteDef;
  /** Die übrigen Spalten — sie füllen die Punktführung rechts. */
  neben: SpalteDef[];
  zeilen: VergleichProdukt[];
  best?: VergleichProdukt;
  kursblatt?: KursblattDef;
  params: Record<string, string | number>;
  gemerkt: number[];
  onMerken: (id: number) => void;
  /** Animationsnamen aus useLauf. */
  mitte: string;
  spalte: string;
  stempel: string;
  herz: string;
}

/** K:157 — „Mehrkosten zum Bestwert: + 1.098 €". Nur, wo die Registry es vorsieht. */
function mehrkosten(
  regel: KursblattDef["mehrkosten"],
  p: VergleichProdukt,
  best: VergleichProdukt | undefined,
  params: Record<string, string | number>,
): string | null {
  if (!regel || !best) return null;
  const a = p.kennzahlen[regel.key];
  const b = best.kennzahlen[regel.key];
  if (typeof a !== "number" || typeof b !== "number") return null;
  const mal = regel.mal ? Number(params[regel.mal]) : 1;
  const diff = (a - b) * (Number.isFinite(mal) ? mal : 1);
  if (Math.abs(diff) < 1) return null;
  return `+ ${Math.round(Math.abs(diff)).toLocaleString("de-DE")} €`;
}

function Haken() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--kb-gruen)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 6.5l2.6 2.6L10 3.5" />
    </svg>
  );
}

export default function Podest({
  haupt, neben, zeilen, best, kursblatt, params, gemerkt, onMerken, mitte, spalte, stempel, herz,
}: PodestProps) {
  if (!best) return null;
  const plaetze = kursblatt?.podest === 1 ? [] : zeilen.filter((p) => p.id !== best.id).slice(0, 2);
  const titel = plaetze.length ? "Die drei Besten für Ihre Angaben" : "Das beste Angebot für Ihre Angaben";
  const anim = (name: string, dauer: string, verzug = "") => (name === "none" ? undefined : { animation: `${name} ${dauer} var(--kb-kurve) ${verzug}both` });

  return (
    <section className="kb-podest-block">
      <div className="kb-podest__titel">
        <i style={{ animation: "fl-linie 1s both" }} aria-hidden="true" />
        <span className="kb__kicker">{titel}</span>
        <i style={{ animation: "fl-linie 1s both" }} aria-hidden="true" />
      </div>

      <div className="kb-podest">
        <i className="kb-podest__rahmen kb-podest__rahmen--oben" style={anim(mitte, ".9s")} aria-hidden="true" />
        <i className="kb-podest__rahmen kb-podest__rahmen--unten" style={anim(mitte, ".9s")} aria-hidden="true" />
        <i className="kb-podest__rahmen kb-podest__rahmen--links" style={anim(spalte, ".9s", ".2s ")} aria-hidden="true" />
        <i className="kb-podest__rahmen kb-podest__rahmen--rechts" style={anim(spalte, ".9s", ".2s ")} aria-hidden="true" />
        {/* Jeder Gewinner bekommt einen Stempel; welcher, sagt die Registry. */}
        <span className="kb-podest__stempel">
          <Stempel text={kursblatt?.stempel ?? "Bestwert"} animation={stempel} />
        </span>

        <div className="kb-podest__raster">
          <div>
            <div className="kb-podest__kopf">
              <Logorahmen quelle={best.logo} name={best.anbieter} groesse="gewinner" />
              <div className="kb-podest__namen">
                <b>{best.anbieter}</b>
                <span>{best.tarif}</span>
              </div>
            </div>
            <div className="kb-podest__zahl">
              <span className="kb-podest__zins">{formatKennwert(haupt, best.kennzahlen[haupt.key])}</span>
              <span className="kb-podest__zins-label">{haupt.label}</span>
            </div>
            {best.vorteile.length > 0 && (
              <div className="kb-podest__merkmale">
                {best.vorteile.map((v) => (
                  <span key={v}><Haken />{v}</span>
                ))}
              </div>
            )}
          </div>

          <div>
            {neben.slice(0, 3).map((s, i) => (
              <Punktzeile key={s.key} k={s.label} v={formatKennwert(s, best.kennzahlen[s.key])} gross={i === 0} />
            ))}
            <div className="kb-podest__aktionen">
              <PilleCTA text="Zum Anbieter" glyph="extern" werkzeug="tuerkis" fuellung href={best.link} rel="sponsored nofollow noopener" target="_blank" />
              <MerkenKnopf gemerkt={gemerkt.includes(best.id)} onKlick={() => onMerken(best.id)} />
            </div>
          </div>
        </div>
      </div>

      {plaetze.length > 0 && (
        <div className="kb-plaetze">
          {plaetze.map((p, i) => {
            const mehr = mehrkosten(kursblatt?.mehrkosten, p, best, params);
            return (
              <div
                key={p.id}
                className="kb-platz"
                style={herz === "none" ? undefined : { animation: `${herz} .8s var(--kb-kurve) ${(0.15 + i * 0.1).toFixed(2)}s both` }}
              >
                <span className="kb-platz__rang" aria-hidden="true">{i + 2}</span>
                <div className="kb-podest__kopf">
                  <Logorahmen quelle={p.logo} name={p.anbieter} groesse="platz" />
                  <div className="kb-podest__namen kb-podest__namen--klein">
                    <b>{p.anbieter}</b>
                    <span>{p.tarif}</span>
                  </div>
                </div>
                <div className="kb-platz__zahl">
                  <span>{formatKennwert(haupt, p.kennzahlen[haupt.key])}</span>
                  <small>{haupt.kurz ?? haupt.label}</small>
                </div>
                {neben[0] && <Punktzeile k={neben[0].label} v={formatKennwert(neben[0], p.kennzahlen[neben[0].key])} gross />}
                {mehr && kursblatt?.mehrkosten && <Punktzeile k={kursblatt.mehrkosten.label} v={mehr} ton="warnung" />}
                <div className="kb-platz__fuss">
                  <StrichLink text="Zum Anbieter" href={p.link} rel="sponsored nofollow noopener" target="_blank" />
                  <MerkenKnopf gemerkt={gemerkt.includes(p.id)} onKlick={() => onMerken(p.id)} klein />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
