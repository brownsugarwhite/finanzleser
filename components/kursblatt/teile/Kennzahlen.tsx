"use client";

/**
 * Die drei Kennzahlen unter dem Marktüberblick, jede mit Zählwerk.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:107-112 und
 * „… Festgeld & Eingaben“:90-94, in der Fassung von Runde 2 (Punkt 4): eine
 * dreispaltige Zeitungstabelle, alle Zahlen gleich groß, unterschieden über die FARBE.
 * Vorher stand eine groß (bis 44 px) und zwei klein daneben — auf 1,6 fr Spaltenbreite
 * gequetscht, mit der Unterzeile im Umbruch.
 */
import { useZaehlwerkKb } from "@/lib/kursblatt/useZaehlwerkKb";
import { formatKennwert } from "@/lib/financeads/format";
import type { KennzahlWert } from "@/lib/financeads/kennzahlen";
import type { SpalteDef } from "@/lib/financeads/typen";

function Eine({ k }: { k: KennzahlWert }) {
  const laufend = useZaehlwerkKb(k.wert);
  const spalte = { key: k.key, label: k.label, art: k.art } as SpalteDef;
  return (
    <div className="kb-kennzahl" data-ton={k.ton}>
      <span className="kb-kennzahl__label">{k.label}</span>
      <div className="kb-kennzahl__zeile">
        <b className="kb-kennzahl__wert">
          {k.zeichen ? `${k.zeichen} ` : ""}
          {formatKennwert(spalte, laufend)}
        </b>
        {k.unter && <span className="kb-kennzahl__unter">{k.unter}</span>}
      </div>
    </div>
  );
}

export default function Kennzahlen({ werte }: { werte: KennzahlWert[] }) {
  if (!werte.length) return null;
  return (
    <div className="kb-kennzahlen">
      {werte.map((k) => <Eine key={k.key} k={k} />)}
    </div>
  );
}
