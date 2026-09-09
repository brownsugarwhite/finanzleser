"use client";

/**
 * Leseserie: sieben Tageskreise, die gefüllten sind die Tage der laufenden Serie,
 * der heutige pulst. Aus Design A v2, Screen 4 (Randspalte links).
 *
 * Die Serie selbst führt der FadenProvider (`serie`, fortgeschrieben in `belohne`) —
 * hier wird sie nur gezeigt. Sieben Kreise, weil eine Woche der Zeitraum ist, den man
 * überblickt; darüber hinaus zählt nur noch die Zahl.
 */
import { useFaden } from "./FadenProvider";

const TAGE = ["M", "D", "M", "D", "F", "S", "S"];

export default function Leseserie() {
  const { serie } = useFaden();
  // Montag = 0. `getDay()` zählt ab Sonntag, deshalb der Versatz.
  const heute = (new Date().getDay() + 6) % 7;
  // Die Serie zählt rückwärts vom heutigen Tag — mehr als sieben passen nicht ins Bild.
  const gefuellt = Math.min(serie, 7);

  return (
    <div className="block leseserie">
      <span className="kicker">Leseserie{serie > 0 ? ` · ${serie} ${serie === 1 ? "Tag" : "Tage"}` : ""}</span>
      <div className="leseserie__reihe">
        {TAGE.map((t, i) => {
          // Von heute aus rückwärts füllen, damit die Kette am heutigen Tag endet.
          const abstand = (heute - i + 7) % 7;
          const an = abstand < gefuellt;
          return (
            <i
              key={i}
              className={"leseserie__tag" + (an ? " an" : "") + (i === heute ? " heute" : "")}
              aria-hidden="true"
            >{t}</i>
          );
        })}
      </div>
      <p className="rand__hinweis">
        {serie > 0 ? "Jeden Tag ein Kapitel hält die Kette." : "Lesen Sie ein Kapitel, dann beginnt die Kette."}
      </p>
    </div>
  );
}
