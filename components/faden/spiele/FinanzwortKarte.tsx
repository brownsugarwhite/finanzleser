/**
 * Kasten „Finanzwort des Tages“ (Prototyp kaesten.wortspiel): pinker Kasten, Kicker
 * „Spiel · Finanzwort des Tages“, Titel „Finanzwort #N“, darin das Spiel. Ohne `spiel`
 * wird das heutige geladen (spielAm), die Nummer kommt aus spielNummer. Der Anzeigename
 * des Begriffs stammt aus dem Glossar (gecachter Getter). Ohne Spiel: nichts.
 */
import { spielAm, spielNummer } from "@/lib/faden/spiele";
import { getGlossarBySlug } from "@/lib/wordpress";
import { decodeHtmlEntities } from "@/lib/html-utils";
import { stripHtml } from "@/lib/seo";
import type { Spiel } from "@/lib/types";
import Finanzwort from "./Finanzwort";

/** Lösungswort spielbar machen: Großbuchstaben, ß → SS, nur A–Z Ä Ö Ü (die Tastatur hat kein ß). */
export function spielwort(roh: string | undefined): string {
  return (roh || "").toUpperCase().replace(/ẞ|ß/g, "SS").replace(/[^A-ZÄÖÜ]/g, "");
}

export default async function FinanzwortKarte({ spiel: vorgegeben }: { spiel?: Spiel | null } = {}) {
  const spiel = vorgegeben === undefined ? await spielAm("finanzwort") : vorgegeben;
  if (!spiel) return null;
  const wort = spielwort(spiel.felder.wort);
  if (wort.length < 2) return null;
  const nr = await spielNummer(spiel);
  const begriff = spiel.felder.begriff || "";
  const eintrag = begriff ? await getGlossarBySlug(begriff) : null;
  return (
    <article className="kasten kasten--pink" id={`kasten-${spiel.slug}`}>
      <span className="kicker kicker--tool kicker--pink">Spiel · Finanzwort des Tages</span>
      <h3>Finanzwort #{nr}</h3>
      <Finanzwort
        slug={spiel.slug}
        wort={wort}
        begriff={begriff}
        begriffName={eintrag ? decodeHtmlEntities(eintrag.title) : undefined}
        hinweis1={spiel.felder.hinweis1 || ""}
        hinweis2={spiel.felder.hinweis2 || ""}
        erklaerung={spiel.felder.erklaerung || (eintrag ? stripHtml(eintrag.content) : "")}
        nr={nr}
        datum={spiel.datum}
        punkte={spiel.punkte}
        wappen={spiel.wappen}
      />
    </article>
  );
}
