"use client";

/**
 * Snake — der Klassiker vom Tastenhandy, im Zeitungssatz.
 *
 * Aus Design A v2 (Kapitel 7, „Die Spielseite"): Raster 22 × 13 auf Punktpapier mit
 * Innenrand, die Schlange in Dreierbändern aus zwei Grüntönen mit diagonalem Muster,
 * der Kopf mit zwei Augen, der Schwanz verjüngt. Gesammelt werden grüne Funken.
 *
 * Drei Entscheidungen weichen bewusst vom Prototyp ab:
 *
 *  1. **DOM statt `<canvas>`.** `saeubern()` wirft `canvas` aus eingefrorenen Kapiteln
 *     (lib/faden/schnappschuss.ts) — ein Canvas-Snake wäre nach dem Einfrieren weg. Die
 *     Zellen sind reine Prozentwerte, das Brett skaliert über `aspect-ratio`.
 *  2. **Kein Tastendienst am Dokument.** Es gibt schon zwei davon (FadenShell für Escape,
 *     FadenProvider für Klicks); der Prototyp braucht einen globalen Handler nur, weil er
 *     einen einzigen hat. Hier hören die Tasten nur auf dem fokussierten Brett, und
 *     `preventDefault` gilt nur, solange gespielt wird — sonst wäre die Leertaste zum
 *     Scrollen weg, sobald der Blick zufällig auf dem Brett liegt.
 *  3. **Punkte nur bei echtem Tageszuwachs.** `belohne()` führt auch die Tagesserie fort
 *     (FadenProvider); ein beliebig oft spielbares Spiel würde Punktestand und Serie sonst
 *     aufblähen. Gutgeschrieben wird die Differenz zum besten Lauf des Tages.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useFaden } from "@/components/faden/FadenProvider";

const SPALTEN = 22;
const ZEILEN = 13;
const TAKT = 150;
const TAKT_MIN = 80;
/** Um so viel wird der Takt je gesammelter Münze schneller. */
const TAKT_SCHRITT = 4;
const SPEICHER = "faden-snake";

type Feld = [number, number];
type Richtung = [number, number];

interface Stand { tag: string; bestHeute: number; rekord: number }
interface Spielstand { segmente: Feld[]; futter: Feld; punkte: number; vorbei: boolean }

const ANFANG: Spielstand = { segmente: [[6, 6], [5, 6], [4, 6]], futter: [14, 6], punkte: 0, vorbei: false };

const TASTEN: Record<string, Richtung> = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
  W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0],
};

function heute(): string { return new Date().toISOString().slice(0, 10); }

/** „1 Münze“, „7 Münzen“ — eine Zeitung schreibt keinen Singular mit Plural-Endung. */
function muenzen(n: number): string { return `${n} ${n === 1 ? "Münze" : "Münzen"}`; }

function standLesen(): Stand {
  const leer: Stand = { tag: heute(), bestHeute: 0, rekord: 0 };
  try {
    const roh = JSON.parse(localStorage.getItem(SPEICHER) || "null") as Stand | null;
    if (!roh || typeof roh.rekord !== "number") return leer;
    // Der Tagesbestwert gilt nur heute; der Rekord bleibt.
    return { tag: heute(), bestHeute: roh.tag === heute() ? roh.bestHeute || 0 : 0, rekord: roh.rekord };
  } catch { return leer; }
}

export default function Snake() {
  const { belohne, toast } = useFaden();
  const brett = useRef<HTMLDivElement>(null);
  const takt = useRef<ReturnType<typeof setInterval> | null>(null);
  /**
   * 🚨 Die Richtung liegt in einem Ref, nicht nur im State. Zwischen zwei Ticks kann der
   * Spieler zweimal drücken; läse der Tick aus dem State, wäre die erste Wende noch nicht
   * angekommen und die zweite könnte die Schlange in sich selbst drehen.
   */
  const richtung = useRef<Richtung>([1, 0]);

  const [spiel, setSpiel] = useState<Spielstand>(ANFANG);
  const [laeuft, setLaeuft] = useState(false);
  const [pause, setPause] = useState(false);
  const [stand, setStand] = useState<Stand>({ tag: heute(), bestHeute: 0, rekord: 0 });
  const { segmente, futter, punkte, vorbei: aus } = spiel;
  /** Spiegel des Spielstands, damit ein Zug ihn LESEN kann, ohne im Updater zu rechnen. */
  const spielRef = useRef(spiel);
  spielRef.current = spiel;

  useEffect(() => { setStand(standLesen()); }, []);

  const speichern = useCallback((neu: Stand) => {
    setStand(neu);
    try { localStorage.setItem(SPEICHER, JSON.stringify(neu)); } catch { /* ohne Speicher spielt es sich auch */ }
  }, []);

  const anhalten = useCallback(() => {
    if (takt.current) { clearInterval(takt.current); takt.current = null; }
  }, []);

  /**
   * Ein Zug — gerechnet aus dem Spiegel, nicht im State-Updater.
   *
   * 🚨 React ruft Updater-Funktionen im Strict Mode zweimal auf. Stünde das `Math.random()`
   * fürs neue Futter darin, liefe es zweimal mit verschiedenen Ergebnissen; und ein
   * `setState` im Updater eines anderen `setState` ist ohnehin ein Nebeneffekt zur
   * Unzeit. Deshalb ist der Zug eine gewöhnliche Berechnung und setzt EINEN Zustand.
   */
  const zug = useCallback(() => {
    const alt = spielRef.current;
    if (alt.vorbei) return;
    const [dx, dy] = richtung.current;
    const [hx, hy] = alt.segmente[0];
    const kopf: Feld = [hx + dx, hy + dy];
    const wand = kopf[0] < 0 || kopf[0] >= SPALTEN || kopf[1] < 0 || kopf[1] >= ZEILEN;
    const selbst = alt.segmente.some(([x, y]) => x === kopf[0] && y === kopf[1]);
    if (wand || selbst) { setSpiel({ ...alt, vorbei: true }); return; }

    const isst = kopf[0] === alt.futter[0] && kopf[1] === alt.futter[1];
    // Wächst die Schlange, bleibt das letzte Segment liegen; sonst rückt alles nach.
    const segmente: Feld[] = [kopf, ...alt.segmente.slice(0, isst ? alt.segmente.length : -1)];
    let futter = alt.futter;
    if (isst) {
      // Neues Futter nur auf ein freies Feld — sonst läge es unter der Schlange.
      do { futter = [Math.floor(Math.random() * SPALTEN), Math.floor(Math.random() * ZEILEN)]; }
      while (segmente.some(([x, y]) => x === futter[0] && y === futter[1]));
    }
    setSpiel({ segmente, futter, punkte: alt.punkte + (isst ? 1 : 0), vorbei: false });
  }, []);

  // Aus dem Zug heraus wird nur der Spielstand gesetzt; das Anhalten gehört hierher.
  useEffect(() => {
    if (!aus) return;
    anhalten();
    setLaeuft(false);
  }, [aus, anhalten]);

  /** Takt nachziehen: mit jeder Münze wird es schneller, bis zur Untergrenze. */
  useEffect(() => {
    if (!laeuft || pause) return;
    const ms = Math.max(TAKT_MIN, TAKT - punkte * TAKT_SCHRITT);
    takt.current = setInterval(zug, ms);
    return () => { if (takt.current) { clearInterval(takt.current); takt.current = null; } };
  }, [laeuft, pause, punkte, zug]);

  // 🚨 Beim Aushängen den Takt abräumen — sonst tickt das Spiel im zugeklappten Kapitel weiter.
  useEffect(() => anhalten, [anhalten]);

  /** Ende auswerten: Rekord fortschreiben, Punkte nur für den Zuwachs des Tages. */
  useEffect(() => {
    if (!aus) return;
    const zuwachs = Math.max(0, punkte - stand.bestHeute);
    speichern({ tag: heute(), bestHeute: Math.max(stand.bestHeute, punkte), rekord: Math.max(stand.rekord, punkte) });
    // 🚨 Kein Wappen: die zwölf Wappen stehen für Themen des Sammelalbums
    // (lib/faden/wappen.ts). Ein unbekannter Schlüssel legte einen Geistereintrag an.
    if (zuwachs > 0) belohne(zuwachs, brett.current?.closest<HTMLElement>(".kasten") ?? null);
    else if (punkte > 0) toast(`${muenzen(punkte)} — heute lagen Sie schon bei ${stand.bestHeute}.`);
    // Absichtlich nur an `aus` gehängt: die Auswertung gehört genau einmal ans Spielende.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aus]);

  const starten = () => {
    anhalten();
    richtung.current = [1, 0];
    setSpiel(ANFANG);
    setPause(false);
    setLaeuft(true);
    brett.current?.focus();
  };

  const lenken = (d: Richtung) => {
    const [cx, cy] = richtung.current;
    if (cx === -d[0] && cy === -d[1]) return; // keine Wende auf der Stelle
    richtung.current = d;
  };

  const pausieren = () => { if (laeuft) setPause((p) => !p); };

  const taste = (ev: React.KeyboardEvent<HTMLDivElement>) => {
    const d = TASTEN[ev.key];
    if (d) { ev.preventDefault(); ev.stopPropagation(); lenken(d); return; }
    // 🚨 `preventDefault` nur, solange gespielt wird — sonst nähme das Brett dem Leser
    // die Leertaste zum Blättern weg, bloß weil der Fokus zufällig darauf liegt.
    if (ev.key === " " && laeuft) { ev.preventDefault(); ev.stopPropagation(); pausieren(); return; }
    if (ev.key === "Enter" && !laeuft) { ev.stopPropagation(); starten(); }
  };

  const bestenliste = [
    { name: "Nicole H.", wert: 31 },
    { name: "Sie", wert: stand.rekord },
    { name: "Jonas K.", wert: 9 },
  ].sort((a, b) => b.wert - a.wert);

  const titel = aus ? `Verschuldet — ${muenzen(punkte)}` : pause ? "Pause" : "Snake";
  const text = aus
    ? (punkte >= stand.rekord && punkte > 0
        ? "Neuer Rekord. Die Münzen wandern in Ihre Stempelkarte."
        : "Die Wand oder der eigene Schwanz — Leo empfiehlt eine Haftpflicht.")
    : pause ? "Leertaste oder „Weiter“ setzt fort."
    : "Sammeln Sie die grünen Funken. Die Schlange wird schneller.";

  return (
    <div className="snake">
      <div className="snake__kopfzeile">
        <span className="kicker">Snake · Münzen sammeln, Schulden meiden</span>
        <em>Pfeiltasten oder WASD · Leertaste pausiert</em>
      </div>

      <div className="snake__satz">
        <div>
          <div className="snake__stand">
            <span>Münzen <b className="ziffern">{punkte}</b></span>
            <span className="kicker">Rekord {stand.rekord}</span>
          </div>

          <div
            className="snake__brett"
            ref={brett}
            tabIndex={0}
            onKeyDown={taste}
            onClick={() => brett.current?.focus()}
            role="application"
            aria-label={`Snake, ${muenzen(punkte)} gesammelt`}
          >
            {segmente.map(([x, y], i) => {
              const kopf = i === 0;
              const schwanz = i === segmente.length - 1 && segmente.length > 3;
              // Python-Bänder: je drei Segmente ein Farbwechsel.
              const band = Math.floor(i / 3) % 2 === 0;
              return (
                <i
                  key={`${x}-${y}-${i}`}
                  className={"snake__glied" + (kopf ? " snake__glied--kopf" : schwanz ? " snake__glied--schwanz" : band ? " snake__glied--dunkel" : " snake__glied--hell")}
                  style={{ left: `${(x / SPALTEN) * 100}%`, top: `${(y / ZEILEN) * 100}%`, "--schraeg": i % 2 ? "45deg" : "-45deg" } as React.CSSProperties}
                  aria-hidden="true"
                ><i /></i>
              );
            })}

            <svg
              className="snake__futter"
              viewBox="0 0 12 12"
              style={{ left: `${(futter[0] / SPALTEN) * 100}%`, top: `${(futter[1] / ZEILEN) * 100}%` }}
              aria-hidden="true"
            >
              <path d="M12 6.00047C10.3384 5.64978 8.95721 5.04302 7.95709 4.04289C6.95697 3.04277 6.35021 1.66157 5.99953 0C5.64885 1.66157 5.04208 3.04277 4.04196 4.04289C3.04184 5.04302 1.66064 5.64978 -0.000930786 6.00047C1.66064 6.35115 3.04184 6.95791 4.04196 7.95804C5.04208 8.95816 5.64885 10.3394 5.99953 12.0009C6.35021 10.3394 6.95697 8.95816 7.95709 7.95804C8.95721 6.95791 10.3384 6.35115 12 6.00047Z" />
            </svg>

            <div className={"snake__blende" + (laeuft && !pause ? " weg" : "")}>
              <b>{titel}</b>
              <span>{text}</span>
              <button type="button" className="pille" onClick={pause ? pausieren : starten}>
                <span>{aus ? "Noch einmal" : pause ? "Weiter" : "Spiel starten"}</span>
                <i className="pille__knopf"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l12 8-12 8z" /></svg></i>
              </button>
            </div>
          </div>
        </div>

        <div className="snake__seite">
          <p>Der Klassiker vom Tastenhandy: Je mehr Sie sammeln, desto länger wird die
            Schlange — und desto schwerer, sich selbst aus dem Weg zu gehen.</p>

          <div className="snake__kreuz" role="group" aria-label="Steuerung">
            <span />
            <button type="button" onClick={() => lenken([0, -1])} aria-label="Nach oben"><i className="pfeil pfeil--hoch" /></button>
            <span />
            <button type="button" onClick={() => lenken([-1, 0])} aria-label="Nach links"><i className="pfeil pfeil--links" /></button>
            <button type="button" className="snake__pause" onClick={pausieren} aria-label={pause ? "Weiter" : "Pause"}>{pause ? "WEITER" : "PAUSE"}</button>
            <button type="button" onClick={() => lenken([1, 0])} aria-label="Nach rechts"><i className="pfeil pfeil--rechts" /></button>
            <span />
            <button type="button" onClick={() => lenken([0, 1])} aria-label="Nach unten"><i className="pfeil pfeil--runter" /></button>
            <span />
          </div>

          <div className="snake__liste">
            <span className="kicker">Bestenliste · diese Woche</span>
            {bestenliste.map((b, i) => (
              <span key={b.name} className={"snake__platz" + (b.name === "Sie" ? " snake__platz--sie" : "")}>
                <b>{String(i + 1).padStart(2, "0")}</b>
                <span>{b.name}</span>
                <i className="fuehrung" />
                <b className="ziffern">{b.wert}</b>
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="sr" aria-live="polite">{aus ? `Spiel vorbei mit ${muenzen(punkte)}.` : ""}</p>
    </div>
  );
}
