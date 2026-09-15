"use client";

/**
 * Der Vergleich im Kursblatt-Satz.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:56-213 (Seite 1) und
 * „… Festgeld & Eingaben“:50-162 (Seite 3). Reihenfolge: Kicker „Anzeige …“ → H1 →
 * Vorspann mit lebenden Zahlen → Ihre Angaben → Marktüberblick → Podest → Alle Angebote
 * → Rechtliche Hinweise. Merkzettel liegt fest unten rechts.
 *
 * Zustand kommt aus `useVergleichZustand` — derselbe Kern wie bei der alten Liste, damit
 * Hash, Nachladen und der Sichtkontakt nicht zweimal geführt werden.
 *
 * 🚨 Kein eigener Zeitungskopf im Faden: dort ist die Kapitelzeile („Kapitel n · Pfad ·
 * Uhrzeit“, components/faden/KapitelKopf.tsx) bereits der Zeitungskopf. Zwei davon
 * übereinander wären eine Dopplung, die der Prototyp nur deshalb nicht kennt, weil er
 * ein einzelnes Dokument ist.
 */
import { useMemo } from "react";
import type { DefLite, VergleichDaten, VergleichQuelle } from "@/lib/financeads/typen";
import { useVergleichZustand } from "@/lib/financeads/useVergleichZustand";
import { formatKennwert, formatStand } from "@/lib/financeads/format";
import { hauptspalte } from "@/lib/financeads/kursblatt";
import Wertetabelle from "@/components/statistik/formen/Wertetabelle";
import IhreAngaben from "./IhreAngaben";

export interface KursblattVergleichProps {
  slug: string;
  def: DefLite;
  quelle: VergleichQuelle;
  daten: VergleichDaten;
  /** Redaktioneller Zusatz hinter den lebenden Zahlen (Textauszug des CPT). */
  beschreibung?: string;
}

export default function KursblattVergleich({ slug, def, quelle, daten, beschreibung }: KursblattVergleichProps) {
  const z = useVergleichZustand({ slug, def, quelle, daten });
  const haupt = hauptspalte(def);

  // K:60 — die Zahlen im Vorspann leben: sie zeigen, was gerade eingestellt ist.
  const best = z.aktuelle.produkte.find((p) => p.id === z.aktuelle.bestwert) ?? z.aktuelle.produkte[0];
  const bestWert = haupt && best ? formatKennwert(haupt, best.kennzahlen[haupt.key]) : "";

  const wertetabelle = useMemo(() => ({
    reihen: def.klasse === "A" ? def.spalten.map((s) => s.label) : ["Tarif"],
    zeilen: z.aktuelle.produkte.map((p) => ({
      name: `${p.anbieter} · ${p.tarif}`,
      werte: def.klasse === "A" ? def.spalten.map((s) => formatKennwert(s, p.kennzahlen[s.key])) : [p.tarif],
    })),
  }), [z.aktuelle.produkte, def.spalten, def.klasse]);

  return (
    <div className="kb kb--vergleich" ref={z.wurzel} data-vergleich={slug}>
      <span className="kb__anzeige">Anzeige · Vergleich mit Partnerlinks</span>
      <h1 className="kb__titel">{def.titel}</h1>
      <p className="kb__vorspann">
        <b>{z.aktuelle.produkte.length} {def.mehrzahl}</b> im Vergleich
        {/* Die Bezeichnung kommt aus der Hauptspalte, nicht aus `totalLabel`: bei Krediten
            ist der Bestwert der Effektivzins, `totalLabel` aber „Rate / Monat“. */}
        {bestWert && bestWert !== "–" ? <>, Bestwert <b>{bestWert}</b> {haupt?.kurz ?? haupt?.label}</> : null}
        , Stand {formatStand(daten.stand)}.{beschreibung ? ` ${beschreibung}` : ""}
      </p>

      <IhreAngaben def={def} quelle={quelle} params={z.params} onParam={z.setParam} />

      {z.fehler && <p className="kb__fehler" role="alert">{z.fehler} Gezeigt wird die Voreinstellung.</p>}

      {/* Marktüberblick, Podest und Liste folgen in den nächsten Schritten. */}

      <Wertetabelle
        titel={`${def.titel}: alle ${z.aktuelle.produkte.length} ${def.mehrzahl}`}
        spalte={def.einzahl}
        reihen={wertetabelle.reihen}
        zeilen={wertetabelle.zeilen}
      />

      <p className="kb__recht">
        <b>Rechtliche Hinweise:</b> Der kostenlose Vergleich bietet keinen kompletten
        Marktüberblick und finanziert sich über Provisionen, die wir bei Produktabschlüssen
        erhalten.{def.hinweis ? ` ${def.hinweis}` : ""}{quelle.hinweis ? ` ${quelle.hinweis}` : ""} Stand {formatStand(daten.stand)}.
      </p>
    </div>
  );
}
