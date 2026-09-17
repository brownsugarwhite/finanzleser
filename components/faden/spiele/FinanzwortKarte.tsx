/**
 * „Finanzwort des Tages“ auf der Startseite — halbe Spalte, Anzeige daneben.
 *
 * 🚨 Seit dem 17.09.2026 steht das Spiel RECHTS und die Anzeige links, im selben
 * Satzraster wie die Schlange (`spiel-satz`). Vorher war es ein Kasten über die volle
 * Breite; die gelbe Einhängerlinie lief dabei auch über die Anzeige.
 *
 * 🚨 Das Spiel wird NICHT kleiner. Sein Gitter (7 × 48 px) und die Tastatur setzen die
 * Breite; die Spalte folgt ihnen (`min-content`), und die Anzeige nimmt, was übrig
 * bleibt. Umgekehrt — feste Anzeigenbreite, Spiel im Rest — würde das Spiel stauchen.
 *
 * Ohne `spiel` wird das heutige geladen (spielAm), die Nummer kommt aus spielNummer.
 * Der Anzeigename des Begriffs stammt aus dem Glossar (gecachter Getter). Ohne Spiel: nichts.
 */
import { spielAm, spielNummer } from "@/lib/faden/spiele";
import { getGlossarBySlug } from "@/lib/wordpress";
import { decodeHtmlEntities } from "@/lib/html-utils";
import { stripHtml } from "@/lib/seo";
import type { Spiel } from "@/lib/types";
import Insel from "@/components/faden/kette/Insel";
import Einschub from "@/components/faden/Einschub";
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
  const werte = {
    slug: spiel.slug,
    wort,
    begriff,
    begriffName: eintrag ? decodeHtmlEntities(eintrag.title) : undefined,
    hinweis1: spiel.felder.hinweis1 || "",
    hinweis2: spiel.felder.hinweis2 || "",
    erklaerung: spiel.felder.erklaerung || (eintrag ? stripHtml(eintrag.content) : ""),
    nr,
    datum: spiel.datum,
    punkte: spiel.punkte,
    wappen: spiel.wappen,
  };
  return (
    <section className="spiel-satz spiel-satz--wortspiel" id={`kasten-${spiel.slug}`}>
      {/* Das Spiel steht im Markup zuerst — es ist die Hauptsache und soll auf schmalem
          Schirm oben stehen. Auf breitem Schirm tauscht das Raster die Reihenfolge.
          🚨 Die Kopfzeile steht IM Spiel (Finanzwort.tsx), nicht hier: sonst fehlt sie
          überall, wo das Spiel ohne diese Karte auftritt — und im eingefrorenen Kapitel
          stünde sie doppelt, sobald die Insel das Spiel wiederbelebt.
          🚨 In einer Insel, sonst ist das Spiel im eingefrorenen Kapitel ein Foto. */}
      <div className="spiel-satz__koerper">
        <Insel typ="finanzwort" werte={werte}><Finanzwort {...werte} /></Insel>
      </div>
      <aside className="spiel-satz__rand">
        {/* 🚨 Wolkenkratzer, nicht Rectangle: Die Spalte ist rund 265 px breit — ein
            300-px-Rechteck würde auf 261 skaliert, und die Schrift der Anzeige läuft dann
            über ihren eigenen Rand. 160 × 600 passt ohne Skalierung und füllt die Höhe
            neben dem hohen Spielfeld. */}
        <Einschub format="skyscraper" variante="neben" nr={0} />
        <p className="spiel-satz__notiz">Anzeigen finanzieren die Redaktion · Plus liest werbefrei</p>
      </aside>
    </section>
  );
}
