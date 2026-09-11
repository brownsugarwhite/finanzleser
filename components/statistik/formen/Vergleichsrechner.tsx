"use client";

/**
 * Werkzeug-Einhänger für den externen Vergleichsrechner — Design A v2, Handoff Zeile 1005–1030.
 *
 * Der Handoff zeigt drei Zustände nebeneinander (Zwei-Klick-Freigabe, schimmernde Ladebox,
 * geladener Rahmen). Die gibt es im Repo längst: `components/vergleich/VergleichEmbed` macht
 * genau das, mitsamt echter Einwilligung. Hier kommt nur die Chrome dazu — Oberlinie in
 * Türkis, Kicker mit 8-px-Punkt, Überschrift.
 */
import VergleichEmbed from "@/components/vergleich/VergleichEmbed";
import Insel from "@/components/faden/kette/Insel";
import type { StatVergleichsrechner } from "@/lib/statistik/schema";

export default function Vergleichsrechner({ st }: { st: StatVergleichsrechner }) {
  return (
    <div className="st-vergleich">
      <span className="st-vergleich__kicker kicker"><i />Vergleich · in der Kette</span>
      <h4>{st.titel}</h4>
      <Insel typ="vergleich" arg={st.slug}><VergleichEmbed slug={st.slug} /></Insel>
    </div>
  );
}
