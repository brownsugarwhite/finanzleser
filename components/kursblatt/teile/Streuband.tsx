"use client";

/**
 * Das Streuband — ein Punkt je Angebot auf einer Achse, links besser, rechts schlechter.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:92-106, Rechnung
 * :473-477. Der Bestwert ist gefüllt und pulst, ein Faden führt zu seiner Beschriftung;
 * der Durchschnitt steht als gestrichelte Linie.
 *
 * Die Achse kennt keine Kategorie: sie trägt die Spalte des Bestwerts, und ihre Enden
 * heißen nach deren Richtung (`achsenEnden`). Damit läuft dasselbe Band auf Tagesgeld,
 * Girokonto und Kreditkarte, ohne dass hier etwas dazukommt.
 */
import type { SpalteDef, VergleichProdukt } from "@/lib/financeads/typen";
import { formatKennwert } from "@/lib/financeads/format";
import { achsenEnden } from "@/lib/financeads/kursblatt";

export interface StreubandProps {
  haupt: SpalteDef;
  /** Die zweite Zahl im Tooltip („… · 351 €/Monat“). */
  neben?: SpalteDef;
  zeilen: VergleichProdukt[];
  best?: VergleichProdukt;
  /** Hervorgehobenes Angebot — gilt in beide Richtungen: Punkt ↔ Zeile. */
  hover: number | null;
  onHover: (id: number | null) => void;
  onOeffnen: (id: number) => void;
  /** Animationsnamen aus useLauf, damit Faden und Beschriftung neu zeichnen. */
  spalte: string;
  druck: string;
}

export default function Streuband({ haupt, neben, zeilen, best, hover, onHover, onOeffnen, spalte, druck }: StreubandProps) {
  const werte = zeilen
    .map((p) => p.kennzahlen[haupt.key])
    .filter((w): w is number => typeof w === "number");
  if (werte.length < 1) return null;

  const min = Math.min(...werte);
  const max = Math.max(...werte);
  const schnitt = werte.reduce((a, b) => a + b, 0) / werte.length;
  // K:473 — 5 % Rand an beiden Enden, damit die äußersten Punkte nicht an der Kante kleben.
  const pos = (w: number) => (werte.length > 1 && max > min ? 5 + ((w - min) / (max - min)) * 90 : 50);
  const [links, rechts] = achsenEnden(haupt);
  // Bei „mehr ist besser" steht der Bestwert rechts — die Achse dreht sich nicht, aber
  // der Bestwert ist dann das Maximum.
  const bestZahl = typeof best?.kennzahlen[haupt.key] === "number" ? (best.kennzahlen[haupt.key] as number) : haupt.richtung === "hoch" ? max : min;

  /**
   * Stapel (Handoff Runde 2, Punkt 3): nicht nach GLEICHEM WERT bündeln, sondern nach
   * NÄHE auf der Achse — Klassen von 2,6 % Bandbreite. Zwei Angebote mit 2,29 % und
   * 2,31 % stehen sonst übereinander gedruckt, obwohl ihre Werte verschieden sind.
   * Je Klasse höchstens fünf Punkte, darüber steht „+n".
   */
  const KLASSE = 2.6;
  const MAX_ETAGEN = 5;
  const belegt: Record<number, number> = {};
  const roh = zeilen.map((p) => {
    const w = p.kennzahlen[haupt.key];
    if (typeof w !== "number") return null;
    const l = pos(w);
    const k = Math.round(l / KLASSE);
    const etage = belegt[k] || 0;
    belegt[k] = etage + 1;
    return { p, links: l, klasse: k, etage, ist: Boolean(best && p.id === best.id), hell: hover === p.id };
  }).filter(Boolean) as { p: VergleichProdukt; links: number; klasse: number; etage: number; ist: boolean; hell: boolean }[];

  // Der Bestwert bleibt immer sichtbar — er ist der erste seiner Klasse.
  const punkte = roh.filter((x) => x.etage < MAX_ETAGEN || x.ist);
  const ueberzaehlig = Object.entries(belegt)
    .filter(([, n]) => n > MAX_ETAGEN)
    .map(([k, n]) => ({ klasse: Number(k), mehr: n - MAX_ETAGEN }));

  const tip = zeilen.find((p) => p.id === hover);
  const tipPos = tip && typeof tip.kennzahlen[haupt.key] === "number" ? pos(tip.kennzahlen[haupt.key] as number) : 50;

  return (
    <div className="kb-band">
      {/* 🚨 Die LEGENDE steht fest über dem Band, nicht über ihrem Punkt.
          Bis zum 16.09.2026 hing „Bestwert 0,68 % · Verivox" am Bestwert und „Ø 2,74 %"
          an der gestrichelten Linie — beide wanderten bei jeder Eingabe mit, überliefen
          einander, und am rechten Rand lief die Bestwert-Zeile aus dem Satz. Genau das
          behebt Runde 2, Punkt 3: links der Bestwert, rechts der Durchschnitt, beide
          bleiben stehen. */}
      <div className="kb-band__legende">
        {best && (
          <span className="kb-band__legende-best" style={{ animation: druck === "none" ? undefined : `${druck} .6s .6s both` }}>
            <i aria-hidden="true" />
            Bestwert {formatKennwert(haupt, bestZahl)} · {best.anbieter}
          </span>
        )}
        {/* Ohne „ab": der Durchschnitt von lauter Untergrenzen ist keine Untergrenze. */}
        <span className="kb-band__legende-schnitt">
          <i aria-hidden="true" />
          Durchschnitt {formatKennwert({ ...haupt, ab: false }, schnitt)}
        </span>
      </div>

      <div className="kb-band__feld">
        <i className="kb-band__achse" aria-hidden="true" />
        {/* Die Stiele laufen von der Grundlinie bis zur Oberkante des Bandes. */}
        <i className="kb-band__schnitt" style={{ left: `${pos(schnitt)}%` }} aria-hidden="true" />
        {best && (
          <i
            className="kb-band__faden"
            style={{ left: `${pos(bestZahl)}%`, animation: spalte === "none" ? undefined : `${spalte} .7s var(--kurve) .3s both` }}
            aria-hidden="true"
          />
        )}

        {punkte.map((x) => (
          <button
            key={x.p.id}
            type="button"
            className="kb-band__punkt"
            data-ist={x.ist ? "an" : "aus"}
            data-hell={x.hell ? "an" : "aus"}
            style={{ left: `${x.links}%`, bottom: `${22 + Math.min(x.etage, MAX_ETAGEN - 1) * 12}px` }}
            aria-label={`${x.p.anbieter}: ${formatKennwert(haupt, x.p.kennzahlen[haupt.key])}`}
            onMouseEnter={() => onHover(x.p.id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(x.p.id)}
            onBlur={() => onHover(null)}
            onClick={() => onOeffnen(x.p.id)}
          />
        ))}

        {ueberzaehlig.map((u) => (
          <span key={u.klasse} className="kb-band__mehr" style={{ left: `${u.klasse * KLASSE}%` }} aria-hidden="true">
            +{u.mehr}
          </span>
        ))}

        <div
          className="kb-band__tip"
          style={{ left: `${tipPos}%`, transform: `translateX(${tipPos > 70 ? "-90%" : tipPos < 30 ? "-10%" : "-50%"})`, opacity: tip ? 1 : 0 }}
          aria-hidden="true"
        >
          {tip ? `${tip.anbieter} · ${formatKennwert(haupt, tip.kennzahlen[haupt.key])}${neben ? ` · ${formatKennwert(neben, tip.kennzahlen[neben.key])}` : ""}` : ""}
        </div>
      </div>

      {/* Unter der Achse: links das eine Ende, mittig der Name der Achse, rechts das andere. */}
      <div className="kb-band__fuss">
        <span>{links}</span>
        <span className="kb__kicker">{haupt.label}</span>
        <span>{rechts}</span>
      </div>
    </div>
  );
}
