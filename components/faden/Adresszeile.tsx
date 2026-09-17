"use client";

/**
 * FL Adresszeile — das kompakte Kontaktfeld der Übergabe „Finanzleser Heute“.
 *
 * Überall dort, wo eine E-Mail, ein Name oder eine Telefonnummer abgefragt wird: eine
 * 44-px-Zeile mit Label-Kicker links, Statuswort rechts, dem Feld auf einer Grundlinie
 * und einem Pillenknopf mit Papierflieger.
 *
 * Der Witz des Bauteils ist die LINIE. Sie wächst in vier Stufen mit, während die Adresse
 * entsteht — Text, @, Domain, Endung —, und am rechten Ende poppt ein Knoten, sobald sie
 * vollständig ist. Der Status daneben sagt in Worten dasselbe. So sieht man beim Tippen,
 * dass etwas fehlt, ohne dass ein Fehler gemeldet würde.
 *
 * 🚨 Der Fehler kommt erst beim ABSENDEN, nie beim Tippen. Eine halb getippte Adresse ist
 * nicht falsch, sie ist unfertig — und ein rotes Feld beim dritten Buchstaben ist die
 * unfreundlichste Art, das zu sagen.
 *
 * 🚨 `onSenden` bekommt den Wert und darf werfen: Wer ablehnt (Server sagt Nein), gibt
 * einen Text zurück; die Zeile zeigt ihn als Fehler und bleibt bedienbar. Wer nichts
 * zurückgibt, hat angenommen — dann fliegt der Flieger und die Zeile verriegelt.
 */
import { useRef, useState } from "react";

export type AdressArt = "email" | "text" | "tel";
export type AdressTon = "gruen" | "marke" | "tuerkis";

/** Wie weit die Gültigkeitslinie steht — vier Stufen, wie im Handoff. */
function stufe(wert: string, art: AdressArt): number {
  const w = wert.trim();
  if (!w) return 0;
  if (art !== "email") return w.length >= 3 ? 4 : 2;
  const [vorn, ...rest] = w.split("@");
  if (!vorn) return 0;
  if (!rest.length) return 1;
  const hinten = rest.join("@");
  if (!hinten) return 2;
  if (!/\.[a-zA-Z]{2,}$/.test(hinten)) return 3;
  return 4;
}

const WORT: Record<AdressArt, string[]> = {
  email: ["", "Name", "jetzt die Domain", "noch die Endung", "sieht gut aus"],
  text: ["", "weiter", "weiter", "weiter", "sieht gut aus"],
  tel: ["", "weiter", "weiter", "weiter", "sieht gut aus"],
};

export default function Adresszeile({
  label,
  platzhalter = "ihre@adresse.de",
  knopf = "Eintragen",
  hinweis,
  hinweisFertig,
  art = "email",
  ton = "gruen",
  onSenden,
}: {
  label: string;
  platzhalter?: string;
  /** Leer heißt: kein Knopf, Enter sendet. */
  knopf?: string;
  hinweis?: React.ReactNode;
  hinweisFertig?: React.ReactNode;
  art?: AdressArt;
  ton?: AdressTon;
  /** Gibt einen Text zurück, wenn es NICHT geklappt hat; sonst nichts. */
  onSenden: (wert: string) => void | string | Promise<void | string>;
}) {
  const [wert, setWert] = useState("");
  const [fokus, setFokus] = useState(false);
  const [phase, setPhase] = useState<"ruhe" | "unterwegs" | "fertig">("ruhe");
  const [fehler, setFehler] = useState<string | null>(null);
  // 🚨 Zwei Keyframes im Wechsel — derselbe Name ein zweites Mal startet keine Animation.
  // Dasselbe Verfahren wie im Kursblatt (useLauf) und im Prototyp der Übergabe.
  const [beben, setBeben] = useState(0);
  /**
   * 🚨 Bewusst KEIN `useId()`. Gemessen 15.09. am Lineal und 17.09. hier: Server und
   * Client vergeben im Faden verschiedene Präfixe, und React verwirft die Hydration mit
   * „some attributes of the server rendered HTML didn't match". Ein aus dem Label
   * gebildeter Name ist auf beiden Seiten derselbe — und lesbar dazu.
   */
  const id = "az-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const feld = useRef<HTMLInputElement>(null);

  const s = stufe(wert, art);
  const gueltig = s === 4;
  const status = phase === "fertig" ? "Eingetragen" : phase === "unterwegs" ? "Unterwegs …" : WORT[art][s];

  const senden = async () => {
    if (phase !== "ruhe") return;
    if (!gueltig) {
      setFehler(art === "email" ? "Bitte eine vollständige Adresse, z. B. name@adresse.de" : "Bitte noch etwas mehr eintragen.");
      setBeben((n) => n + 1);
      feld.current?.focus();
      return;
    }
    setFehler(null);
    setPhase("unterwegs");
    const antwort = await onSenden(wert.trim());
    if (typeof antwort === "string" && antwort) { setPhase("ruhe"); setFehler(antwort); setBeben((n) => n + 1); return; }
    // 850 ms: so lange fliegt der Flieger aus dem Knopf heraus (Handoff).
    window.setTimeout(() => setPhase("fertig"), 850);
  };

  return (
    <div
      className={"az az--" + ton + (fokus ? " ist-fokus" : "") + (gueltig ? " ist-gueltig" : "") + (fehler ? " ist-fehler" : "") + (phase !== "ruhe" ? ` ist-${phase}` : "")}
      style={fehler ? { animationName: beben % 2 ? "az-schuettel" : "az-schuettel2" } : undefined}
    >
      <div className="az__kopf">
        <label className="kicker az__label" htmlFor={id}>{label}</label>
        <span className="az__status" aria-live="polite">{fehler ? "" : status}</span>
      </div>

      <div className="az__zeile">
        <div className="az__feld">
          {/* Nach dem Eintragen hebt sich der getippte Text weg und die Bestätigung
              druckt sich an seiner Stelle. */}
          <input
            id={id}
            ref={feld}
            className="az__eingabe"
            type={art === "email" ? "email" : art === "tel" ? "tel" : "text"}
            inputMode={art === "tel" ? "tel" : undefined}
            autoComplete={art === "email" ? "email" : art === "tel" ? "tel" : "name"}
            placeholder={platzhalter}
            value={wert}
            disabled={phase !== "ruhe"}
            onChange={(e) => { setWert(e.target.value); if (fehler) setFehler(null); }}
            onFocus={() => setFokus(true)}
            onBlur={() => setFokus(false)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void senden(); } }}
          />
          {phase === "fertig" && <span className="az__quittung" aria-hidden="true">✓ {wert.trim()}</span>}
          {/* Grundlinie, Gültigkeitslinie, Doppellinie im Fokus, Knoten am Ende. */}
          <i className="az__grund" aria-hidden="true" />
          <i className="az__gueltig" style={{ transform: `scaleX(${s / 4})` }} aria-hidden="true" />
          <i className="az__doppel az__doppel--1" aria-hidden="true" />
          <i className="az__doppel az__doppel--2" aria-hidden="true" />
          <i className="az__knoten" aria-hidden="true" />
        </div>

        {knopf && (
          <button type="button" className="az__knopf" onClick={() => void senden()} disabled={phase !== "ruhe"}>
            <span>{phase === "fertig" ? "Eingetragen" : phase === "unterwegs" ? "Unterwegs" : knopf}</span>
            <i className="az__scheibe">
              {phase === "fertig" ? (
                <svg viewBox="0 0 16 16" aria-hidden="true"><path className="az__haken" d="M3 8.5l3.2 3.2L13 5" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l18-8-8 18-2-8z" /></svg>
              )}
            </i>
          </button>
        )}
      </div>

      {(fehler || hinweis || hinweisFertig) && (
        <p className="az__hinweis" role={fehler ? "alert" : undefined}>
          {fehler || (phase === "fertig" ? hinweisFertig || hinweis : hinweis)}
        </p>
      )}
    </div>
  );
}
