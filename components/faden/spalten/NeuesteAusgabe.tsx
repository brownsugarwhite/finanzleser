/**
 * Das Kopfblatt des Kiosks: darüber die Überschrift „Kiosk" auf dem Papier der Seite,
 * im Blatt dann Ausgabe und Datum, der Schriftzug „Ratgeber" über die volle
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

export default function NeuesteAusgabe({ post, rubriken }: { post: Post | null; rubriken?: number }) {
  if (!post) return null;
  const titel = decodeHtmlEntities(post.title);
  const rubrik = post.categories?.nodes?.[0]?.name || "Ratgeber";
  const vorspann = post.untertitel || stripHtml(post.excerpt || "").slice(0, 180);
  const bild = post.featuredImage?.node?.sourceUrl;
  return (
    <>
      {/* Die Überschrift über dem ganzen Stapel — sie steht AUSSERHALB des Kopfblattes, auf
          dem Papier der Seite, im selben Satz wie jeder andere Blockkopf der Startseite
          (Wunsch 17.09.2026: „Kiosk steht außerhalb des Ratgebers über dem Zeitungsstapel
          als Überschrift für das ganze").
          🚨 Sie darf kein Geschwister ZWISCHEN Kopfblatt und Stapel werden: `Spalten.tsx`
          sucht das Kopfblatt über `previousElementSibling` des Kiosks. Deshalb steht sie
          VOR `.neueste`, nicht dahinter. */}
      <div className="landing-block__kopf kiosk-auftakt">
        <span className="kicker">Kiosk</span>
        <span className="landing-block__hinweis">{rubriken ? `${rubriken.toLocaleString("de-DE")} Ratgeber in vier Rubriken` : "Vier Rubriken, ein Stapel"}</span>
      </div>
      <section className="neueste kiosk-blatt haengt-an" aria-label="Neueste Ausgabe">
      {/* Ausgabe und Datum über dem Schriftzug — wie vor dem 13.09.2026 (Wunsch 17.09.).
          Ohne eigene Doppellinie: die des Laufbands trennt Titel und Zeile. */}
      <Zeitungskopf linie={false} />
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
    </>
  );
}
