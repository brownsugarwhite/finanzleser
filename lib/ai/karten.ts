/**
 * Leo legt eine Karte: Welcher Vergleich passt zu Frage und Antwort?
 *
 * Rein lexikalisch, ohne Backend-Änderung (Konzept_Technik_Anhang 3.3): die Suchwörter
 * der financeads-Kategorien (lib/financeads/registry.ts) gegen Frage + Antwort, gewichtet
 * mit der Nähe zur Voreinstellung (die Basis-Seite einer Kategorie schlägt ihre Varianten,
 * es sei denn, die Frage nennt die Variante). Höchstens EINE Karte, nur bei klarem Treffer.
 *
 * Datenquelle ist der gecachte Snapshot-Index (welche Slugs welcher Kategorie) plus der
 * Werkzeugindex (Titel, Adresse) — keine zusätzliche WordPress-Abfrage je Chat-Antwort.
 */
import { getVergleichUebersicht } from "@/lib/financeads/laden";
import { kategorieDef } from "@/lib/financeads/registry";
import { getWerkzeugIndex } from "@/lib/faden/werkzeugIndex";

export interface CardRef {
  type: "vergleich";
  slug: string;
  titel: string;
  href: string;
  /** Warum diese Karte („passt zu Ihrer Frage nach Tagesgeld"). */
  reason: string;
}

/** Wörter, die eine Variante kennzeichnen — trifft eins davon, gewinnt die Variante vor der Basis. */
const VARIANTEN_WOERTER: Record<string, string[]> = {
  "studentenkonto-vergleich": ["student", "studierende", "studium", "uni"],
  "schuelerkonto-vergleich": ["schüler", "kind", "kinder", "jugendlich", "taschengeld"],
  "reisekreditkarte-vergleich": ["reise", "urlaub", "ausland", "fremdwährung"],
  "kostenlose-kreditkarte-vergleich": ["kostenlos", "gebührenfrei", "ohne jahresgebühr"],
  "autokredit-vergleich": ["auto", "kfz", "fahrzeug", "wagen"],
  "minikredit-vergleich": ["minikredit", "kleinkredit", "kurzfristig", "bis zum monatsende"],
  "katzenkrankenversicherung-vergleich": ["katze", "kater", "katzen"],
  "hundekrankenversicherung-vergleich": ["hund", "hunde", "welpe"],
};

function normal(s: string): string {
  return ` ${s.toLowerCase().replace(/[^a-z0-9äöüß%€.,-]+/gi, " ").replace(/\s+/g, " ")} `;
}

function trifft(text: string, wort: string): number {
  const w = wort.toLowerCase();
  // Wortanfang reicht (Tagesgeld → Tagesgeldkonto), aber nicht mitten im Wort.
  const re = new RegExp(`(^|[^a-zäöüß])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g");
  return (text.match(re) || []).length;
}

/** Karte zur Frage — oder null, wenn kein Vergleich klar passt. */
export async function findeVergleichKarte(frage: string, antwort: string, aktuellerSlug?: string): Promise<CardRef | null> {
  const [uebersicht, index] = await Promise.all([getVergleichUebersicht(), getWerkzeugIndex()]);
  const fr = normal(frage);
  const ant = normal(antwort);
  let beste: { slug: string; punkte: number } | null = null;
  for (const [slug, u] of Object.entries(uebersicht)) {
    if (u.defekt || !u.anzahl) continue;
    const def = kategorieDef(u.kategorie);
    if (!def) continue;
    // Frage zählt dreifach, Antwort einfach; die ersten Suchwörter einer Kategorie sind die stärksten.
    let punkte = 0;
    def.suchwoerter.forEach((w, i) => { const gewicht = i === 0 ? 3 : i < 3 ? 2 : 1; punkte += gewicht * (3 * trifft(fr, w) + trifft(ant, w)); });
    if (punkte === 0) continue;
    const varianten = VARIANTEN_WOERTER[slug];
    if (varianten) {
      const v = varianten.reduce((n, w) => n + trifft(fr, w) + trifft(ant, w), 0);
      punkte = v > 0 ? punkte + 4 * v : punkte - 6;  // Variante ohne ihr Stichwort tritt hinter die Basis
    }
    if (!beste || punkte > beste.punkte) beste = { slug, punkte };
  }
  if (!beste || beste.punkte < 6) return null;
  const href = `/finanztools/vergleiche/${beste.slug}`;
  // Auf der Vergleichsseite selbst keine Karte auf sich selbst.
  if (aktuellerSlug && aktuellerSlug === beste.slug) return null;
  const eintrag = index.get(`vergleich:${beste.slug}`);
  const def = kategorieDef(uebersicht[beste.slug].kategorie);
  const titel = eintrag?.titel.replace(/\s*[–-]?\s*Vergleich$/i, "").trim() || def?.titel || beste.slug;
  return { type: "vergleich", slug: beste.slug, titel, href, reason: `passt zu Ihrer Frage nach ${def?.titel || titel}` };
}
