/**
 * Deutsche Darstellung der Kennzahlen — eine Stelle für alle Skins, SSR und Client.
 * Zahlen deutsch (Komma, Punkt als Tausender), Euro ohne Nachkommastellen ab 100,
 * Prozent mit bis zu zwei Stellen. Muster: lib/statistik/formeln.ts `formatWert`.
 */
import type { DefLite, KennWert, SpalteDef, VergleichDaten, VergleichProdukt } from "./typen.ts";

export function formatZahl(wert: number, stellen: number): string {
  return wert.toLocaleString("de-DE", { minimumFractionDigits: stellen, maximumFractionDigits: stellen });
}

export function formatGeld(wert: number): string {
  const abs = Math.abs(wert);
  const stellen = abs >= 100 || Number.isInteger(wert) ? 0 : 2;
  return `${formatZahl(wert, stellen)} €`;
}

export function formatProzent(wert: number): string {
  const stellen = Number.isInteger(wert) ? 0 : Math.abs(wert) < 1 ? 2 : 2;
  return `${formatZahl(wert, stellen)} %`;
}

/** Zelle einer Spalte als Text; `–` für fehlende Werte (wie in den Statistik-Tabellen). */
export function formatKennwert(spalte: SpalteDef, wert: KennWert | undefined): string {
  if (wert === null || wert === undefined || wert === "") return "–";
  const ab = spalte.ab ? "ab " : "";
  switch (spalte.art) {
    case "geld": return typeof wert === "number" ? `${ab}${formatGeld(wert)}` : String(wert);
    case "prozent": return typeof wert === "number" ? `${ab}${formatProzent(wert)}` : String(wert);
    case "zahl": return typeof wert === "number" ? formatZahl(wert, 0) : String(wert);
    case "monate": return typeof wert === "number" ? `${formatZahl(wert, 0)} Monate` : String(wert);
    case "haken": return wert === true ? "✓" : wert === false ? "–" : String(wert);
    case "saldo":
      if (typeof wert !== "number") return String(wert);
      if (wert < 0) return `+ ${formatGeld(-wert)} Ertrag`;
      return wert === 0 ? "0 €" : formatGeld(wert);
    default: return String(wert);
  }
}

/** Gesamtzahl rechts (Ertrag, Beitrag, Rate) — aus `total` oder der Bestwert-Spalte. */
export function formatTotal(p: VergleichProdukt, spalte?: SpalteDef): string {
  if (spalte) return formatKennwert(spalte, p.kennzahlen[spalte.key]);
  if (p.total) return `${p.total.art === "benefit" ? "+ " : ""}${formatGeld(p.total.wert)}`;
  return "–";
}

/** „Stand 15.09.2026" aus einem ISO-Datum. */
export function formatStand(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Der eine Satz mit Kennzahl — für Metadata, „Kurz gesagt" und Leos Karten:
 *   „38 Konten im Vergleich, Bestwert 304 € Ertrag im Zeitraum, Stand 15.09.2026."
 *   „40 Tarife von 13 Versicherern im Überblick, Stand 15.09.2026."
 */
export function kurzSatz(def: Pick<DefLite, "klasse" | "mehrzahl" | "spalten" | "bestwert" | "totalLabel">, daten: Pick<VergleichDaten, "varianten" | "anzahl" | "stand"> | null): string {
  if (!daten || !daten.varianten.length) return "";
  const v = daten.varianten[0];
  const stand = formatStand(daten.stand);
  if (def.klasse === "B") {
    const versicherer = new Set(v.produkte.map((p) => p.anbieter)).size;
    return `${v.produkte.length} ${def.mehrzahl} von ${versicherer} Versicherern im Überblick, Stand ${stand}.`;
  }
  const haupt = def.spalten.find((s) => s.key === def.bestwert?.key) || def.spalten[def.spalten.length - 1];
  const best = v.produkte.find((p) => p.id === v.bestwert);
  const wert = haupt && best ? formatKennwert(haupt, best.kennzahlen[haupt.key]) : "";
  const label = def.totalLabel || haupt?.label || "";
  return `${v.produkte.length} ${def.mehrzahl} im Vergleich${wert && wert !== "–" ? `, Bestwert ${wert} ${label}` : ""}, Stand ${stand}.`;
}
