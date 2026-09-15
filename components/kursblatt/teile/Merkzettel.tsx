"use client";

/**
 * Der Merkzettel — bis zu drei gemerkte Angebote, fest unten rechts.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:215-231. Weißes Blatt
 * auf dem Papier, leicht schief, mit grünem Knoten am Rand; es fliegt von rechts ein.
 *
 * 🚨 Er hängt per Portal am `<body>`, nicht im Strom. Zwei Gründe, beide gemessen:
 * ein Vorfahr mit `transform` (die Kapitel-Animationen des Fadens) macht `position: fixed`
 * relativ zu sich selbst, und im eingefrorenen Schnappschuss eines Kapitels bliebe sonst
 * ein toter Zettel liegen.
 *
 * 🚨 Er sitzt ÜBER Leos Eingabe. Die ist im Faden ebenfalls fest am unteren Rand
 * (`--eingabe-h`, faden.css:206) — ohne den Abstand läge der Zettel darauf.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { SpalteDef, VergleichProdukt } from "@/lib/financeads/typen";
import { formatKennwert } from "@/lib/financeads/format";

export interface MerkzettelProps {
  /** Die gemerkten Angebote, in der Reihenfolge, in der sie gemerkt wurden. */
  eintraege: VergleichProdukt[];
  haupt: SpalteDef;
  total?: SpalteDef;
  bestId?: number;
  onEntfernen: (id: number) => void;
  onLeeren: () => void;
  /** Höchstzahl — der Handoff sagt drei (K:218). */
  fasst?: number;
}

export default function Merkzettel({ eintraege, haupt, total, bestId, onEntfernen, onLeeren, fasst = 3 }: MerkzettelProps) {
  const [bereit, setBereit] = useState(false);
  useEffect(() => setBereit(true), []);
  if (!bereit || !eintraege.length) return null;

  const frei = fasst - eintraege.length;

  return createPortal(
    <aside className="kb-zettel" data-anzahl={eintraege.length} aria-label="Merkzettel">
      <i className="kb-zettel__knoten" aria-hidden="true" />
      <div className="kb-zettel__kopf">
        <span className="kb__kicker">Merkzettel · {eintraege.length} von {fasst}</span>
        <button type="button" className="kb-zettel__leeren" onClick={onLeeren}>Leeren</button>
      </div>

      <div className="kb-zettel__raster" style={{ gridTemplateColumns: `repeat(${eintraege.length}, 1fr)` }}>
        {eintraege.map((p) => {
          const ist = p.id === bestId;
          return (
            <div key={p.id} className="kb-zettel__karte" data-ist={ist ? "an" : "aus"}>
              <button type="button" className="kb-zettel__weg" aria-label={`${p.anbieter} entfernen`} onClick={() => onEntfernen(p.id)}>×</button>
              <b>{p.anbieter}</b>
              <span className="kb-zettel__wert">{formatKennwert(haupt, p.kennzahlen[haupt.key])}</span>
              {total && <span className="kb-zettel__zeile">{formatKennwert(total, p.kennzahlen[total.key])}</span>}
              <span className="kb-zettel__klein">{p.tarif}</span>
            </div>
          );
        })}
      </div>

      <span className="kb-zettel__fuss">
        {frei > 0
          ? `Noch ${frei} ${frei === 1 ? "Platz" : "Plätze"} – „Merken“ bei weiteren Angeboten`
          : `${fasst} Angebote nebeneinander – der Zettel bleibt beim Scrollen`}
      </span>
    </aside>,
    document.body,
  );
}
