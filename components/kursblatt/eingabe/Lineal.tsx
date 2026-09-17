"use client";

/**
 * Lineal — der ziehbare Zollstock unter der festen Nadel.
 *
 * Vorlage: design_handoff_finanzleser_kursblatt/„FL Lineal.dc.html“ (Maße im Markup
 * :17-36, Mechanik in der Logikklasse :39-89). Eingesetzt für Beträge und Laufzeiten:
 * Kreditsumme 1.000–100.000 € (9 px/Schritt), Laufzeit 12–120 Monate (30 px),
 * Rechnersumme 500–200.000 € (7 px).
 *
 * 🚨 `major` und `mittel` sind Multiplikatoren von `schritt`, keine absoluten Werte
 * (FL Lineal:74): 20 × 500 € = 10.000 €, 2 × 6 Monate = 12 Monate.
 *
 * Zwei bewusste Abweichungen vom Prototyp, beide zugunsten von SSR und Gewicht:
 *
 * 1. **Kein ResizeObserver.** Der Prototyp setzt die Spur auf `left: 0` und rechnet
 *    `offset = Breite/2 − x(wert)` — dafür muss er messen, also erst im Browser. Dieselbe
 *    Geometrie ohne Messung: Spur auf `left: 50%`, dann `translateX(-x(wert))`. Damit
 *    steht der Wert schon im gelieferten HTML unter der Nadel, ohne Sprung nach der
 *    Hydration (FL Lineal:83).
 * 2. **Striche als Hintergrund statt als Knoten.** Der Prototyp rendert je Schritt ein
 *    `<i>` (FL Lineal:24-26). Bei 500–200.000 € in 500er-Schritten sind das 400 Knoten
 *    für ein einziges Feld. Drei `linear-gradient`-Kacheln — eine je Strichhöhe — zeichnen
 *    dieselbe Geometrie pixelgenau. Die Kachel ist genau eine Periode breit, sonst gäbe
 *    es an der Kachelgrenze eine Naht.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { aufSchritt, fmtDe, parseDe, schritte, vielfaches } from "@/lib/kursblatt/zahl";

export type Werkzeug = "tuerkis" | "magenta" | "gruen" | "ink";

export interface Marke {
  wert: number;
  label: string;
}

export interface LinealProps {
  wert: number;
  onWert: (v: number) => void;
  min: number;
  max: number;
  schritt: number;
  /** Bildpunkte je Schritt — bestimmt, wie weit man für einen Euro zieht. */
  px: number;
  /** Großer Strich mit Beschriftung alle `major × schritt`. */
  major: number;
  /** Mittlerer Strich alle `mittel × schritt`. 0 = keine. */
  mittel?: number;
  einheit?: string;
  dez?: number;
  marken?: Marke[];
  /** Eigene id für die Verknüpfung Regler ↔ Eingabefeld; sonst aus `ariaLabel` gebildet. */
  id?: string;
  werkzeug?: Werkzeug;
  /** Bedienhinweis unten rechts. Verschwindet nach der ersten Berührung. */
  hinweis?: boolean;
  ariaLabel: string;
}

const FARBE: Record<Werkzeug, string> = {
  tuerkis: "var(--tuerkis)",
  magenta: "var(--pink)",
  gruen: "var(--green)",
  ink: "var(--ink)",
};

export default function Lineal({
  wert, onWert, min, max, schritt, px, major, mittel = 0,
  einheit = "", dez = 0, marken = [], id, werkzeug = "tuerkis", hinweis = true, ariaLabel,
}: LinealProps) {
  const [ziehen, setZiehen] = useState(false);
  const [tick, setTick] = useState(0);
  const [hinweisAn, setHinweisAn] = useState(true);
  const [tippen, setTippen] = useState<string | null>(null);
  const wurzel = useRef<HTMLDivElement>(null);
  const start = useRef({ x: 0, wert: 0 });
  /**
   * 🚨 Bewusst KEIN useId(). Gemessen 15.09.2026: Server und Client vergaben im Faden
   * verschiedene Präfixe („_R_9jin…“ gegen „_R_16ea…“), und React verwarf die Hydration
   * mit „some attributes of the server rendered HTML didn't match“. Ein aus dem Label
   * gebildeter Name ist auf beiden Seiten derselbe — und lesbar dazu.
   */
  const eingabeId = id ?? "kb-lineal-" + ariaLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const setzen = useCallback(
    (roh: number) => {
      const neu = aufSchritt(roh, schritt, min, max, dez);
      if (neu !== wert) {
        onWert(neu);
        setTick((t) => t + 1);
      }
    },
    [dez, max, min, onWert, schritt, wert]
  );

  /**
   * 🚨 Das Mausrad braucht einen eigenen Zuhörer. React hängt `wheel` passiv an die
   * Wurzel — ein `preventDefault()` im `onWheel` bliebe wirkungslos und die Seite
   * scrollte beim Verstellen mit.
   */
  useEffect(() => {
    const el = wurzel.current;
    if (!el) return;
    const rad = (e: WheelEvent) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!d) return;
      e.preventDefault();
      setzen(wert + (d > 0 ? schritt : -schritt));
      setHinweisAn(false);
    };
    el.addEventListener("wheel", rad, { passive: false });
    return () => el.removeEventListener("wheel", rad);
  }, [schritt, setzen, wert]);

  const anzahl = schritte(min, max, schritt);
  const spurBreite = anzahl * px;
  const x = ((wert - min) / schritt) * px;

  /**
   * Die Skalenzahlen SIND die Marken (Handoff Runde 2, Punkt 2). Vorher gab es zwei
   * Reihen: oben angetippte Pins („3 Jahre“, „5 Jahre“) und unten die Zahlen der großen
   * Striche — dieselbe Information zweimal, auf 40 px Höhe verteilt.
   *
   * Jetzt eine Reihe unter der Skala: jede beschriftete Stelle ist ein Knopf, ein Klick
   * springt hin. Wo ein Name gegeben ist, gewinnt der Name über die Zahl.
   *
   * 🚨 Die großen Striche liegen auf RUNDEN Werten (`Math.ceil(min / grossAlle)`), nicht
   * auf Indexvielfachen — bei min 500 also auf 10.000, nicht auf 10.500.
   */
  const grossAlle = major * schritt;
  const erstesGross = Math.ceil(min / grossAlle) * grossAlle;
  const benannt = new Map(marken.filter((m) => m.wert >= min && m.wert <= max).map((m) => [m.wert, m.label]));
  const punkte = new Map<number, string>();
  // Gibt es benannte Stellen („5 Jahre“), tragen SIE die Reihe allein. Zahlen daneben
  // wären dieselbe Auskunft in schwächerer Form — und bei Schritt 6 auf 120 Monaten
  // stünden zehn Zahlen zwischen drei Namen.
  if (benannt.size === 0) for (let v = erstesGross; v <= max; v += grossAlle) punkte.set(v, fmtDe(v, dez));
  for (const [v, label] of benannt) punkte.set(v, label);
  const skala = [...punkte.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([v, text]) => {
      const sx = ((v - min) / schritt) * px;
      return {
        wert: v, x: sx, text,
        /* 🚨 „Benannt" heißt: da steht ein NAME statt einer Zahl („5 Jahre"). Eine Marke,
           deren Beschriftung die formatierte Zahl selbst ist, ist keine — sie ist eine
           gewöhnliche Skalenzahl und bleibt grau und leicht. Gemessen gegen die Vorlage:
           dort stehen alle Skalenzahlen in `500 11px` grau, bei uns standen sie in
           `600 11px` Tinte, weil jede Marke aus dem Schema als benannt galt. */
        benannt: benannt.has(v) && benannt.get(v) !== fmtDe(v, dez),
        // Die Zahl direkt unter der Nadel blendet aus, damit sie den Wert nicht doppelt.
        sichtbar: Math.abs(sx - x) >= 24,
      };
    });
  const mittelAlle = mittel ? mittel * schritt : 0;
  const erstesMittel = mittelAlle ? Math.ceil(min / mittelAlle) * mittelAlle : 0;

  /* 🚨 Die Einheit steht NEBEN dem Feld, nicht darin (Vorlage „FL Lineal.dc.html":
     `input … 700 26px #334A27` + `span … italic 300 15px #686C6A`). Im Feld nimmt sie
     Größe und Farbe der Zahl an — dann liest sich „20.000 €" als ein Wort, und beim
     Tippen muss man das Eurozeichen mit löschen. */
  const text = tippen ?? fmtDe(wert, dez);
  const farbe = FARBE[werkzeug];

  const runter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    start.current = { x: e.clientX, wert };
    e.currentTarget.setPointerCapture(e.pointerId);
    setZiehen(true);
    setHinweisAn(false);
    e.currentTarget.focus({ preventScroll: true });
  };
  const bewegen = (e: React.PointerEvent) => {
    if (!ziehen) return;
    // Nach rechts ziehen heißt: die Skala wandert mit, die Nadel zeigt auf weniger.
    setzen(start.current.wert - ((e.clientX - start.current.x) / px) * schritt);
  };
  const loslassen = () => setZiehen(false);
  const taste = (e: React.KeyboardEvent) => {
    const gross = e.shiftKey ? major : 1;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); setzen(wert + schritt * gross); }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); setzen(wert - schritt * gross); }
  };
  const stopp = (e: React.PointerEvent) => e.stopPropagation();

  return (
    <div
      ref={wurzel}
      className={"kb-lineal" + (ziehen ? " kb-lineal--zieht" : "")}
      data-hinweis={hinweisAn ? "an" : "aus"}
      style={{ "--kb-lineal-farbe": farbe } as React.CSSProperties}
    >
      <div
        className="kb-lineal__griff"
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={wert}
        aria-valuetext={`${fmtDe(wert, dez)}${einheit ? " " + einheit : ""}`}
        aria-controls={eingabeId}
        onPointerDown={runter}
        onPointerMove={bewegen}
        onPointerUp={loslassen}
        onPointerCancel={loslassen}
        onKeyDown={taste}
      >
        <div className="kb-lineal__fenster">
          <div
            className="kb-lineal__spur"
            style={{ width: spurBreite, "--kb-x": `${x}px` } as React.CSSProperties}
          >
            <i className="kb-lineal__grundlinie" aria-hidden="true" />
            <i
              className="kb-lineal__striche"
              aria-hidden="true"
              style={{
                "--kb-px": `${px}px`,
                "--kb-gross-px": `${major * px}px`,
                "--kb-gross-x": `${((erstesGross - min) / schritt) * px}px`,
                "--kb-mittel-px": mittelAlle ? `${mittel * px}px` : "0px",
                "--kb-mittel-x": mittelAlle ? `${((erstesMittel - min) / schritt) * px}px` : "0px",
              } as React.CSSProperties}
            />
            {skala.map((m) => (
              <button
                key={m.wert}
                type="button"
                className="kb-lineal__marke"
                data-benannt={m.benannt ? "an" : "aus"}
                style={{ left: m.x, opacity: m.sichtbar ? 1 : 0 }}
                tabIndex={-1}
                aria-hidden={!m.sichtbar}
                onPointerDown={stopp}
                onClick={() => { setzen(m.wert); setHinweisAn(false); }}
              >
                {m.text}
              </button>
            ))}
          </div>
        </div>
        <i className="kb-lineal__nadel" aria-hidden="true" />
        <i className="kb-lineal__spitze" aria-hidden="true" />
      </div>

      {/* Wert und Einheit in EINER Zeile, mittig — wie in der Vorlage
          (`display:flex;justify-content:center;align-items:baseline;gap:7px;height:40px`).
          Absolut positioniert wie vorher, damit die Skala darunter ihre Maße behält. */}
      <div className="kb-lineal__wertzeile">
      <input
        id={eingabeId}
        className="kb-lineal__wert"
        value={text}
        inputMode="decimal"
        aria-label={`${ariaLabel} eintippen`}
        style={{ width: `${Math.max(5, text.length) + 2}ch`, animation: tick ? `fl-tick${tick % 2 ? "A" : "B"} .3s ease-out` : undefined }}
        onPointerDown={stopp}
        onFocus={(e) => { setTippen(String(wert).replace(".", ",")); setHinweisAn(false); requestAnimationFrame(() => e.target.select()); }}
        onChange={(e) => setTippen(e.target.value)}
        onBlur={() => { if (tippen !== null && tippen !== "") setzen(parseDe(tippen)); setTippen(null); }}
        onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") e.currentTarget.blur(); }}
      />
      {einheit && <span className="kb-lineal__einheit" aria-hidden="true">{einheit}</span>}
      </div>

      {hinweis && (
        <span className="kb-lineal__hinweis" aria-hidden="true">
          <i />
          ziehen · Marke antippen · Zahl eintippen
        </span>
      )}
    </div>
  );
}

/** Nur für Tests: sitzt ein Strich auf einem großen Teilstrich? (FL Lineal:74) */
export const istGross = (wert: number, major: number, schritt: number) => vielfaches(wert, major * schritt);
