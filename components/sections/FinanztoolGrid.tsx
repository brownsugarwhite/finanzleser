import Button from "@/components/ui/Button";
import {
  getAllRechner,
  getAllVergleiche,
  getAllChecklisten,
} from "@/lib/wordpress";
import { buildRechnerUrl, buildVergleichUrl, buildChecklisteUrl } from "@/lib/urls";
import { decodeHtmlEntities } from "@/lib/html-utils";
import FinanztoolRows, { type ToolItem } from "./FinanztoolRows";

/**
 * Finanztool-Listen unter der Artikel-Liste (Subkategorie-Seiten). Pro Typ (alle 4
 * immer vorhanden): Badge + „Passende [Typ] zu [Kategorie]", max. 3 Items nebeneinander
 * (durch Spark-Divider getrennt), darunter ein „zu Allen …"-Button. Items: Titel fett
 * kursiv + kleine Beschreibung. Tools werden HEURISTISCH nach Kategorie sortiert
 * (Keyword-/Typ-/Dok-Kategorie-Bonus), dann auf die neuesten 3 aufgefüllt.
 */

const PER_GRID = 3;

const RECHNERTYP_MAIN: Record<string, string> = {
  steuer: "steuern",
  brutto_netto: "steuern",
  kredit: "finanzen",
  rente: "finanzen",
  festgeld: "finanzen",
  tagesgeld: "finanzen",
  soziales: "recht",
};

const TYPE_CFG = {
  rechner: { badge: "Rechner", cta: "Zum Rechner", allLabel: "Rechnern", allHref: "/finanztools/rechner", color: "var(--color-tool-rechner)" },
  vergleich: { badge: "Vergleiche", cta: "Zum Vergleich", allLabel: "Vergleichen", allHref: "/finanztools/vergleiche", color: "var(--color-tool-vergleiche)" },
  checkliste: { badge: "Checklisten", cta: "Zur Checkliste", allLabel: "Checklisten", allHref: "/finanztools/checklisten", color: "var(--color-tool-checklisten)" },
} as const;

function strip(html?: string): string {
  // ZUERST dekodieren (WP liefert teils `&lt;p&gt;…`), DANN Tags entfernen — sonst
  // bleibt ein literales `<p>` stehen.
  return decodeHtmlEntities(html || "").replace(/<[^>]*>/g, "").trim();
}
/** Nur der erste Satz (bis zum ersten .!? bzw. Ende). */
function firstSentence(s: string): string {
  const m = s.match(/^[\s\S]*?[.!?](\s|$)/);
  return (m ? m[0] : s).trim();
}
function tokens(s: string): string[] {
  return (s || "").toLowerCase().replace(/[^a-zäöüß0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 4);
}
function keywordScore(text: string, keywords: string[]): number {
  const t = (text || "").toLowerCase();
  let s = 0;
  for (const k of keywords) if (t.includes(k)) s++;
  return s;
}

/** Treffer (score>0) zuerst, dann auf die neuesten (Quell-Reihenfolge) auffüllen → bis zu `count`. */
function pick<T>(list: T[], toText: (x: T) => string, bonus: (x: T) => number, keywords: string[], count: number): T[] {
  const scored = list.map((x) => ({ x, s: keywordScore(toText(x), keywords) + bonus(x) }));
  const matched = scored.filter((o) => o.s > 0).sort((a, b) => b.s - a.s);
  const rest = scored.filter((o) => o.s <= 0);
  return [...matched, ...rest].slice(0, count).map((o) => o.x);
}

interface FinanztoolGridProps {
  mainCategorySlug?: string;
  mainCategoryName?: string;
  categoryName?: string;
  categorySlug?: string;
  /** Tools pro Reihe (Default 3; Hauptkategorie 4 wegen breiterem Content). */
  perRow?: number;
}

export default async function FinanztoolGrid({ mainCategorySlug, mainCategoryName, categoryName, perRow = PER_GRID }: FinanztoolGridProps) {
  const [rechner, vergleiche, checklisten] = await Promise.all([
    getAllRechner(),
    getAllVergleiche(),
    getAllChecklisten(),
  ]);

  const keywords = Array.from(new Set([...tokens(categoryName || ""), ...tokens(mainCategoryName || "")]));
  const catLabel = decodeHtmlEntities(categoryName || mainCategoryName || "");

  const r = pick(
    rechner,
    (x) => `${x.title} ${x.excerpt || ""} ${x.rechnerFelder?.beschreibung || ""}`,
    (x) => {
      const typ = Array.isArray(x.rechnerFelder?.rechnerTyp) ? x.rechnerFelder?.rechnerTyp[0] : x.rechnerFelder?.rechnerTyp;
      return typ && RECHNERTYP_MAIN[typ] === mainCategorySlug ? 2 : 0;
    },
    keywords,
    perRow,
  ).map((x): ToolItem => ({ title: decodeHtmlEntities(x.title), desc: firstSentence(strip(x.rechnerFelder?.beschreibung || x.excerpt)), href: buildRechnerUrl(x.slug) }));

  const v = pick(vergleiche, (x) => `${x.title} ${x.excerpt || ""}`, () => 0, keywords, perRow)
    .map((x): ToolItem => ({ title: decodeHtmlEntities(x.title), desc: firstSentence(strip(x.excerpt)), href: buildVergleichUrl(x.slug) }));

  const c = pick(
    checklisten,
    (x) => `${x.title} ${x.excerpt || ""} ${x.checklisten?.checklistenBeschreibung || ""}`,
    () => 0,
    keywords,
    perRow,
  ).map((x): ToolItem => ({ title: decodeHtmlEntities(x.title), desc: firstSentence(strip(x.checklisten?.checklistenBeschreibung || x.excerpt)), href: buildChecklisteUrl(x.slug) }));

  const sections = [
    { key: "rechner" as const, items: r },
    { key: "vergleich" as const, items: v },
    { key: "checkliste" as const, items: c },
  ].filter((s) => s.items.length > 0);

  if (sections.length === 0) return null;

  return (
    <div className="finanztool-grids">
      {sections.map(({ key, items }) => {
        const cfg = TYPE_CFG[key];
        return (
          <section key={key} className="finanztool-grid-section" style={{ ["--tool-color" as string]: cfg.color }}>
            <div className="finanztool-section-head">
              <span className="finanztool-heading-badge" style={{ background: cfg.color }}>{cfg.badge}</span>
              <span className="finanztool-section-sub">{catLabel}</span>
            </div>
            <FinanztoolRows items={items} cta={cfg.cta} perRow={perRow} />
            <div className="finanztool-allbtn">
              <Button label={`Zu allen ${cfg.allLabel}`} href={cfg.allHref} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
