"use client";

/**
 * Der Einbau eines Rechners — im Artikel, auf der Rechnerseite und in der Werkzeugkarte
 * des Fadens.
 *
 * Seit dem Kursblatt gibt es genau einen Weg: `lib/rechner/schemata/<slug>.tsx` beschreibt
 * Felder, Vorschau und Ergebnis, `KursblattRechner` setzt es. Der 123-Zeilen-`switch` mit
 * 56 `dynamic()`-Konstanten ist damit ersatzlos entfallen, ebenso `rechner-layout`,
 * `RechnerPlaceholder` und die Ergebnis-Portale — der Kursblatt-Satz bringt seinen
 * eigenen Kopf, sein eigenes Ergebnis und seinen eigenen Pflichthinweis mit.
 *
 * Bleibt ein Slug ohne Schema, rendert hier nichts. Das ist gewollt: ein Rechner, den
 * niemand beschrieben hat, ist kein halber Rechner, sondern keiner.
 */
import { schemaFuer } from "@/lib/rechner/schemata";
import KursblattRechner from "@/components/kursblatt/rechner/KursblattRechner";

export interface RechnerEmbedProps {
  slug: string;
  /** Im Artikel trägt schon das Kapitel die Überschrift. */
  noVisual?: boolean;
}

export default function RechnerEmbed({ slug, noVisual = false }: RechnerEmbedProps) {
  const schema = schemaFuer(slug);
  if (!schema) return null;
  return <KursblattRechner schema={schema} ohneKopf={noVisual} />;
}
