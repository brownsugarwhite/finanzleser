/**
 * Anbieter-Inhalt (147 Versicherer-Kontaktseiten) zerlegen.
 *
 * Der CPT hat keine strukturierten Felder: alles steht als HTML im Beitrag
 * (Absätze, h2 „Kontaktdaten“, h3 mit Emoji, wp-block-table mit Zeilen Label/Wert).
 * Hier werden die Tabellenzeilen zu Schlüssel/Wert-Paaren, damit die Karte die
 * wichtigsten Wege (Website, E-Mail, Telefon) oben zeigen kann. Der volle Inhalt
 * bleibt als HTML erhalten und wird wie auf der alten Seite gerendert.
 */
import { stripTags } from "@/lib/articleHtml";

export interface AnbieterZeile { label: string; wert: string; html: string }
export interface AnbieterSektion { titel: string; zeilen: AnbieterZeile[] }
export interface AnbieterDaten {
  intro: string; // HTML vor „Kontaktdaten“
  sektionen: AnbieterSektion[];
  website?: string;
  email?: string;
  telefon?: string;
  adresse?: string;
}

export function zerlegeAnbieter(content: string): AnbieterDaten {
  const html = content || "";
  const kontaktIdx = html.search(/<h2\b[^>]*>\s*Kontaktdaten/i);
  const intro = (kontaktIdx > 0 ? html.slice(0, kontaktIdx) : "").replace(/<h2\b[\s\S]*?<\/h2>/gi, "").trim();
  const sektionen: AnbieterSektion[] = [];
  const re = /<h3\b[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3\b|<h2\b|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const titel = stripTags(m[1]).replace(/^[^\p{L}\p{N}]+/u, "").trim();
    const zeilen: AnbieterZeile[] = [];
    const tr = /<tr\b[^>]*>\s*<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>\s*<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let z: RegExpExecArray | null;
    while ((z = tr.exec(m[2])) !== null) {
      const label = stripTags(z[1]);
      const wert = stripTags(z[2]);
      if (label || wert) zeilen.push({ label, wert, html: z[2].trim() });
    }
    if (titel) sektionen.push({ titel, zeilen });
  }
  const alle = sektionen.flatMap((s) => s.zeilen);
  const finde = (re2: RegExp) => alle.find((z) => re2.test(z.label));
  const website = finde(/website|webseite|internet/i);
  const email = finde(/e-?mail/i);
  const telefon = finde(/haupt|zentrale|^telefon|service-?telefon|kundenservice/i) || alle.find((z) => /telefon|hotline/i.test(z.label));
  const adresse = finde(/adresse|anschrift/i);
  const href = (z?: AnbieterZeile) => { if (!z) return undefined; const h = z.html.match(/href="([^"]+)"/i); return h ? h[1] : z.wert; };
  return {
    intro,
    sektionen,
    website: href(website),
    email: (href(email) || "").replace(/^mailto:/i, "") || undefined,
    telefon: telefon?.wert,
    adresse: adresse?.wert,
  };
}
