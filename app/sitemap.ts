import type { MetadataRoute } from "next";
import {
  getAllPosts,
  getAllRechner,
  getAllVergleiche,
  getAllChecklisten,
  getAllAnbieter,
  getNavItems,
} from "@/lib/wordpress";
import { SITE_URL } from "@/lib/seo";
import {
  buildPostUrl,
  buildRechnerUrl,
  buildVergleichUrl,
  buildChecklisteUrl,
  buildAnbieterUrl,
  buildCategoryUrl,
  buildSubcategoryUrl,
} from "@/lib/urls";

export const revalidate = 3600;

const STATIC_ROUTES: Array<{ path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }> = [
  { path: "/", changeFrequency: "daily", priority: 1.0 },
  { path: "/finanztools", changeFrequency: "weekly", priority: 0.9 },
  { path: "/finanztools/rechner", changeFrequency: "weekly", priority: 0.8 },
  { path: "/finanztools/vergleiche", changeFrequency: "weekly", priority: 0.8 },
  { path: "/finanztools/checklisten", changeFrequency: "weekly", priority: 0.8 },
  { path: "/suche", changeFrequency: "monthly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, rechner, vergleiche, checklisten, anbieter, navItems] = await Promise.all([
    safe(getAllPosts, []),
    safe(getAllRechner, []),
    safe(getAllVergleiche, []),
    safe(getAllChecklisten, []),
    safe(getAllAnbieter, []),
    safe(getNavItems, []),
  ]);

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const categoryEntries: MetadataRoute.Sitemap = navItems.flatMap((cat) => [
    {
      url: `${SITE_URL}${buildCategoryUrl(cat.href.replace(/^\//, ""))}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...cat.submenu.map((sub) => ({
      url: `${SITE_URL}${buildSubcategoryUrl(cat.href.replace(/^\//, ""), sub.href.split("/").pop() || "")}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]);

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}${buildPostUrl(post)}`,
    lastModified: post.date ? new Date(post.date) : now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const rechnerEntries: MetadataRoute.Sitemap = rechner.map((r) => ({
    url: `${SITE_URL}${buildRechnerUrl(r.slug)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const vergleichEntries: MetadataRoute.Sitemap = vergleiche.map((v) => ({
    url: `${SITE_URL}${buildVergleichUrl(v.slug)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const checklistenEntries: MetadataRoute.Sitemap = checklisten.map((c) => ({
    url: `${SITE_URL}${buildChecklisteUrl(c.slug)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const anbieterEntries: MetadataRoute.Sitemap = anbieter.map((a) => ({
    url: `${SITE_URL}${buildAnbieterUrl(a.slug)}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.4,
  }));

  return [
    ...staticEntries,
    ...categoryEntries,
    ...postEntries,
    ...rechnerEntries,
    ...vergleichEntries,
    ...checklistenEntries,
    ...anbieterEntries,
  ];
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error("[sitemap] fetch failed:", e);
    return fallback;
  }
}
