"use client";

/**
 * Der eigene Vergleichsrechner — eine Komponente, zwei Skins.
 *
 * Wird SSR-gerendert: die Voreinstellung steht im HTML, ohne JavaScript, für Leser und
 * Suchmaschinen. Danach hydratisiert er mit demselben Zustand (kein Sprung) und liest erst
 * im Effekt den Hash (`#vgl:average_balance=20000`), der eine geteilte Einstellung trägt —
 * Hash statt Query, damit die ISR-Seite nie auf die Function fällt.
 *
 * Der Zustand selbst (Parameter, Nachladen, Sortieren, Filtern, Sichtkontakt) liegt seit
 * dem Kursblatt in `lib/financeads/useVergleichZustand.ts` — dieselbe Mechanik trägt dort
 * auch den Zeitungssatz. Hier bleibt nur die Darstellung.
 *
 * `skin`: "faden" (Zeitungssatz nach Handoff Z. 759–788, app/faden-vergleich.css) oder
 * "alt" (Live-Seite, app/vergleich.css). Gleiches Markup, zwei Stylesheets.
 */
import { useMemo } from "react";
import type { DefLite, KennWert, VergleichDaten, VergleichQuelle } from "@/lib/financeads/typen";
import { useVergleichZustand } from "@/lib/financeads/useVergleichZustand";
import { formatKennwert, formatStand } from "@/lib/financeads/format";
import Wertetabelle from "@/components/statistik/formen/Wertetabelle";
import Parameterzeile from "./Parameterzeile";
import Tarifliste from "./Tarifliste";
import Anbieterliste from "./Anbieterliste";
import VergleichSaeulen from "./VergleichSaeulen";

export interface VergleichRechnerProps {
  slug: string;
  def: DefLite;
  quelle: VergleichQuelle;
  daten: VergleichDaten;
  skin: "faden" | "alt";
  /** Säulen-Statistik über der Liste (nur Faden, nur Klasse A). */
  mitSaeulen?: boolean;
}

export default function VergleichRechner({ slug, def, quelle, daten, skin, mitSaeulen }: VergleichRechnerProps) {
  const z = useVergleichZustand({ slug, def, quelle, daten });

  // Die alte Liste kennt genau einen Umschalter. Seit das Kursblatt mehrere Chips zeigt,
  // ist `def.filter` eine Liste — hier gilt der erste, damit sich an dieser Seite nichts
  // ändert. `chips` statt `def.filter`, damit auch hier kein Schalter erscheint, dessen
  // Kennzahl der Schnappschuss noch gar nicht kennt.
  const schalter = z.chips[0];
  const filterAn = schalter ? Boolean(z.filter[schalter.key]) : false;

  const wertetabelle = useMemo(() => ({
    reihen: def.klasse === "A" ? def.spalten.map((s) => s.label) : ["Tarif"],
    // Name = Anbieter · Tarif: eindeutig je Zeile (React-Key) und im Textauszug lesbar.
    zeilen: z.aktuelle.produkte.map((p) => ({
      name: `${p.anbieter} · ${p.tarif}`,
      werte: def.klasse === "A" ? def.spalten.map((s) => formatKennwert(s, p.kennzahlen[s.key])) : [p.tarif],
    })),
  }), [z.aktuelle.produkte, def.spalten, def.klasse]);

  const grund = z.aktuelle.bestwertGrund;

  return (
    <div className={`vgl vgl--${skin} vgl--klasse-${def.klasse.toLowerCase()}`} ref={z.wurzel} data-vergleich={slug}>
      <Parameterzeile def={def} quelle={quelle} params={z.params} onChange={z.setParam} laedt={z.laedt} />
      {z.fehler && <p className="vgl__fehler" role="alert">{z.fehler} Gezeigt wird die Voreinstellung.</p>}

      {mitSaeulen && skin === "faden" && def.klasse === "A" && z.haupt && (
        <VergleichSaeulen
          zeilen={z.zeilen}
          spalte={z.sortSpalte || z.haupt}
          maximum={z.maximum}
          titel={`${z.sortSpalte?.label || z.haupt.label} · die ersten ${Math.min(8, z.zeilen.length)} ${def.mehrzahl}`}
        />
      )}

      {(schalter || (def.klasse === "A" && def.sortierung.length > 1)) && (
        <div className="vgl__filterzeile">
          {schalter && (
            <button type="button" className="vgl__schalter" role="switch" aria-checked={filterAn} onClick={() => z.schalte(schalter.key)}>
              <span className="vgl__schalter-knopf" aria-hidden="true"><i /></span>
              <span>{schalter.label}</span>
            </button>
          )}
          {def.klasse === "A" && def.sortierung.length > 1 && (
            <div className="vgl__sortieren" role="tablist" aria-label="Sortieren">
              <span className="vgl__sortieren-label">Sortieren:</span>
              {def.sortierung.map((s) => (
                <button key={s.key} type="button" role="tab" aria-selected={z.sortKey === s.key} className={"vgl__tab" + (z.sortKey === s.key ? " vgl__tab--aktiv" : "")} onClick={() => z.setSortKey(s.key)}>{s.label}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {def.klasse === "A" && z.haupt
        ? <Tarifliste def={def} zeilen={z.zeilen} haupt={z.haupt} mittel={z.mittel} best={z.aktuelle.bestwert} maximum={z.maximum} gezeigt={z.gezeigt} />
        : <Anbieterliste zeilen={z.zeilen} gezeigt={z.gezeigt} />}

      {z.zeilen.length === 0 && <p className="vgl__leer">Mit dieser Einstellung bleibt kein Angebot übrig.</p>}

      {z.zeilen.length > z.gezeigt && (
        <button type="button" className="vgl__mehr" onClick={z.zeigeAlle}>Alle {z.zeilen.length} {def.mehrzahl} zeigen</button>
      )}

      {(quelle.hinweis || def.hinweis) && <p className="vgl__hinweis">{quelle.hinweis || def.hinweis}</p>}

      <Wertetabelle titel={`${def.titel}: alle ${z.aktuelle.produkte.length} ${def.mehrzahl}`} spalte={def.einzahl} reihen={wertetabelle.reihen} zeilen={wertetabelle.zeilen} />

      <div className="vgl__fuss">
        <span className="vgl__meta">
          {z.zeilen.length === z.aktuelle.produkte.length ? `${z.aktuelle.produkte.length} ${def.mehrzahl}` : `${z.zeilen.length} von ${z.aktuelle.produkte.length} ${def.mehrzahl}`}
          {" · Stand "}{formatStand(daten.stand)}
          {grund ? ` · Bestwert: ${grund}` : ""}
        </span>
        <span className="vgl__quelle">Daten: financeads · Anzeige, Partnerlinks</span>
      </div>
    </div>
  );
}

export type { KennWert };
