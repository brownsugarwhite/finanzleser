"use client";

/**
 * Werkzeug-Einhänger für den externen Vergleichsrechner — Design A v2, Handoff Zeile 1005–1030.
 *
 * Der Handoff zeigt drei Zustände nebeneinander (Zwei-Klick-Freigabe, schimmernde Ladebox,
 * geladener Rahmen). Die gibt es im Repo längst: `components/vergleich/VergleichEmbed` macht
 * genau das, mitsamt echter Einwilligung. Hier kommt nur die Chrome dazu — Oberlinie in
 * Türkis, Kicker mit 8-px-Punkt, Überschrift.
 *
 * 🚨 `VergleichEmbed`, NICHT `VergleichKoerper`. Diese Datei ist eine CLIENT-Komponente;
 * `VergleichKoerper` ist eine ASYNCHRONE SERVER-Komponente. Eine Client-Komponente kann
 * die nicht rendern — React bricht mit „is an async Client Component" ab, und weil das
 * mitten in der Hydration passiert, hydriert danach die GANZE SEITE nicht mehr.
 *
 * Gemessen am 16.09.2026 auf /schaukasten: kein Datum im Zeitungskopf, kein
 * Inhaltsverzeichnis links, kein einziges bedienbares Element — ohne eine einzige
 * Meldung im Produktionsbuild. Sichtbar wurde es erst mit React im Entwicklungsmodus.
 */
import VergleichEmbed from "@/components/vergleich/VergleichEmbed";
import type { StatVergleichsrechner } from "@/lib/statistik/schema";

export default function Vergleichsrechner({ st }: { st: StatVergleichsrechner }) {
  return (
    <div className="st-vergleich">
      <span className="st-vergleich__kicker kicker"><i />Vergleich · in der Kette</span>
      <h3>{st.titel}</h3>
      <VergleichEmbed slug={st.slug} />
    </div>
  );
}
