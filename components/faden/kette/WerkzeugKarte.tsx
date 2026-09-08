/**
 * Werkzeug in der Kette (Rechner, Checkliste, Vergleich, Dokumente).
 *
 * Meilenstein 1: Karte mit Titel, Kicker und Sprung zur eigenen Seite. In M2 kommen
 * die echten Körper (RechnerEmbed, ChecklisteEmbed, DokumenteEmbed, VergleichEmbed)
 * hier hinein — die Karten-Chrome bleibt.
 */
import type { ArticleToolData } from "@/lib/articleToolData";
import type { Teil } from "@/lib/faden/kette";
import { buildRechnerUrl, buildChecklisteUrl, buildVergleichUrl, buildDokumentUrl } from "@/lib/urls";

type Embed = Extract<Teil, { art: "embed" }>;

const LABEL: Record<Embed["typ"], { typ: string; dot: string; ton: string; text: string }> = {
  rechner: { typ: "Rechner", dot: "rechner", ton: "pink", text: "der interaktive Rechner" },
  checkliste: { typ: "Checkliste", dot: "checkliste", ton: "lila", text: "die interaktive Checkliste" },
  vergleich: { typ: "Anzeige · Vergleich mit Partnerlinks", dot: "vergleich", ton: "tuerkis", text: "die Vergleichstabelle" },
  dokumente: { typ: "Dokumente", dot: "dokumente", ton: "terra", text: "die Dokumente mit Vorschau und Download" },
};

function titelAus(toolData: ArticleToolData | undefined, typ: Embed["typ"], slug: string): string | undefined {
  const t = toolData?.titles as Record<string, unknown> | undefined;
  if (!t) return undefined;
  const kandidaten = [`${typ}:${slug}`, `${typ}/${slug}`, slug];
  for (const key of kandidaten) {
    const v = t[key];
    if (!v) continue;
    if (typeof v === "string") return v;
    if (typeof v === "object" && v && "title" in v && typeof (v as { title: unknown }).title === "string") return (v as { title: string }).title;
  }
  return undefined;
}

export const toolTitel = {
  eins: titelAus,
  /** Alle bekannten Werkzeugtitel als `typ:slug` → Titel (für Verweise). */
  alle(toolData?: ArticleToolData): Record<string, string> {
    const out: Record<string, string> = {};
    const t = toolData?.titles as Record<string, unknown> | undefined;
    if (!t) return out;
    for (const [key, v] of Object.entries(t)) {
      const titel = typeof v === "string" ? v : (v && typeof v === "object" && "title" in v ? String((v as { title: unknown }).title) : "");
      if (titel) out[key.replace("/", ":")] = titel;
    }
    return out;
  },
};

function urlFuer(typ: Embed["typ"], slug: string): string {
  if (typ === "rechner") return buildRechnerUrl(slug);
  if (typ === "checkliste") return buildChecklisteUrl(slug);
  if (typ === "vergleich") return buildVergleichUrl(slug);
  return buildDokumentUrl(slug);
}

export default function WerkzeugKarte({ teil, toolData }: { teil: Embed; toolData?: ArticleToolData }) {
  const lab = LABEL[teil.typ];
  const slugs = teil.slugs && teil.slugs.length ? teil.slugs : [teil.slug];
  const titel = teil.typ === "dokumente" && slugs.length > 1 ? "Dokumente zum Ratgeber" : titelAus(toolData, teil.typ, teil.slug) || slugs[0].replace(/-/g, " ");
  return (
    <div className={`kasten kasten--${lab.ton} kasten--inline`} data-werkzeug={`${teil.typ}:${teil.slug}`}>
      {teil.grund && <div className="einwurf einwurf--inline">Leo wirft ein: {teil.grund}</div>}
      <span className="kicker kicker--tool kicker--gruen"><i className={`dot dot--${lab.dot}`} />{lab.typ}{teil.nachtrag ? " · zum Ratgeber" : " · in der Kette"}</span>
      <h3>{titel}</h3>
      {teil.typ === "dokumente" && (
        <ul className="dokumente">
          {slugs.map((s) => (
            <li key={s}><i className="dot dot--dokumente" /><a href={buildDokumentUrl(s)}>{titelAus(toolData, "dokumente", s) || s.replace(/-/g, " ")}</a></li>
          ))}
        </ul>
      )}
      <p className="quelle">Hier steht {lab.text}; die Karte wird mit dem nächsten Schritt gefüllt.</p>
      <a className="btn btn--klein" href={urlFuer(teil.typ, slugs[0])}>Als Seite öffnen</a>
    </div>
  );
}
