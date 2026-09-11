/**
 * Das Kopfblatt des Kiosks: Ausgabe und Datum, der Schriftzug „Ratgeber" über die volle
 * Blattbreite, das Laufband, darunter die Titelseite der neuesten Ausgabe — Bild, Rubrik,
 * Schlagzeile, Vorspann und die Zeile zum Aufschlagen.
 *
 * Es liegt als erstes Blatt über dem Stapel der vier Rubriken (Spalten.tsx) und trägt
 * deshalb dieselbe Papieroptik (`kiosk-blatt`).
 *
 * 🚨 Die Klasse `neueste` muss bleiben: `components/faden/Begruessung.tsx` sucht sie, um
 * das Blatt erst nach Leos Gruß einzublenden. Und es bleibt ein GESCHWISTER des Stapels,
 * kein Elternteil — sonst misst `angehaengt()` am falschen Knoten.
 *
 * Der Beitrag ist der jüngste aus dem CMS. Fehlt er (leeres CMS), fällt der ganze Block
 * weg statt einen leeren Rahmen zu hinterlassen.
 */
import type { Post } from "@/lib/types";
import { buildPostUrl } from "@/lib/urls";
import { medienUrl } from "@/lib/faden/medien";
import { decodeHtmlEntities } from "@/lib/html-utils";
import { stripHtml } from "@/lib/seo";
import Zeitungskopf from "../Zeitungskopf";
import Laufband from "./Laufband";

export default function NeuesteAusgabe({ post }: { post: Post | null }) {
  if (!post) return null;
  const titel = decodeHtmlEntities(post.title);
  const rubrik = post.categories?.nodes?.[0]?.name || "Ratgeber";
  const vorspann = post.untertitel || stripHtml(post.excerpt || "").slice(0, 180);
  const bild = post.featuredImage?.node?.sourceUrl;
  return (
    <section className="neueste kiosk-blatt" aria-label="Neueste Ausgabe">
      {/* Ohne eigene Doppellinie: die des Laufbands trennt Titel und Zeile. */}
      <Zeitungskopf linie={false} />
      <b className="kiosk-mast">Ratgeber</b>
      <Laufband text="Neueste Ausgabe · frisch aus der Redaktion" />
      <a className="neueste__blatt" href={buildPostUrl(post)}>
        {bild && (
          <span className="neueste__bild">
            <img src={medienUrl(bild)} alt={post.featuredImage?.node?.altText || ""} loading="lazy" />
          </span>
        )}
        <span className="neueste__satz">
          <span className="kicker">{decodeHtmlEntities(rubrik)}</span>
          <b className="neueste__titel">{titel}</b>
          {vorspann && <span className="neueste__vorspann">{decodeHtmlEntities(vorspann)}</span>}
          <span className="pfeil-link">Ausgabe aufschlagen<i /></span>
        </span>
      </a>
    </section>
  );
}
