/**
 * Finanz-Kassensturz: acht Fragen, ein Ergebnis (Service · Kassensturz). Fragen, Lücken,
 * Profil und Score kommen aus den Faden-Optionen des CMS; die Ziele der Lückenkarten
 * (Ratgeber, Rechner, Vergleiche …) löst diese Server-Seite zu Adresse und Titel auf,
 * damit die Client-Komponente nur noch verlinkt. Nur mit NEXT_PUBLIC_FADEN=1.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FADEN_AKTIV } from "@/lib/faden/flag";
import { getFadenOptionen, type KassensturzDaten } from "@/lib/faden/optionen";
import { getBeitragsIndex } from "@/lib/faden/titel";
import { getWerkzeugIndex } from "@/lib/faden/werkzeugIndex";
import { buildGlossarUrl } from "@/lib/urls";
import { buildMetadata } from "@/lib/seo";
import { decodeHtmlEntities } from "@/lib/html-utils";
import KartenKapitel from "@/components/faden/KartenKapitel";
import Kassensturz, { type Ziel } from "@/components/faden/kassensturz/Kassensturz";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Finanz-Kassensturz: 3 Minuten – finanzleser.de",
  description: "Acht Fragen, keine Tastatur, keine Anmeldung: Ihr Profil, Ihre Ampel und die drei größten Lücken, sofort und vollständig, mit passendem Ratgeber und Werkzeug.",
  path: "/kassensturz",
});

/**
 * Ziele aller Lücken als `typ:slug` → { href, titel }. Beiträge aus dem gecachten
 * Beitragsindex, Werkzeuge aus dem Werkzeugindex — nacheinander, keine Einzelabfragen.
 * Unbekannte Ziele führen zur Suche, damit im Ergebnis nie ein toter Link steht.
 */
async function zieleAufloesen(d: KassensturzDaten): Promise<Record<string, Ziel>> {
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

export default async function KassensturzSeite() {
  if (!FADEN_AKTIV) notFound();
  const { kassensturz } = await getFadenOptionen();
  if (!kassensturz || !Array.isArray(kassensturz.fragen) || !kassensturz.fragen.length) notFound();
  const ziele = await zieleAufloesen(kassensturz);
  return (
    <KartenKapitel
      schluessel="kassensturz"
      titel="Finanz-Kassensturz"
      kicker={`Service · ${kassensturz.untertitel || "3 Minuten · keine Anmeldung"}`}
      beschreibung="Acht Fragen, keine Tastatur. Am Ende sehen Sie Ihr Profil und Ihre drei größten Lücken, sofort und vollständig."
      krumen={[{ name: "Service", href: "/kassensturz" }, { name: "Kassensturz", href: "/kassensturz" }]}
      url="/kassensturz"
    >
      <Kassensturz daten={kassensturz} ziele={ziele} />
    </KartenKapitel>
  );
}
