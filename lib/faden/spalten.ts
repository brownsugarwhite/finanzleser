/**
 * Daten für die Zeitungsspalten auf der Startseite: vier Rubriken → Themen → Ratgeber
 * (Titel, Untertitel, Werkzeugpunkte) + Werkzeuge je Thema. Nur bestehende, gecachte
 * Getter (getPostsByCategory, getMegamenuToolsByCategory), höchstens drei parallel.
 */
import type { NavItem } from "@/lib/navItems";
import { getPostsByCategory, getMegamenuToolsByCategory, getKategorieBilder, type MegamenuTool } from "@/lib/wordpress";
import { buildPostUrl, buildRechnerUrl, buildChecklisteUrl, buildVergleichUrl } from "@/lib/urls";
import { CATEGORY_ICONS } from "@/lib/categoryIcons";
import { medienUrl } from "@/lib/faden/medien";
import type { ToolType } from "@/components/ui/ToolDots";

export interface SpaltenEintrag { slug: string; titel: string; untertitel: string; href: string; tools: ToolType[] }
export interface SpaltenWerkzeug { typ: MegamenuTool["type"]; slug: string; titel: string; href: string }
export interface SpaltenThema { key: string; name: string; href: string; zahl: number; liste: SpaltenEintrag[]; werkzeuge: SpaltenWerkzeug[] }
export interface SpaltenRubrik { key: string; titel: string; href: string; icon?: string; bild?: { src: string; alt: string }; zahl: number; themen: SpaltenThema[] }

async function begrenzt<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

function werkzeugHref(t: MegamenuTool): string {
  if (t.type === "rechner") return buildRechnerUrl(t.slug);
  if (t.type === "checkliste") return buildChecklisteUrl(t.slug);
  return buildVergleichUrl(t.slug);
}

/**
 * 🚨 `maxJeThema` ist bewusst klein.
 *
 * Sichtbar sind im Kiosk drei Ratgeber je Thema. Alles, was hier mehr geladen wird, landet
 * als `<script data-insel-werte>` nicht nur im HTML der Startseite, sondern über
 * `lib/faden/schnappschuss.ts` in JEDEM eingefrorenen Kapitel im sessionStorage — die
 * Säuberung verschont diese Skripte ausdrücklich. Bei 12 waren das vier Rubriken × alle
 * Themen × 12 Beiträge, je Schnappschuss.
 */
export async function baueSpalten(nav: NavItem[], maxJeThema = 3): Promise<SpaltenRubrik[]> {
  const rubriken = nav.filter((n) => n.submenu && n.submenu.length);
  const alleThemen = rubriken.flatMap((r) => (r.submenu || []).map((s) => ({ rubrik: r, sub: s })));
  // Die Kategoriebilder VOR der Themenrunde, in einer einzigen Abfrage: parallel zu
  // `begrenzt(…, 3, …)` wären es vier gleichzeitige Verbindungen zum WordPress (CLAUDE.md,
  // Falle 1). Fehler werfen lassen wie unten — ein bildloses Blatt hinge sonst 24 h im Cache.
  const bilder = await getKategorieBilder(rubriken.map((r) => r.href.replace(/^\//, "")));
  const daten = await begrenzt(alleThemen, 3, async ({ sub }) => {
    const slug = sub.href.split("/").filter(Boolean).pop() || "";
    // Fehler werfen lassen: ein geschluckter Fehler würde als leere Spalte in den ISR-Cache gebacken.
    const [posts, tools] = await Promise.all([getPostsByCategory(slug), getMegamenuToolsByCategory(slug)]);
    return { slug, posts, tools };
  });
  const byHref = new Map(alleThemen.map((t, i) => [t.sub.href, daten[i]]));
  return rubriken.map((r) => {
    const key = r.href.replace(/^\//, "");
    const themen: SpaltenThema[] = (r.submenu || []).map((s) => {
      const d = byHref.get(s.href);
      const posts = d?.posts || [];
      return {
        key: s.href.split("/").filter(Boolean).pop() || "",
        name: s.label,
        href: s.href,
        zahl: posts.length,
        liste: posts.slice(0, maxJeThema).map((p) => ({ slug: p.slug, titel: p.title, untertitel: p.untertitel || "", href: buildPostUrl(p), tools: (p.tools || []) as ToolType[] })),
        werkzeuge: (d?.tools || []).slice(0, 4).map((t) => ({ typ: t.type, slug: t.slug, titel: t.title, href: werkzeugHref(t) })),
      };
    }).filter((t) => t.zahl > 0);
    const bild = bilder.get(key);
    return {
      key, titel: r.label, href: r.href, icon: CATEGORY_ICONS[key],
      bild: bild ? { src: medienUrl(bild.src), alt: bild.alt } : undefined,
      zahl: themen.reduce((n, t) => n + t.zahl, 0), themen,
    };
  });
}
