/**
 * Rohantwort → unsere schlanke Form. Hier schrumpfen 15–395 KB auf wenige KB:
 * nur Felder, die eine Zeile der Tarifliste braucht, Vorteile auf drei gekürzt,
 * Logos in EINER Größe, Siegel höchstens zwei.
 */
import type { ApiAntwort, ApiProdukt, KategorieDef, KennWert, Richtung, VergleichProdukt, VergleichVariante } from "./typen.ts";
import { de, klartext, juengstesDatum, text, zahl, pfad } from "./lesehilfen.ts";

/**
 * 🚨 Der Deckel war 40 und hat drei Listen still gekürzt.
 *
 * Gemessen am 16.09.2026 gegen die API mit denselben Angaben: Kreditkarten 49 Angebote,
 * Privathaftpflicht 47, Tagesgeld 41 — bei uns standen überall genau 40. Wer unsere Seite
 * neben den Vergleichsrechner von financeads legte, sah unten andere Anbieter, und zwar
 * ohne jeden Hinweis darauf. Die größte gemessene Kategorie liefert 49; 80 lässt Luft,
 * ohne dass ein Schnappschuss aus dem Rahmen fällt (der größte liegt bei 132 KB, die
 * Warnschwelle bei 200 KB).
 */
const MAX_PRODUKTE = 80;
const MAX_VORTEILE = 3;

function absolut(u: string | null | undefined): string | undefined {
  const s = text(u);
  if (!s) return undefined;
  // financeads liefert protokollrelative und teils doppelte Schrägstriche („net//079028").
  return s.replace(/^\/\//, "https://").replace(/([^:])\/\/+/g, "$1/");
}

export function normalisiereProdukt(def: KategorieDef, p: ApiProdukt, params: Record<string, string> = {}): VergleichProdukt | null {
  const b = p.base_data;
  if (!b || !b.id || !b.tracking?.url) return null;
  const vorteile = (p.benefits || [])
    .slice()
    .sort((a, c) => (a.rang ?? 99) - (c.rang ?? 99))
    .map((v) => klartext(de(v.text)))
    .filter((v): v is string => !!v)
    .map((v) => v.replace(/\s*\*+\s*$/, "").slice(0, 90))
    .slice(0, MAX_VORTEILE);
  const siegel = (b.image_urls || [])
    .filter((i) => i.categorie === "approval_seal" && (i.width ?? 0) >= 100)
    .map((i) => absolut(i.url))
    .filter((u): u is string => !!u)
    .slice(0, 2);
  const kennzahlen = def.lesen(p, params);
  const pflicht = kennzahlen.pflicht;
  if ("pflicht" in kennzahlen) delete kennzahlen.pflicht;
  const total = p.calculated_conditions?.total;
  const totalWert = total && total.sum !== null && total.sum !== undefined ? zahl(total.sum) : null;
  return {
    id: b.id,
    typ: b.type,
    anbieter: text(b.program?.name) || text(b.advertiser?.name) || "",
    tarif: text(b.name) || "",
    logo: absolut(b.program?.logo_urls?.["50x200"]) || absolut(b.program?.logo_urls?.["40x120"]),
    siegel: siegel.length ? siegel : undefined,
    kennzahlen,
    total: totalWert !== null ? { wert: totalWert, art: total?.type === "benefit" ? "benefit" : "cost", einheit: (text(total?.currency) || "EUR").replace(/&#x20ac;/i, "EUR") } : undefined,
    link: b.tracking.url,
    vorteile,
    hinweis: typeof pflicht === "string" ? pflicht : (p.incentives || []).map((i) => klartext(i.description)).find(Boolean) || undefined,
    bezahlt: b.commission !== false,
  };
}

/** Bestwert nach Registry-Regel: kleinster/größter Wert der Spalte, Gleichstand → erster. */
export function bestwertId(produkte: VergleichProdukt[], regel: { key: string; richtung: Richtung } | undefined): number | undefined {
  if (!regel) return undefined;
  let best: VergleichProdukt | undefined;
  let bestWert = 0;
  for (const p of produkte) {
    const w = p.kennzahlen[regel.key];
    if (typeof w !== "number") continue;
    if (!best || (regel.richtung === "hoch" ? w > bestWert : w < bestWert)) { best = p; bestWert = w; }
  }
  return best?.id;
}

/** Sortierung nach einer Spalte; Produkte ohne Wert ans Ende, Reihenfolge sonst stabil. */
export function sortiere(produkte: VergleichProdukt[], key: string, richtung: Richtung): VergleichProdukt[] {
  return produkte
    .map((p, i) => ({ p, i, w: p.kennzahlen[key] }))
    .sort((a, b) => {
      const an = typeof a.w === "number"; const bn = typeof b.w === "number";
      if (an && bn) { const d = (a.w as number) - (b.w as number); if (d !== 0) return richtung === "hoch" ? -d : d; return a.i - b.i; }
      if (an) return -1; if (bn) return 1;
      return a.i - b.i;
    })
    .map((x) => x.p);
}

/** Schlüssel einer Parameter-Kombination — sortiert, damit Reihenfolge nie zwei Varianten macht. */
export function paramSchluessel(params: Record<string, string | number>): string {
  return Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
}

export function normalisiereVariante(def: KategorieDef, params: Record<string, string | number>, antwort: ApiAntwort, limit = MAX_PRODUKTE): VergleichVariante {
  const roh = antwort.data?.products || [];
  const p: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) if (v !== "" && v !== undefined && v !== null) p[k] = String(v);
  // Die angefragten Werte gehören in `lesen`: manche Angebote sagen selbst, für welche
  // Summen und Laufzeiten sie überhaupt gelten (Kredit, `interest_effective.requirements`).
  let produkte = roh.map((x) => normalisiereProdukt(def, x, p)).filter((x): x is VergleichProdukt => !!x);
  if (def.bestwert) produkte = sortiere(produkte, def.bestwert.key, def.bestwert.richtung);
  produkte = produkte.slice(0, limit);
  const bestwert = bestwertId(produkte, def.bestwert);
  const best = produkte.find((x) => x.id === bestwert);
  return { schluessel: paramSchluessel(p), params: p, produkte, bestwert, bestwertGrund: best && def.begruendung ? def.begruendung(best) : undefined };
}

/** Jüngster Konditionsstand aller Produkte, sonst null. */
export function standAus(antwort: ApiAntwort): string | null {
  let best: string | null = null;
  for (const p of antwort.data?.products || []) { const d = juengstesDatum(p); if (d && (!best || d > best)) best = d; }
  return best ? best.replace(" ", "T") : null;
}

/** Deutsche Hinweise von financeads (`data.notices`). */
export function hinweiseAus(antwort: ApiAntwort): string[] {
  const n = antwort.data?.notices;
  if (!n || typeof n !== "object") return [];
  return Object.values(n).map((v) => text(pfad(v, "de"))).filter((s): s is string => !!s);
}

export function kennwertAls<T extends KennWert>(v: KennWert | undefined, typ: "number" | "string" | "boolean"): T | null {
  return typeof v === typ ? (v as T) : null;
}

/**
 * Nebenvarianten abspecken: Logo, Siegel, Vorteile und Pflichttext sind je Produkt gleich,
 * egal welcher Betrag gerechnet wurde — sie stehen nur in der Voreinstellung. Ohne das
 * wog ein Snapshot mit neun Varianten 160 KB (Autokredit, gemessen 15.09.2026).
 */
export function varianteAbspecken(v: VergleichVariante): VergleichVariante {
  return { ...v, produkte: v.produkte.map((p) => ({ id: p.id, typ: p.typ, anbieter: p.anbieter, tarif: p.tarif, kennzahlen: p.kennzahlen, total: p.total, link: p.link, vorteile: [], bezahlt: p.bezahlt })) };
}

/** Gegenstück: eine abgespeckte Variante mit den Details der Voreinstellung auffüllen. */
export function varianteErgaenzen(v: VergleichVariante, standard: VergleichVariante): VergleichVariante {
  const nach = new Map(standard.produkte.map((p) => [p.id, p]));
  return { ...v, produkte: v.produkte.map((p) => { const s = nach.get(p.id); return s ? { ...s, ...p, vorteile: p.vorteile.length ? p.vorteile : s.vorteile, hinweis: p.hinweis ?? s.hinweis, logo: p.logo ?? s.logo, siegel: p.siegel ?? s.siegel } : p; }) };
}
