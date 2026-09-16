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
import { useEffect, useMemo, useState } from "react";
import type { DefLite, VergleichDaten, VergleichQuelle } from "@/lib/financeads/typen";
import { useVergleichZustand } from "@/lib/financeads/useVergleichZustand";
import { formatKennwert, formatStand } from "@/lib/financeads/format";
import { achsenEnden, eingabenSatz, hauptspalte, kennwertSpalte, laufzeitParam, nebenspalten, podestSpalten } from "@/lib/financeads/kursblatt";
import { kennzahlenBauen } from "@/lib/financeads/kennzahlen";
import { useLauf } from "@/lib/kursblatt/useLauf";
import { fmtProzent } from "@/lib/kursblatt/zahl";
import Streuband from "@/components/kursblatt/teile/Streuband";
import Zinskurve from "@/components/kursblatt/teile/Zinskurve";
import Kennzahlen from "@/components/kursblatt/teile/Kennzahlen";
import Podest from "@/components/kursblatt/teile/Podest";
import AlleAngebote from "./AlleAngebote";
import Anbieterliste from "./Anbieterliste";
import Merkzettel from "@/components/kursblatt/teile/Merkzettel";
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
  const z = useVergleichZustand({ slug, def, quelle, daten, ohne: def.kursblatt?.ohne });
  const haupt = hauptspalte(def);
  const [hover, setHover] = useState<number | null>(null);
  const [offen, setOffen] = useState<number | null>(null);
  // K:139 — der Merkzettel fasst drei; der vierte verdrängt den ältesten.
  // Er überlebt einen Seitenwechsel innerhalb der Sitzung, aber nicht mehr: gemerkt ist
  // eine Notiz für jetzt, kein Konto. Erst im Effekt lesen, sonst weicht der erste
  // Client-Render vom gelieferten HTML ab.
  const [gemerkt, setGemerkt] = useState<number[]>([]);
  const schluessel = `kb-merk-${slug}`;
  useEffect(() => {
    try {
      const roh = sessionStorage.getItem(schluessel);
      if (roh) setGemerkt(JSON.parse(roh) as number[]);
    } catch { /* ohne Sitzungsspeicher merkt der Zettel eben nur bis zum Seitenwechsel */ }
  }, [schluessel]);
  const merken = (id: number) =>
    setGemerkt((g) => {
      const neu = g.includes(id) ? g.filter((x) => x !== id) : [...g, id].slice(-3);
      try { sessionStorage.setItem(schluessel, JSON.stringify(neu)); } catch { /* egal */ }
      return neu;
    });
  const leeren = () => {
    setGemerkt([]);
    try { sessionStorage.removeItem(schluessel); } catch { /* egal */ }
  };
  // K:470-472 — bei jeder Änderung an Eingaben, Filtern oder Sortierung laufen die
  // Reveals neu; dafür wechselt der Name der Keyframes.
  const lauf = useLauf(JSON.stringify([z.params, z.filter, z.auswahl, z.sortKey]));

  // Die Zahl, die das Produkt kennzeichnet — beim Kredit der Bestwert selbst, beim
  // Festgeld der Zins. Sie steht groß im Gewinnerblock und trägt die Zinskurve.
  const kennwert = useMemo(() => kennwertSpalte(def), [def]);

  // K:60 — die Zahlen im Vorspann leben: sie zeigen, was gerade eingestellt ist.
  const best = z.aktuelle.produkte.find((p) => p.id === z.aktuelle.bestwert) ?? z.aktuelle.produkte[0];
  const bestWert = kennwert && best ? formatKennwert(kennwert, best.kennzahlen[kennwert.key]) : "";
  const achsen = achsenEnden(haupt);
  const anbieterZahl = useMemo(() => new Set(z.aktuelle.produkte.map((p) => p.anbieter)).size, [z.aktuelle.produkte]);
  // Nicht z.mittel: dort stehen die Spalten in Datenreihenfolge. Im Satz kommt zuerst,
  // worauf es ankommt — und ohne die Spalten, die schon in den Details stecken.
  const neben = useMemo(() => nebenspalten(def, haupt), [def, haupt]);
  const kennzahlen = useMemo(
    () => kennzahlenBauen(def, haupt, z.zeilen, best, z.params),
    [def, haupt, z.zeilen, best, z.params],
  );

  const dritte = useMemo(
    () => (def.kursblatt?.dritteSpalte ? def.spalten.find((s) => s.key === def.kursblatt!.dritteSpalte!.key) : undefined),
    [def.spalten, def.kursblatt],
  );
  // Die Punktführung des Gewinners darf auch aus dem Detailfach schöpfen (Endbetrag,
  // Zinszahlung); was groß dasteht oder eine eigene Listenspalte hat, fällt heraus.
  const zeilenSpalten = useMemo(() => podestSpalten(def, [kennwert, dritte]), [def, kennwert, dritte]);
  const dauer = useMemo(() => laufzeitParam(def), [def]);
  // Fertig geliefert: die Kurve braucht alle Laufzeit-Varianten, und ins HTML reist nur
  // die Voreinstellung. Gerechnet wird sie deshalb im Server (VergleichKoerper.tsx).
  const kurve = daten.kurve ?? null;
  // 🚨 Die Kurve liegt beim Basisbetrag des Schnappschusses (siehe `zinskurve`). Weicht
  // der Leser davon ab, muss das dastehen — sonst liest man eine Kurve, die für die
  // eigenen Zahlen gar nicht gilt.
  const kurveAbweichung = useMemo(() => {
    if (!kurve || !dauer) return null;
    const anders = def.params.filter(
      (p) => p.key !== dauer.key && kurve.basis[p.key] !== undefined && String(z.params[p.key] ?? "") !== kurve.basis[p.key],
    );
    if (!anders.length) return null;
    return anders
      .map((p) => `${Number(kurve.basis[p.key]).toLocaleString("de-DE")}${p.einheit ? " " + p.einheit : ""}`)
      .join(" · ");
  }, [kurve, dauer, def.params, z.params]);

  // Beizeile der Register: „bis 3,55 %“ je Laufzeit, „12 Angebote“ je Sicherungsstufe.
  const meta = (key: string, wert: string): string | undefined => {
    if (dauer && key === dauer.key && kurve && kennwert) {
      const punkt = kurve.punkte.find((x) => x.wert === wert);
      // Zwei Nachkommastellen wie auf der Kurve (F:236) — „bis 3 %" neben „bis 3,45 %"
      // sähe nach zwei verschiedenen Genauigkeiten aus.
      return punkt
        ? `bis ${kennwert.art === "prozent" ? fmtProzent(punkt.best) : formatKennwert({ ...kennwert, ab: false }, punkt.best)}`
        : undefined;
    }
    const n = z.auswahlTreffer[key]?.[wert];
    return n === undefined ? undefined : `${n} ${def.mehrzahl}`;
  };

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
        <b>{z.aktuelle.produkte.length - z.ausgeschlossen} {def.mehrzahl}</b>
        {/* Ohne Bestwert (Klasse B) steht hier die einzige Zahl, die diese Daten hergeben:
            von wie vielen Häusern die Tarife stammen. */}
        {!haupt && anbieterZahl > 1 ? <> von <b>{anbieterZahl} {def.gruppe === "versicherung" ? "Versicherern" : "Anbietern"}</b></> : null}
        {" "}im Vergleich
        {/* Die Bezeichnung kommt aus der Hauptspalte, nicht aus `totalLabel`: bei Krediten
            ist der Bestwert der Effektivzins, `totalLabel` aber „Rate / Monat“. */}
        {bestWert && bestWert !== "–" ? <>, Bestwert <b>{bestWert}</b> {kennwert?.kurz ?? kennwert?.label}</> : null}
        , Stand {formatStand(daten.stand)}.{beschreibung ? ` ${beschreibung}` : ""}
      </p>

      <IhreAngaben
        def={def} quelle={quelle} params={z.params} onParam={z.setParam} meta={meta}
        register={z.register} auswahl={z.auswahl} onAuswahl={z.setAuswahl}
      />

      {z.fehler && <p className="kb__fehler" role="alert">{z.fehler} Gezeigt wird die Voreinstellung.</p>}

      {haupt && z.zeilen.length > 1 && (
        <section className="kb-markt">
          <span className="kb__kicker">Marktüberblick</span>
          {kurve && dauer && kennwert ? (
            <>
              {/* F:71-72 — bei einer Laufzeitachse fragt die Überschrift nach der Bindung,
                  nicht nach der Streuung. */}
              <h2 className="kb__h3">Lohnt sich länger binden? Der beste {kennwert.kurz ?? kennwert.label} je {dauer.label}.</h2>
              <p className="kb__erklaer">
                Die türkise Linie zeigt den jeweils besten {kennwert.kurz ?? kennwert.label}, die
                graue den Durchschnitt aller {def.mehrzahl}. Ihre {dauer.label} ist markiert –
                einen anderen Punkt antippen, um zu wechseln.
              </p>
              <Zinskurve
                punkte={kurve.punkte}
                spalte={kennwert}
                wert={String(z.params[dauer.key] ?? dauer.standard)}
                onWert={(v) => z.setParam(dauer.key, v)}
                zeichnen={lauf.zeichnen}
              />
              {kurveAbweichung && (
                <span className="kb-zinskurve__fuss">
                  {kennwert.kurz ?? kennwert.label} je {dauer.label} für {kurveAbweichung}. Ihr
                  Betrag ändert den Ertrag, nicht den Zinssatz.
                </span>
              )}
            </>
          ) : (
            <>
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
                /* K:476 — ein Tipp auf den Punkt öffnet die Zeile unten in der Liste. */
                onOeffnen={(id) => { setHover(id); setOffen(id); }}
                spalte={lauf.spalte}
                druck={lauf.druck}
              />
            </>
          )}
          <Kennzahlen werte={kennzahlen} />
        </section>
      )}

      {haupt && best && (
        <Podest
          haupt={haupt}
          gross={kennwert}
          zeilenSpalten={zeilenSpalten}
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

      {haupt ? (
        <AlleAngebote
          def={def} z={z} haupt={haupt} total={neben[0]} best={best}
          hover={hover} onHover={setHover}
          offen={offen} onOeffnen={setOffen}
          gemerkt={gemerkt} onMerken={merken}
          stempel={lauf.stempel} herz={lauf.herz} tempo={1}
        />
      ) : (
        /* Klasse B: keine Kennzahlen, also weder Band noch Podest noch Filterzeile —
           nur die Anbieterliste. Siehe den Kopf von Anbieterliste.tsx. */
        <Anbieterliste
          def={def} zeilen={z.zeilen} gezeigt={z.gezeigt} alle={z.alle} onAlle={z.zeigeAlle}
          gemerkt={gemerkt} onMerken={merken} herz={lauf.herz}
        />
      )}

      <Merkzettel
        eintraege={gemerkt.map((id) => z.aktuelle.produkte.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p)}
        haupt={haupt}
        total={haupt ? neben[0] : undefined}
        bestId={best?.id}
        onEntfernen={merken}
        onLeeren={leeren}
      />

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
