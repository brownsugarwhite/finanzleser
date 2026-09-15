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

  // Gleiche Werte stapeln sich nach oben, statt sich zu verdecken (K:476).
  const belegt: Record<number, number> = {};
  const punkte = zeilen.map((p) => {
    const w = p.kennzahlen[haupt.key];
    if (typeof w !== "number") return null;
    const k = Math.round(w * 100);
    const etage = belegt[k] || 0;
    belegt[k] = etage + 1;
    const ist = best && p.id === best.id;
    const hell = hover === p.id;
    return { p, links: pos(w), oben: 112 - etage * 13, ist, hell };
  }).filter(Boolean) as { p: VergleichProdukt; links: number; oben: number; ist: boolean; hell: boolean }[];

  /**
   * 🚨 Der Prototyp hängt beide Beschriftungen fest an ihre Position (K:99, :101) — das
   * geht dort auf, weil der Bestwert beim Kredit immer links steht (weniger Zins ist
   * besser). Bei „mehr ist besser" (Ertrag, Zins beim Festgeld) sitzt er rechts, und die
   * Beschriftung lief bei 390 px um 180 px aus dem Satz. Deshalb hängt sie sich am
   * rechten Rand um — dasselbe Mittel, das der Prototyp beim Tooltip schon benutzt.
   */
  const anker = (v: number) => (v > 70 ? "rechts" : v < 12 ? "links" : "mitte");

  const tip = zeilen.find((p) => p.id === hover);
  const tipPos = tip && typeof tip.kennzahlen[haupt.key] === "number" ? pos(tip.kennzahlen[haupt.key] as number) : 50;

  return (
    <div className="kb-band">
      <span className="kb__kicker kb-band__kicker">{haupt.label}</span>
      <i className="kb-band__achse" aria-hidden="true" />
      <span className="kb-band__ende kb-band__ende--links">{links}</span>
      <span className="kb-band__ende kb-band__ende--rechts">{rechts}</span>

      <i className="kb-band__schnitt" style={{ left: `${pos(schnitt)}%` }} aria-hidden="true" />
      <span className="kb-band__schnitt-wert" data-anker={anker(pos(schnitt))} style={{ left: `${pos(schnitt)}%` }}>
        {/* Ohne „ab": der Durchschnitt von lauter Untergrenzen ist keine Untergrenze. */}
        Ø {formatKennwert({ ...haupt, ab: false }, schnitt)}
      </span>

      {best && (
        <>
          <i
            className="kb-band__faden"
            style={{ left: `${pos(bestZahl)}%`, animation: spalte === "none" ? undefined : `${spalte} .7s var(--kb-kurve) .3s both` }}
            aria-hidden="true"
          />
          {/* 🚨 Zwei Ebenen, weil sich sonst zwei `transform` in die Quere kommen: außen
              hängt die Verankerung (translateX am rechten Rand), innen läuft `fl-druck`,
              dessen Keyframes ebenfalls `transform` setzen und die Verankerung sonst
              überschreiben — gemessen als 180 px Überlauf bei 390 px. */}
          <span className="kb-band__best" data-anker={anker(pos(bestZahl))} style={{ left: `${pos(bestZahl)}%` }}>
            <span style={{ animation: druck === "none" ? undefined : `${druck} .6s .6s both` }}>
              Bestwert {formatKennwert(haupt, bestZahl)} · {best.anbieter}
            </span>
          </span>
        </>
      )}

      {punkte.map((x) => (
        <button
          key={x.p.id}
          type="button"
          className="kb-band__punkt"
          data-ist={x.ist ? "an" : "aus"}
          data-hell={x.hell ? "an" : "aus"}
          style={{ left: `${x.links}%`, top: `${x.oben}px` }}
          aria-label={`${x.p.anbieter}: ${formatKennwert(haupt, x.p.kennzahlen[haupt.key])}`}
          onMouseEnter={() => onHover(x.p.id)}
          onMouseLeave={() => onHover(null)}
          onFocus={() => onHover(x.p.id)}
          onBlur={() => onHover(null)}
          onClick={() => onOeffnen(x.p.id)}
        />
      ))}

      <div
        className="kb-band__tip"
        style={{ left: `${tipPos}%`, transform: `translateX(${tipPos > 70 ? "-90%" : tipPos < 30 ? "-10%" : "-50%"})`, opacity: tip ? 1 : 0 }}
        aria-hidden="true"
      >
        {tip ? `${tip.anbieter} · ${formatKennwert(haupt, tip.kennzahlen[haupt.key])}${neben ? ` · ${formatKennwert(neben, tip.kennzahlen[neben.key])}` : ""}` : ""}
      </div>
    </div>
  );
}
