"use client";

/**
 * Zählwerk — Prozentwerte mit Nachkomma: Zins, Tilgung, Rendite.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:274-287 (Markup),
 * :436-439 (Halten). Zwei runde Knöpfe um eine rollende Zahl; gedrückt halten zählt nach
 * 380 ms alle 70 ms weiter. Darunter Schnellwahl-Chips.
 *
 * 🚨 Der Wiederholtakt liest den Wert aus einem Ref, nicht aus der Closure. Der Prototyp
 * greift in `setInterval` auf `this.state.rz` zu (K:436) — in React wäre das der Wert vom
 * Moment des Drückens, und das Zählwerk bliebe nach dem ersten Schritt stehen.
 */

import { useEffect, useRef } from "react";
import { klemme } from "@/lib/kursblatt/zahl";
import Odometer from "./Odometer";
import type { Werkzeug } from "./Lineal";

export interface ZaehlwerkProps {
  wert: number;
  onWert: (v: number) => void;
  min: number;
  max: number;
  schritt: number;
  dez?: number;
  einheit?: string;
  /** Chips unter dem Zählwerk. */
  schnellwahl?: number[];
  hinweis?: string;
  werkzeug?: Werkzeug;
  ariaLabel: string;
}

const FARBE: Record<Werkzeug, string> = {
  tuerkis: "var(--tuerkis)",
  magenta: "var(--pink)",
  gruen: "var(--green)",
  ink: "var(--ink)",
};

export default function Zaehlwerk({
  wert, onWert, min, max, schritt, dez = 1, einheit = "%",
  schnellwahl = [], hinweis, werkzeug = "magenta", ariaLabel,
}: ZaehlwerkProps) {
  const jetzt = useRef(wert);
  jetzt.current = wert;
  const verzoegerung = useRef<ReturnType<typeof setTimeout> | null>(null);
  const takt = useRef<ReturnType<typeof setInterval> | null>(null);

  const setzen = (roh: number) => {
    const neu = +klemme(roh, min, max).toFixed(dez);
    if (neu !== jetzt.current) onWert(neu);
  };
  const stopp = () => {
    if (verzoegerung.current) clearTimeout(verzoegerung.current);
    if (takt.current) clearInterval(takt.current);
    verzoegerung.current = null;
    takt.current = null;
  };
  useEffect(() => stopp, []);

  const halten = (richtung: 1 | -1) => {
    stopp();
    setzen(jetzt.current + richtung * schritt);
    verzoegerung.current = setTimeout(() => {
      takt.current = setInterval(() => setzen(jetzt.current + richtung * schritt), 70);
    }, 380);
  };

  const text = wert.toLocaleString("de-DE", { minimumFractionDigits: dez, maximumFractionDigits: dez }) + (einheit ? ` ${einheit}` : "");

  return (
    <div className="kb-zaehlwerk" style={{ "--kb-feld-farbe": FARBE[werkzeug] } as React.CSSProperties}>
      <div className="kb-zaehlwerk__zeile">
        <button
          type="button" className="kb-zaehlwerk__knopf" aria-label={`${ariaLabel} senken`}
          onPointerDown={(e) => { if (e.button === 0 || e.pointerType !== "mouse") halten(-1); }}
          onPointerUp={stopp} onPointerLeave={stopp} onPointerCancel={stopp}
        >
          <i className="kb-zaehlwerk__minus" aria-hidden="true" />
        </button>

        <output className="kb-zaehlwerk__wert" aria-label={`${ariaLabel}: ${text}`}>
          <Odometer text={text} />
        </output>

        <button
          type="button" className="kb-zaehlwerk__knopf" aria-label={`${ariaLabel} erhöhen`}
          onPointerDown={(e) => { if (e.button === 0 || e.pointerType !== "mouse") halten(1); }}
          onPointerUp={stopp} onPointerLeave={stopp} onPointerCancel={stopp}
        >
          <i className="kb-zaehlwerk__minus" aria-hidden="true" />
          <i className="kb-zaehlwerk__plus" aria-hidden="true" />
        </button>
      </div>

      {schnellwahl.length > 0 && (
        <div className="kb-zaehlwerk__schnellwahl">
          {schnellwahl.map((v) => {
            const aktiv = Math.abs(v - wert) < schritt / 2;
            return (
              <button
                key={v} type="button" className="chip kb-zaehlwerk__chip" data-aktiv={aktiv ? "an" : "aus"}
                onClick={() => setzen(v)}
              >
                {v.toLocaleString("de-DE", { minimumFractionDigits: dez, maximumFractionDigits: dez })} {einheit}
              </button>
            );
          })}
        </div>
      )}
      {hinweis && <span className="kb-zaehlwerk__hinweis">{hinweis}</span>}
    </div>
  );
}
