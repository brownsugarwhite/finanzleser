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
import { useMemo, useState } from "react";
import type { DefLite, VergleichDaten, VergleichQuelle } from "@/lib/financeads/typen";
import { useVergleichZustand } from "@/lib/financeads/useVergleichZustand";
import { formatKennwert, formatStand } from "@/lib/financeads/format";
import { achsenEnden, eingabenSatz, hauptspalte, nebenspalten } from "@/lib/financeads/kursblatt";
import { kennzahlenBauen } from "@/lib/financeads/kennzahlen";
import { useLauf } from "@/lib/kursblatt/useLauf";
import Streuband from "@/components/kursblatt/teile/Streuband";
import Kennzahlen from "@/components/kursblatt/teile/Kennzahlen";
import Podest from "@/components/kursblatt/teile/Podest";
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
  const [hover, setHover] = useState<number | null>(null);
  // K:139 — der Merkzettel fasst drei; der vierte verdrängt den ältesten.
  const [gemerkt, setGemerkt] = useState<number[]>([]);
  const merken = (id: number) =>
    setGemerkt((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id].slice(-3)));
  // K:470-472 — bei jeder Änderung an Eingaben, Filtern oder Sortierung laufen die
  // Reveals neu; dafür wechselt der Name der Keyframes.
  const lauf = useLauf(JSON.stringify([z.params, z.filter, z.sortKey]));

  // K:60 — die Zahlen im Vorspann leben: sie zeigen, was gerade eingestellt ist.
  const best = z.aktuelle.produkte.find((p) => p.id === z.aktuelle.bestwert) ?? z.aktuelle.produkte[0];
  const bestWert = haupt && best ? formatKennwert(haupt, best.kennzahlen[haupt.key]) : "";
  const achsen = achsenEnden(haupt);
  // Nicht z.mittel: dort stehen die Spalten in Datenreihenfolge. Im Satz kommt zuerst,
  // worauf es ankommt — und ohne die Spalten, die schon in den Details stecken.
  const neben = useMemo(() => nebenspalten(def, haupt), [def, haupt]);
  const kennzahlen = useMemo(
    () => kennzahlenBauen(def, haupt, z.zeilen, best, z.params),
    [def, haupt, z.zeilen, best, z.params],
  );

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

      {haupt && z.zeilen.length > 1 && (
        <section className="kb-markt">
          <span className="kb__kicker">Marktüberblick</span>
          <h2 className="kb__h3">
            {/* Bewusst „die Angebote" statt einer Kategoriewendung: „die Zinsen" (K:90)
                liest sich beim Kredit gut, aber nicht bei Konten oder Versicherungen. Was
                gestreut wird, sagt der Kicker über dem Band. */}
            Wie weit liegen die Angebote auseinander? Alle {z.zeilen.length} {def.mehrzahl}
            {eingabenSatz(def, quelle.fest, z.params) ? ` für ${eingabenSatz(def, quelle.fest, z.params)}` : ""}.
          </h2>
          <p className="kb__erklaer">
            Jeder Punkt ist ein Angebot – links {achsen[0]}, rechts {achsen[1]}. Der türkise
            Punkt ist der Bestwert, die gestrichelte Linie der Durchschnitt.
            <span className="kb-markt__tipp"> Punkt antippen, um das Angebot unten zu öffnen.</span>
          </p>
          <Streuband
            haupt={haupt}
            neben={neben[0]}
            zeilen={z.zeilen}
            best={best}
            hover={hover}
            onHover={setHover}
            /* Bis die Liste steht, hebt ein Tipp auf den Punkt das Angebot nur hervor;
               das Öffnen der Zeile kommt mit der Liste dazu. */
            onOeffnen={setHover}
            spalte={lauf.spalte}
            druck={lauf.druck}
          />
          <Kennzahlen werte={kennzahlen} />
        </section>
      )}

      {haupt && best && (
        <Podest
          haupt={haupt}
          neben={neben}
          zeilen={z.zeilen}
          best={best}
          kursblatt={def.kursblatt}
          params={z.params}
          gemerkt={gemerkt}
          onMerken={merken}
          mitte={lauf.mitte}
          spalte={lauf.spalte}
          stempel={lauf.stempel}
          herz={lauf.herz}
        />
      )}

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
