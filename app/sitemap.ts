import type { MetadataRoute } from "next";
import {
  getAllPosts,
  getAllRechner,
  getAllVergleiche,
  getAllChecklisten,
  getAllAnbieter,
  getAllDokumente,
  getNavItems,
} from "@/lib/wordpress";
import { SITE_URL } from "@/lib/seo";
import {
  buildPostUrl,
  buildRechnerUrl,
  buildVergleichUrl,
  buildChecklisteUrl,
  buildAnbieterUrl,
  buildDokumentUrl,
  buildCategoryUrl,
  buildSubcategoryUrl,
} from "@/lib/urls";

export const revalidate = 86400;

const STATIC_ROUTES: Array<{ path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }> = [
  { path: "/", changeFrequency: "daily", priority: 1.0 },
  { path: "/finanztools", changeFrequency: "weekly", priority: 0.9 },
  { path: "/finanztools/rechner", changeFrequency: "weekly", priority: 0.8 },
  { path: "/finanztools/vergleiche", changeFrequency: "weekly", priority: 0.8 },
  { path: "/finanztools/checklisten", changeFrequency: "weekly", priority: 0.8 },
  { path: "/dokumente", changeFrequency: "weekly", priority: 0.8 },
  { path: "/suche", changeFrequency: "monthly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, rechner, vergleiche, checklisten, anbieter, dokumente, navItems] = await Promise.all([
    safe(getAllPosts, []),
    safe(getAllRechner, []),
    safe(getAllVergleiche, []),
    safe(getAllChecklisten, []),
    safe(getAllAnbieter, []),
    safe(getAllDokumente, []),
    safe(getNavItems, []),
  ]);

  // NIE eine Rumpf-Sitemap ausliefern: Kommt eine Kern-Abfrage trotz Retries leer
  // zurück (WP-Überlast), soll die Regeneration FEHLSCHLAGEN — Next liefert dann die
  // letzte gute Sitemap weiter (stale-on-error), statt die halbe Site aus der Sitemap
  // zu werfen (Vorfall 2026-08-06: 822 → 413 URLs während einer WP-Überlastphase).
  const kern: Array<[string, number]> = [
    ["posts", posts.length], ["rechner", rechner.length], ["checklisten", checklisten.length],
    ["vergleiche", vergleiche.length], ["anbieter", anbieter.length], ["dokumente", dokumente.length],
    ["navItems", navItems.length],
  ];
  const leer = kern.filter(([, n]) => n === 0).map(([name]) => name);
  if (leer.length > 0) {
    throw new Error(`[sitemap] Kern-Abfragen leer (${leer.join(", ")}) → Regeneration abgebrochen, letzte gute Sitemap bleibt aktiv`);
  }

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const categoryEntries: MetadataRoute.Sitemap = navItems.flatMap((cat) => [
    {
      url: `${SITE_URL}${buildCategoryUrl(cat.href.replace(/^\//, ""))}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...cat.submenu.map((sub) => ({
      url: `${SITE_URL}${buildSubcategoryUrl(cat.href.replace(/^\//, ""), sub.href.split("/").pop() || "")}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]);

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}${buildPostUrl(post)}`,
    // Echtes Änderungsdatum aus WP — ein täglich rotierender Build-Zeitstempel machte
    // lastmod für Google wertlos. Ohne Datum lieber gar kein lastmod als ein falsches.
    ...(post.modified || post.date ? { lastModified: new Date((post.modified || post.date) as string) } : {}),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const rechnerEntries: MetadataRoute.Sitemap = rechner.map((r) => ({
    url: `${SITE_URL}${buildRechnerUrl(r.slug)}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const vergleichEntries: MetadataRoute.Sitemap = vergleiche.map((v) => ({
    url: `${SITE_URL}${buildVergleichUrl(v.slug)}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const checklistenEntries: MetadataRoute.Sitemap = checklisten.map((c) => ({
    url: `${SITE_URL}${buildChecklisteUrl(c.slug)}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const anbieterEntries: MetadataRoute.Sitemap = anbieter.map((a) => ({
    url: `${SITE_URL}${buildAnbieterUrl(a.slug)}`,
    changeFrequency: "yearly" as const,
    priority: 0.4,
  }));

  const dokumentEntries: MetadataRoute.Sitemap = dokumente.map((d) => ({
    url: `${SITE_URL}${buildDokumentUrl(d.slug)}`,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  return [
    ...staticEntries,
    ...categoryEntries,
    ...postEntries,
    ...rechnerEntries,
    ...vergleichEntries,
    ...checklistenEntries,
    ...anbieterEntries,
    ...dokumentEntries,
  ];
}

// 3 Versuche mit Backoff: ein transienter IONOS-Einbruch unter Build-Last hat sonst
// schon einmal eine fast leere Sitemap (30 statt ~820 URLs) live geshippt.
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fn();
    } catch (e) {
      console.error(`[sitemap] fetch failed (Versuch ${attempt}/3):`, e);
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
  return fallback;
}
