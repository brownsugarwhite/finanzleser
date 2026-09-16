/**
 * Kreditrechner im Kursblatt-Satz — die Vorlage, an der die übrigen 55 sich ausrichten.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:234-354 (Seite 2),
 * Maße der Eingaben in der Konstante `L` (:379-383), Presets :384-388.
 */
import { berechne, type KreditParams, type KreditResult } from "@/lib/calculators/kredit";
import { fmtEuro, fmtProzent } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = KreditParams & Record<string, number | string | boolean>;

/** K:376 — dieselbe Annuitätenformel für die Vorschau, ohne den ganzen Tilgungsplan. */
function rate(w: KreditParams): number {
  const r = w.jahreszins / 100 / 12;
  if (r === 0) return w.kreditsumme / w.laufzeitMonate;
  return (w.kreditsumme * r) / (1 - Math.pow(1 + r, -w.laufzeitMonate));
}

/** Der Vergleich, auf den dieser Rechner zeigt — steht in den Säulen und in der Brücke. */
const VERGLEICH_TITEL = "Autokredit-Vergleich";

export const kreditSchema: RechnerSchema<W, KreditResult> = {
  slug: "kredit",
  titel: "Kreditrechner",
  kicker: "Rechner · Kredit",
  pfad: "Finanztools · Rechner · Kredit",
  vorspann:
    "Ziehen, drehen, tippen – die Rate rechnet sofort mit. Der Knopf öffnet das vollständige Ergebnis mit Tilgungsverlauf und Jahresübersicht.",

  start: { kreditsumme: 20000, laufzeitMonate: 60, jahreszins: 5.5 } as W,

  presets: [
    { id: "auto", label: "Autokredit", sub: "20.000 € · 60 Monate · 5,5 %", werte: { kreditsumme: 20000, laufzeitMonate: 60, jahreszins: 5.5 } as Partial<W>, neigung: "-3deg" },
    { id: "raten", label: "Ratenkredit", sub: "10.000 € · 48 Monate · 6,5 %", werte: { kreditsumme: 10000, laufzeitMonate: 48, jahreszins: 6.5 } as Partial<W>, neigung: "2deg" },
    { id: "modern", label: "Modernisierung", sub: "50.000 € · 120 Monate · 4,5 %", werte: { kreditsumme: 50000, laufzeitMonate: 120, jahreszins: 4.5 } as Partial<W>, neigung: "-1.5deg" },
  ],

  felder: [
    {
      baustein: "lineal", key: "kreditsumme", label: "Kreditsumme", bereich: "500 – 200.000 €", breit: true,
      min: 500, max: 200000, schritt: 500, px: 7, major: 20, mittel: 10, einheit: "€",
      marken: [
        { wert: 10000, label: "10.000" },
        { wert: 20000, label: "20.000" },
        { wert: 50000, label: "50.000" },
        { wert: 100000, label: "100.000" },
      ],
    },
    {
      baustein: "drehring", key: "laufzeitMonate", label: "Laufzeit", bereich: "am Ring drehen",
      min: 6, max: 120, schritt: 6, gross: 2, beschriftet: [12, 36, 60, 84, 108], einheit: "Monate",
      unter: (m) => `= ${(m / 12).toLocaleString("de-DE", { maximumFractionDigits: 1 })} Jahre`,
    },
    {
      baustein: "zaehlwerk", key: "jahreszins", label: "Zinssatz p.a.", bereich: "Sollzins",
      min: 0, max: 19.9, schritt: 0.1, dez: 1, einheit: "%",
      schnellwahl: [3.9, 5.5, 7.9, 9.9], hinweis: "gedrückt halten für schnelles Zählen",
    },
  ],

  vorschau: (w) => ({ vor: "Leo rechnet mit:", zahl: `≈ ${fmtEuro(rate(w))}`, nach: "im Monat · unverbindlich" }),

  rechne: (w, rates) => berechne(w, rates),

  /**
   * 🚨 Reihenfolge und Bestand nach der Vorlage (K, Seite 2, Ergebnis):
   *   Ring + Säulen · Kacheln · Kurve · Jahresübersicht · Hinweis
   * Bis zum 16.09.2026 fehlten hier RING UND SÄULEN ganz, und stattdessen stand ein
   * Anteilsband „So verteilt sich Ihre Zahlung" — den hat Runde 2 ausdrücklich gestrichen
   * („Der Block ist entfallen, der Ring ersetzt ihn"). Das Ergebnis sah dadurch anders
   * aus als jede Vorlage, aus der es gebaut sein sollte.
   */
  ergebnis: (e, w, _rates, markt) => [
    { art: "zeiger", label: "Zinsanteil", wert: (e.gesamtzinsen / e.gesamtbetrag) * 100, max: 100, einheit: " %" },
    /* Die Säulen der Vorlage: Ihre Rate · das beste Angebot · der Durchschnitt.
       🚨 Zwei der drei Zahlen kommen aus dem VERGLEICH, nicht aus dieser Rechnung — sie
       stehen erst da, wenn `markt` geladen ist, und bleiben weg, wenn der Partner nicht
       antwortet. Der Block verschwindet dann ganz; eine geschätzte Marktrate wäre in
       einem Finanzrechner eine Falschaussage. */
    ...(markt?.zahlen?.total?.best != null
      ? [{
          art: "messlatte" as const,
          titel: "Ihre Rate im Marktvergleich",
          wert: e.monatsrate, wertLabel: "Ihre Rate",
          weitere: [{
            label: `Bestes Angebot im ${VERGLEICH_TITEL}`,
            wert: markt.zahlen.total.best,
            ton: "tuerkis" as const,
          }],
          schnitt: markt.zahlen.total.schnitt,
          schnittLabel: `Ø der ${markt.zahlen.total.anzahl} Angebote`,
          einheit: " €",
        }]
      : []),
    {
      art: "kacheln",
      kacheln: [
        { label: "Monatsrate", wert: e.monatsrate, text: fmtEuro, haupt: true },
        { label: "Gesamtzinsen", wert: e.gesamtzinsen, text: fmtEuro },
        { label: "Gesamtbetrag", wert: e.gesamtbetrag, text: fmtEuro },
      ],
    },
    {
      art: "kurve",
      titel: "Restschuld über die Laufzeit",
      werte: e.verlauf,
      xText: (i) => (i === 12 ? "1 Jahr" : `${i / 12} J.`),
      scrubText: (i, v) => `Monat ${i} · Restschuld ${fmtEuro(v)}`,
    },
    {
      art: "tabelle",
      titel: "Jahresübersicht",
      letzteBetont: true,
      spalten: [
        { key: "jahr", label: "Jahr" },
        { key: "zinsen", label: "Zinsen", rechts: true, ton: "magenta" },
        { key: "tilgung", label: "Tilgung", rechts: true },
        { key: "rest", label: "Restschuld", rechts: true },
      ],
      zeilen: e.jahresplan.map((j) => ({
        jahr: `Jahr ${j.jahr}`,
        zinsen: fmtEuro(j.zinsen),
        tilgung: fmtEuro(j.tilgung),
        rest: fmtEuro(j.restschuld),
      })),
    },
    {
      // 🚨 Der Effektivzins stand im alten Satz in der Ergebnistabelle und fehlte hier —
      // die Übergabe zeigt ihn nicht, weil ihr Beispiel keinen ausweist. Er ist aber das
      // Einzige aus jener Tabelle, das nicht schon in den Eingabefeldern darüber steht:
      // Kreditsumme, Laufzeit und Sollzins tippt man selbst, den Effektivzins nicht.
      art: "punktzeilen",
      zeilen: [{ k: "Effektiver Jahreszins", v: fmtProzent(e.effektivzins) }],
    },
    {
      art: "hinweis",
      text: (
        <>
          <b>Hinweis:</b> Näherungsrechnung ohne Gewähr. Gebühren, Restschuldversicherung und
          bonitätsabhängige Zinsaufschläge sind nicht enthalten.
        </>
      ),
    },
  ],

  bruecke: {
    slug: "autokredit-vergleich",
    titel: VERGLEICH_TITEL,
    // 🚨 Zwei Sätze, nicht einer mit Lücken: solange die Marktzahlen laden (oder der
    // Partner schweigt), steht hier ein vollständiger Satz und kein Gerüst mit „…".
    satz: (w, e, markt) =>
      markt?.bestwert ? (
        <>
          Für {fmtEuro(w.kreditsumme)} über {w.laufzeitMonate} Monate gibt es im
          Autokredit-Vergleich aktuell <b>{markt.anzahl} {markt.mehrzahl}</b> –
          {" "}<b>{markt.bestwert.wert}</b> effektiv
          {markt.bestwert.total ? <>, das wären <b>{markt.bestwert.total}</b> im Monat</> : null}
          {" "}statt Ihrer {fmtEuro(e.monatsrate)}.
        </>
      ) : (
        <>
          Für {fmtEuro(w.kreditsumme)} über {w.laufzeitMonate} Monate zeigt der
          Autokredit-Vergleich die Angebote, die zu diesen Angaben passen — mit dem
          effektiven Jahreszins, den die Banken dafür heute nennen.
        </>
      ),
    koffer: (w, e) => `Kreditrechner: ${fmtEuro(w.kreditsumme)} über ${w.laufzeitMonate} Monate, ${fmtEuro(e.monatsrate)} im Monat`,
    // Die Schlüssel sind die Parameter der Registry-Kategorie „loans“
    // (lib/financeads/registry.ts): loan und duration_months.
    uebernimm: (w) => ({
      loan: Math.min(100000, Math.max(1000, Math.round(w.kreditsumme / 500) * 500)),
      duration_months: Math.min(120, Math.max(12, w.laufzeitMonate)),
    }),
  },
};
