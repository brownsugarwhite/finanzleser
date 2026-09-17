"use client";

/**
 * Die Vergleichs-Teaser unter Leos Satz — Baustein 2 der Übergabe „Finanzleser Heute“.
 *
 * Zwei nebeneinander auf Satzbreite, darunter die nächsten zwei; getrennt durch
 * Haarlinien, kein Kasten und kein Schatten. Je Teaser: Kicker und Bestand, Titel,
 * Preiszeile mit dem Bestwert, das Säulen-Marktband und der Verweis in den Vergleich.
 *
 * 🚨 Hier stand bis zum 17.09.2026 eine Bildkarte: Platzhaltergrafik, Titel, erster Satz
 * der Beschreibung. Die Übergabe ersetzt das Bild durch den Markt selbst — jede Säule ist
 * ein echter Tarif aus dem Schnappschuss. Ein Teaser ohne Zahlen kommt gar nicht erst
 * hierher (`lib/faden/vergleichTeaser.ts` gibt dann `null` zurück).
 *
 * Der Hover-Rahmen zeichnet sich in drei Schritten (oben → rechts → unten und links) und
 * ist reines CSS: vier Linien mit `transform: scale`, gestaffelt über `transition-delay`.
 */
import { useFaden } from "@/components/faden/FadenProvider";
import Marktband from "./Marktband";
import type { VergleichTeaser } from "@/lib/faden/vergleichTeaser";

export default function VergleichsTeaser({ teaser }: { teaser: VergleichTeaser[] }) {
  const { navigieren } = useFaden();
  if (!teaser.length) return null;
  return (
    <>
      <div className="vgl-teaser__raster">
        {teaser.map((t) => (
          <a
            key={t.slug}
            className="vgl-teaser"
            href={t.href}
            onClick={(e) => { e.preventDefault(); navigieren(t.href); }}
          >
            {/* Der Hover-Rahmen: vier Linien, die sich nacheinander ziehen. */}
            <i className="vgl-teaser__rahmen" aria-hidden="true"><em /><em /><em /><em /></i>

            <span className="vgl-teaser__kopf">
              <span className="kicker kicker--tool"><i className="dot dot--vergleich" aria-hidden="true" />Vergleich</span>
              <span className="vgl-teaser__bestand">{t.bestand}</span>
            </span>

            <b className="vgl-teaser__titel">{t.titel}</b>

            <span className="vgl-teaser__preis">
              <span className="vgl-teaser__zahl">
                {t.ab && <em>ab</em>}
                {t.bis && <em>bis zu</em>}
                <b>{t.wert}</b>
                {t.periode && <em>{t.periode}</em>}
              </span>
              {t.spanne && <span className="vgl-teaser__spanne">{t.spanne}</span>}
            </span>

            <Marktband
              saeulen={t.saeulen}
              schnitt={t.schnitt}
              schnittText={t.schnittText}
              bestFuss={t.bestFuss}
              randFuss={t.randFuss}
            />

            <span className="vgl-teaser__mehr">
              <span className="strich-link strich-link--gross">{t.mehr}<i /></span>
            </span>
          </a>
        ))}
      </div>
      {/* Pflichtangabe und Lesehilfe in einem — der Satz erklärt, was eine Säule ist. */}
      <p className="vgl-teaser__fussnote">
        Anzeige · Vergleiche mit Partnerlinks. Jede Säule ist ein Tarif, sortiert von
        günstig nach teuer; die Höhe zeigt die Ersparnis gegenüber dem teuersten Tarif —
        der Bestwert ragt heraus; die gestrichelte Linie ist der Marktdurchschnitt.
      </p>
    </>
  );
}
