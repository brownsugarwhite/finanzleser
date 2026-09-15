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
import { mitVorzeichen } from "@/lib/financeads/kursblatt";
import PilleCTA from "./PilleCTA";
import Stempel from "./Stempel";
import { Logorahmen, MerkenKnopf, Punktzeile, StrichLink } from "./Kleinteile";

export interface PodestProps {
  haupt: SpalteDef;
  /**
   * Die Zahl, die groß über dem Namen steht. Beim Kredit ist das der Bestwert selbst
   * (der Effektivzins ordnet UND kennzeichnet), beim Festgeld nicht: sortiert wird nach
   * dem Ertrag in Euro, groß steht der Zins (F:118). Fehlt sie, ist es `haupt`.
   */
  gross?: SpalteDef;
  /** Kandidaten der Punktführung rechts (`podestSpalten`); es stehen die ersten drei mit Wert. */
  zeilenSpalten: SpalteDef[];
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
  haupt, gross, zeilenSpalten, zeilen, best, kursblatt, params, gemerkt, onMerken, mitte, spalte, stempel, herz,
}: PodestProps) {
  if (!best) return null;
  const kopfzahl = gross ?? haupt;
  const kopfText = formatKennwert(kopfzahl, best.kennzahlen[kopfzahl.key]);
  /**
   * Ein Vorteil, der nur die große Zahl wiederholt, ist keiner: „✓ 3,40% Zinsen“ direkt
   * unter „3,40 %“. financeads liefert solche Zeilen regelmäßig als ersten `benefit`
   * (gemessen 15.09.2026 bei Festgeld und Kredit) — sie fallen hier heraus, alle anderen
   * bleiben unverändert stehen.
   */
  const zahlIm = (t: string) => (t.match(/\d+[.,]?\d*/g) || []).join("|");
  const vorteile = best.vorteile.filter((v) => zahlIm(v) === "" || zahlIm(v) !== zahlIm(kopfText));
  // Eine Punktführung, die auf „–“ endet, sagt nichts. Kennt ein Angebot die Zahl nicht,
  // rückt die nächste Spalte nach.
  const punktzeilen = zeilenSpalten
    .map((s) => ({ s, v: mitVorzeichen(s, best.kennzahlen[s.key]) }))
    .filter((x) => x.v !== "–")
    .slice(0, 3);
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
              <span className="kb-podest__zins">{kopfText}</span>
              <span className="kb-podest__zins-label">{kopfzahl.label}</span>
            </div>
            {vorteile.length > 0 && (
              <div className="kb-podest__merkmale">
                {vorteile.map((v) => (
                  <span key={v}><Haken />{v}</span>
                ))}
              </div>
            )}
          </div>

          <div>
            {/* Die erste Zeile steht groß; ist sie ein Ertrag, steht sie in der
                Werkzeugfarbe — Türkis im Vergleich (F:122). */}
            {punktzeilen.map((x, i) => (
              <Punktzeile key={x.s.key} k={x.s.label} v={x.v} gross={i === 0} ton={i === 0 && x.s.richtung === "hoch" && x.s.art === "geld" ? "werkzeug" : undefined} />
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
                  <span>{formatKennwert(kopfzahl, p.kennzahlen[kopfzahl.key])}</span>
                  <small>{kopfzahl.kurz ?? kopfzahl.label}</small>
                </div>
                {punktzeilen[0] && <Punktzeile k={punktzeilen[0].s.label} v={mitVorzeichen(punktzeilen[0].s, p.kennzahlen[punktzeilen[0].s.key])} gross />}
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
