"use client";

/**
 * Setzzeile — ersetzt das klassische Eingabefeld für alles, was man genau kennt:
 * Gehalt, Miete, Kilometer, Anlagebetrag.
 *
 * Vorlage: design_handoff_finanzleser_kursblatt/„FL Setzzeile.dc.html“ (Markup :17-37,
 * Mechanik :40-71). Eine Zeile auf dem Papier: Kicker-Label, Wert in großer Antiqua,
 * Einheit kursiv, links und rechts ein Schritt-Knopf. Im Fokus zeichnet sich die
 * Doppellinie von der Mitte; nach jedem gesetzten Wert poppt rechts ein grüner Knoten.
 *
 * 🚨 Die Pfeiltasten ändern den TEXT, nicht den Wert (FL Setzzeile:49) — übernommen wird
 * erst bei Enter oder Verlassen. Wer mit gedrückter Pfeiltaste durch einen Bereich fährt,
 * löst sonst bei jedem Zwischenschritt eine Neuberechnung aus.
 */

import { useState } from "react";
import { fmtDe, klemme, parseDe } from "@/lib/kursblatt/zahl";
import type { Werkzeug } from "./Lineal";

export interface SetzzeileProps {
  label: string;
  /** Rechts neben der Bezeichnung: „500 – 200.000 €", „ziehen · Marke antippen". */
  bereich?: string;
  wert: number | null;
  onWert: (v: number) => void;
  einheit?: string;
  min: number;
  max: number;
  schritt: number;
  dez?: number;
  werkzeug?: Werkzeug;
  /** Grauer Text im leeren Feld, z. B. „z. B. 20.000“. */
  platzhalter?: string;
  /** Gepunktet unterstrichene Zahlen rechts unter der Zeile. */
  vorschlaege?: number[];
  /** Vorschläge immer zeigen statt nur im Fokus. */
  vorschlaegeImmer?: boolean;
  /** Schritt-Knöpfe immer voll sichtbar statt nur im Fokus. */
  stepper?: boolean;
  hinweis?: string;
}

const FARBE: Record<Werkzeug, string> = {
  tuerkis: "var(--tuerkis)",
  magenta: "var(--pink)",
  gruen: "var(--green)",
  ink: "var(--ink)",
};

export default function Setzzeile({
  label, bereich, wert, onWert, einheit = "", min, max, schritt, dez = 0,
  werkzeug = "tuerkis", platzhalter = "", vorschlaege = [], vorschlaegeImmer = false,
  stepper = false, hinweis = "",
}: SetzzeileProps) {
  const [tippen, setTippen] = useState<string | null>(null);
  const [fokus, setFokus] = useState(false);
  const [gesetzt, setGesetzt] = useState(0);

  const setzen = (roh: number) => {
    if (isNaN(roh)) return;
    const neu = +klemme(roh, min, max).toFixed(dez);
    if (neu !== wert) onWert(neu);
    setGesetzt((n) => n + 1);
  };

  // Fehler entsteht LIVE beim Tippen, nicht erst beim Übernehmen (FL Setzzeile:57).
  const live = tippen !== null && tippen !== "" ? parseDe(tippen) : null;
  let fehler: string | null = null;
  if (live !== null && !isNaN(live)) {
    if (live > max) fehler = `Höchstens ${fmtDe(max, dez)} ${einheit}`.trim();
    else if (live < min) fehler = `Mindestens ${fmtDe(min, dez)} ${einheit}`.trim();
  }

  const text = tippen !== null ? tippen : wert === null ? "" : fmtDe(wert, dez);
  const zeigtVorschlaege = fokus || vorschlaegeImmer;

  return (
    <div
      className="kb-setzzeile"
      data-fokus={fokus ? "an" : "aus"}
      data-fehler={fehler ? "an" : "aus"}
      style={{ "--kb-feld-farbe": FARBE[werkzeug] } as React.CSSProperties}
    >
      <div className="kb__feldkopf">
        <b className="kb-setzzeile__label">{label}</b>
        {bereich && <span>{bereich}</span>}
      </div>

      {/* 🚨 Die Zeile der Vorlage („FL Setzzeile.dc.html"): Zahl · Einheit · DEHNFUGE ·
          ‹ › als Paar rechts. Bei uns stand das ‹ LINKS vor der Zahl und das › ganz
          rechts — die Zahl rutschte dadurch nach innen und stand nicht mehr an der
          gleichen Kante wie in jedem anderen Baustein, und die beiden Pfeile lasen sich
          nicht als ein Bedienelement. */}
      <div className="kb-setzzeile__zeile">
        <input
          className="kb-setzzeile__wert"
          /* Breite = Zeichen + .6ch, wie in der Vorlage. Ohne sie nimmt das Feld die
             Standardbreite und schiebt Einheit und Pfeilpaar auseinander. */
          style={{ width: `${Math.max(2, (text || platzhalter || "").length) + 0.6}ch` }}
          value={text}
          placeholder={platzhalter}
          inputMode="decimal"
          aria-label={label}
          aria-invalid={fehler ? true : undefined}
          onFocus={(e) => { setTippen(wert === null ? "" : String(wert).replace(".", ",")); setFokus(true); requestAnimationFrame(() => e.target.select()); }}
          onChange={(e) => setTippen(e.target.value.replace(/[^\d.,]/g, ""))}
          onBlur={() => { if (tippen !== null && tippen !== "") setzen(parseDe(tippen)); setTippen(null); setFokus(false); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.currentTarget.blur(); return; }
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              const jetzt = tippen !== null && tippen !== "" ? parseDe(tippen) : wert ?? min;
              const nv = klemme(jetzt + (e.key === "ArrowUp" ? schritt : -schritt) * (e.shiftKey ? 10 : 1), min, max);
              setTippen(String(+nv.toFixed(dez)).replace(".", ","));
            }
          }}
        />
        {einheit && <span className="kb-setzzeile__einheit">{einheit}</span>}
        <span className="kb-setzzeile__fuge" />
        <div className="kb-setzzeile__paar" data-immer={stepper ? "an" : "aus"}>
          <button
            type="button" tabIndex={-1} aria-label={`${label} verringern`}
            className="kb-setzzeile__schritt"
            onClick={() => setzen((wert ?? min) - schritt)}
          >
            <i aria-hidden="true" />
          </button>
          <button
            type="button" tabIndex={-1} aria-label={`${label} erhöhen`}
            className="kb-setzzeile__schritt kb-setzzeile__schritt--plus"
            onClick={() => setzen((wert ?? min) + schritt)}
          >
            <i aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="kb-feldlinien" aria-hidden="true">
        <i className="kb-feldlinien__grund" />
        <i className="kb-feldlinien__doppel kb-feldlinien__doppel--stark" />
        <i className="kb-feldlinien__doppel kb-feldlinien__doppel--fein" />
        <i
          className="kb-feldlinien__bestaetigt"
          style={{ animation: gesetzt ? `fl-setz${gesetzt % 2 ? "" : "2"} .9s var(--kurve) both` : undefined }}
        />
      </div>

      <div className="kb-setzzeile__fuss">
        <span className="kb-setzzeile__hinweis" role={fehler ? "alert" : undefined}>
          {fehler ?? hinweis}
        </span>
        {vorschlaege.length > 0 && (
          <div className="kb-setzzeile__vorschlaege" data-an={zeigtVorschlaege ? "an" : "aus"}>
            {vorschlaege.map((v) => (
              <button
                key={v}
                type="button"
                tabIndex={zeigtVorschlaege ? 0 : -1}
                /* Den Fokus im Feld halten, sonst schließt sich die Zeile beim Antippen. */
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setzen(v); setTippen(null); }}
              >
                {fmtDe(v, dez)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
