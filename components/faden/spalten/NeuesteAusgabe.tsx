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
import Laufband from "./Laufband";

export default function NeuesteAusgabe({ post }: { post: Post | null }) {
  if (!post) return null;
  const titel = decodeHtmlEntities(post.title);
  const rubrik = post.categories?.nodes?.[0]?.name || "Ratgeber";
  const vorspann = post.untertitel || stripHtml(post.excerpt || "").slice(0, 180);
  const bild = post.featuredImage?.node?.sourceUrl;
  return (
    <section className="neueste kiosk-blatt" aria-label="Neueste Ausgabe">
      {/* 🚨 Hier stand „Ausgabe n · Datum" ein zweites Mal. Die Zeile war dem Kopfblatt am
          11.09.2026 zugefallen, weil der Faden damals ohne Zeitungskopf begann. Seit der
          wieder an seinem Platz steht (13.09.), stünden beide auf EINEM Bildschirm — die
          Ausgabe wird einmal ausgerufen, nicht zweimal. Der Schriftzug bleibt. */}
      {/* Der Schriftzug ist zugleich der Schalter, der den Stapel wieder zusammenfahren
          lässt — Spalten.tsx hängt sich an `data-kiosk-zu`. Ein echter Knopf, damit er
          auch mit der Tastatur erreichbar ist. */}
      <button type="button" className="kiosk-mast" data-kiosk-zu title="Alle Ausgaben zuklappen">Ratgeber</button>
      <Laufband text="Neueste Ausgabe · frisch aus der Redaktion" />
      <a className="neueste__blatt" href={buildPostUrl(post)}>
        {bild && (
          <span className="neueste__bild">
            {/* Das erste große Bild der Seite und in ~1 s im Blick — es wartet nicht auf den
                Scroll. Die Maße kommen aus `aspect-ratio: 16/9` (faden.css), deshalb kein Sprung. */}
            <img src={medienUrl(bild)} alt={post.featuredImage?.node?.altText || ""} loading="eager" decoding="async" />
          </span>
        )}
        <span className="neueste__satz">
          <span className="kicker">{decodeHtmlEntities(rubrik)}</span>
          <b className="neueste__titel">{titel}</b>
          {vorspann && <span className="neueste__vorspann">{decodeHtmlEntities(vorspann)}</span>}
          <span className="strich-link strich-link--gross">Ausgabe aufschlagen<i /></span>
        </span>
      </a>
    </section>
  );
}
