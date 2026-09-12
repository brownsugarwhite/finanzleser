/**
 * Ziele der Kassensturz-Lücken auflösen — geteilt zwischen der Seite /kassensturz und
 * dem Kassensturz im Kapitel „Heute" (components/faden/FadenLanding.tsx). Eine Quelle,
 * damit beide dieselben Links zeigen.
 */
import { getBeitragsIndex } from "@/lib/faden/titel";
import { getWerkzeugIndex } from "@/lib/faden/werkzeugIndex";
import { buildGlossarUrl } from "@/lib/urls";
import { decodeHtmlEntities } from "@/lib/html-utils";
import type { KassensturzDaten } from "@/lib/faden/optionen";
import type { Ziel } from "@/components/faden/kassensturz/Kassensturz";

/**
 * Ziele aller Lücken als `typ:slug` → { href, titel }. Beiträge aus dem gecachten
 * Beitragsindex, Werkzeuge aus dem Werkzeugindex — nacheinander, keine Einzelabfragen.
 * Unbekannte Ziele führen zur Suche, damit im Ergebnis nie ein toter Link steht.
 */
export async function zieleAufloesen(d: KassensturzDaten): Promise<Record<string, Ziel>> {
  const links = (d.luecken || []).flatMap((l) => l.links || []);
  const out: Record<string, Ziel> = {};
  if (!links.length) return out;
  const beitraege = links.some((x) => x.typ === "post") ? await getBeitragsIndex() : null;
  const werkzeuge = links.some((x) => x.typ !== "post" && x.typ !== "glossar") ? await getWerkzeugIndex() : null;
  for (const x of links) {
    const key = `${x.typ}:${x.slug}`;
    if (out[key]) continue;
    const text = x.text || x.slug;
    let ziel: Ziel | undefined;
    if (x.typ === "post") {
      const p = beitraege?.get(x.slug);
      if (p) ziel = { href: p.href, titel: decodeHtmlEntities(p.titel) };
    } else if (x.typ === "glossar") {
      ziel = { href: buildGlossarUrl(x.slug), titel: text };
    } else {
      ziel = werkzeuge?.get(key);
    }
    out[key] = ziel || { href: `/suche?q=${encodeURIComponent(text)}`, titel: text };
  }
  return out;
}
