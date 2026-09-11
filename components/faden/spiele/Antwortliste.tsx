"use client";

/**
 * Die Antwortzeile aus Design A v2 (Handoff 1093–1095) — Quiz und „Mythos oder Fakt"
 * teilen sie sich.
 *
 * Zeichen links (22 px Spalte), Text rechts, Haarlinie oben, beim Überfahren rückt die
 * Zeile 8 px ein. Nach der Wahl wächst unter der richtigen Zeile ein 2 px starker Balken
 * in Grün auf; hat man danebengetippt, wächst er unter der eigenen Wahl in Magenta.
 *
 * 🚨 Kein Sägezahn-Ticket, keine Höhen-Morph-Animation. Beides war Beiwerk des alten
 * Kastens; im Zeitungssatz gibt es keinen Kasten, der morphen könnte.
 */
export interface Antwort {
  /** „A", „B", „M", „F" … */
  zeichen: string;
  text: string;
  richtig: boolean;
}

export default function Antwortliste({
  antworten,
  gewaehlt,
  onWahl,
}: {
  antworten: Antwort[];
  gewaehlt: number | null;
  onWahl: (i: number) => void;
}) {
  const offen = gewaehlt === null;
  return (
    <div className="spiel-antworten">
      {antworten.map((a, i) => {
        // Nach der Wahl ist die richtige Zeile immer markiert — auch wenn man sie nicht
        // getroffen hat. Wer danebenlag, sieht zusätzlich seine eigene Wahl in Magenta.
        const zustand = offen ? "" : a.richtig ? " spiel-antwort--richtig" : i === gewaehlt ? " spiel-antwort--falsch" : "";
        return (
          <button
            key={i}
            type="button"
            className={"spiel-antwort" + zustand}
            disabled={!offen}
            aria-pressed={i === gewaehlt}
            onClick={() => offen && onWahl(i)}
          >
            <span className="spiel-antwort__zeichen">{a.zeichen}</span>
            <span className="spiel-antwort__text">{a.text}</span>
            <i className="spiel-antwort__balken" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
