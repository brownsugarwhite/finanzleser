/**
 * Sprungleiste: der Bestand als flacher Index (Ratgeber, Rubriken, Themen, Werkzeuge,
 * Begriffe) für das Typeahead in der Eingabe. Nur gecachte Listen-Getter, nacheinander
 * (nie mehr als drei Anfragen parallel gegen WordPress); Reihenfolge = Rang.
 */
import { cache } from "react";
import { getAllPosts, getNavItems, getAllGlossar } from "@/lib/wordpress";
import { buildPostUrl, buildGlossarUrl } from "@/lib/urls";
import { decodeHtmlEntities } from "@/lib/html-utils";
import { FADEN_AKTIV } from "./flag";
import { getWerkzeugIndex } from "./werkzeugIndex";
import { getFadenOptionen } from "./optionen";
import { spielAm } from "./spiele";

export type IndexTyp = "ratgeber" | "rubrik" | "thema" | "rechner" | "vergleich" | "checkliste" | "dokumente" | "begriff" | "seite" | "spiel";
export interface IndexEintrag { typ: IndexTyp; titel: string; unter?: string; href: string }

export const buildFadenIndex = cache(async (): Promise<IndexEintrag[]> => {
  const out: IndexEintrag[] = [];
  const nav = await getNavItems();
  for (const r of nav) {
    if (!r.submenu?.length) continue;
    out.push({ typ: "rubrik", titel: r.label, href: r.href });
    for (const s of r.submenu) out.push({ typ: "thema", titel: s.label, unter: r.label, href: s.href });
  }
  const posts = await getAllPosts();
  for (const p of posts) out.push({ typ: "ratgeber", titel: decodeHtmlEntities(p.title), unter: p.untertitel ? decodeHtmlEntities(p.untertitel) : undefined, href: buildPostUrl(p) });
  const werkzeuge = await getWerkzeugIndex();
  for (const [key, v] of werkzeuge) out.push({ typ: key.split(":")[0] as IndexTyp, titel: v.titel, href: v.href });
  if (FADEN_AKTIV) {
    for (const g of await getAllGlossar()) out.push({ typ: "begriff", titel: decodeHtmlEntities(g.title), unter: g.rubrik || undefined, href: buildGlossarUrl(g.slug) });
    // Feste Ziele wie im Prototyp-Index (Kassensturz, Mein Bereich, Lebenslagen, Finanzwort des Tages).
    const { lebensereignisse, kassensturz } = await getFadenOptionen();
    if (kassensturz) out.push({ typ: "seite", titel: kassensturz.titel || "Finanz-Kassensturz", unter: kassensturz.untertitel || "3 Minuten, keine Anmeldung", href: "/kassensturz" });
    out.push({ typ: "seite", titel: "Mein Bereich", unter: "Finanzleser Plus · Punkte, Wappen, Aktenkoffer, Wächter", href: "/plus" });
    out.push({ typ: "seite", titel: "Aktenkoffer", unter: "Was Sie abgelegt haben", href: "/plus/aktenkoffer" });
    out.push({ typ: "seite", titel: "Wächter", unter: "Wecker auf Zahlen und Fristen", href: "/plus/waechter" });
    out.push({ typ: "seite", titel: "Lebenslagen", unter: lebensereignisse.map((e) => e.titel).join(" · "), href: "/lebenslagen" });
    for (const e of lebensereignisse) out.push({ typ: "seite", titel: e.titel, unter: "Lebenslage · " + e.phasen.map((p) => p.titel).join(" · "), href: `/lebenslagen/${e.key}` });
    const fw = await spielAm("finanzwort");
    if (fw) out.push({ typ: "spiel", titel: "Finanzwort des Tages", unter: "Spiel · sechs Versuche", href: `/spiele/${fw.slug}` });
  }
  return out;
});
