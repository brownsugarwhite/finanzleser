/**
 * Der Vorlage-Beitrag als Kapitel im Faden.
 *
 * 🚨 Das ist eine ECHTE Kopie aus dem CMS (`vorlage-test` auf cms-dev), kein erfundener
 * Beitrag. Angelegt und aktualisiert mit `node tools/vorlage-test.mjs` — dort steht auch,
 * wovon kopiert wird. An einer echten Kopie lässt sich im CMS alles umstellen und
 * durchprobieren, ohne einen redaktionellen Beitrag anzufassen; daraus wird später die
 * Vorlage fürs Content Studio.
 *
 * Sie geht durch dieselbe Verarbeitung wie jeder Beitrag (`KetteKapitel` → `baueKette`).
 * Fehlt sie im CMS, sagt die Seite, wie man sie anlegt — sie fällt bewusst NICHT auf
 * einen Platzhalter zurück, denn genau der soll hier nicht mehr stehen.
 *
 * Existiert nur mit SCHAUKASTEN_AKTIV (lib/faden/flag.ts) und trägt noindex.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SCHAUKASTEN_AKTIV } from "@/lib/faden/flag";
import { getPostBySlug } from "@/lib/wordpress";
import { getArticleToolData } from "@/lib/articleToolData";
import KetteKapitel from "@/components/faden/kette/KetteKapitel";
import KartenKapitel from "@/components/faden/KartenKapitel";
import SchaukastenModus from "@/components/faden/SchaukastenModus";

/** Slug der Kopie im CMS — derselbe Standardwert wie in tools/vorlage-test.mjs. */
const VORLAGE = "vorlage-test";

export const metadata: Metadata = {
  title: "Schaukasten · Vorlage-Beitrag",
  robots: { index: false, follow: false },
};

export default async function SchaukastenVorlage() {
  if (!SCHAUKASTEN_AKTIV) notFound();
  // Kein .catch: fehlt das CMS, soll der Fehler werfen statt eine halbe Seite zu cachen
  // (CLAUDE.md, Falle 2). `null` heißt hier wirklich „Beitrag gibt es nicht".
  const post = await getPostBySlug(VORLAGE);

  if (!post) {
    return (
      <>
        <SchaukastenModus />
        <KartenKapitel
          schluessel="schaukasten-vorlage-fehlt"
          titel="Der Vorlage-Beitrag fehlt"
          kicker="Abnahme · Vorlage"
          krumen={[{ name: "Abnahme", href: "/schaukasten" }]}
          url="/schaukasten/ratgeber"
        >
          <div className="kasten kasten--still" style={{ padding: "14px 18px" }}>
            <p style={{ margin: 0 }}>
              Im CMS gibt es keinen Beitrag mit dem Slug <code>{VORLAGE}</code>. Er wird als Kopie
              eines vorhandenen Ratgebers angelegt:
            </p>
            <p className="prose"><code>node tools/vorlage-test.mjs</code></p>
            <p className="quelle" style={{ margin: 0 }}>
              Standardquelle ist „Photovoltaik Förderung“; ein anderer Ausgangsbeitrag geht als
              erstes Argument. Ziel ist immer cms-dev, nie das Produktions-CMS.
            </p>
          </div>
        </KartenKapitel>
      </>
    );
  }

  const toolData = await getArticleToolData(post.content, post.slug);
  return <><SchaukastenModus /><KetteKapitel post={post} toolData={toolData} /></>;
}
