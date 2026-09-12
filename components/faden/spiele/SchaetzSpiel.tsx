"use client";

/**
 * Schätzfrage im Zeitungssatz — 1:1 nach Handoff 1072–1080.
 *
 * Ein Regler über die volle Breite, darunter die Sprechblase mit dem eigenen Tipp. Nach
 * dem Abgeben erscheint die Wahrheit als zweite Blase in Magenta, und die Auflösung sagt,
 * wie nah es war.
 *
 * Felder aus dem CMS: `frage`, `min`, `max`, `antwort`, `einheit`, `aufloesung`.
 */
import { useState } from "react";
import SpielKopf from "./SpielKopf";

function zahl(x: string | undefined): number | null {
  if (!x) return null;
  const n = Number(String(x).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export default function SchaetzSpiel({ felder }: { felder: Record<string, string> }) {
  const min = zahl(felder.min) ?? 0;
  const max = Math.max(min + 1, zahl(felder.max) ?? 100);
  const wahrheit = Math.min(max, Math.max(min, zahl(felder.antwort) ?? min));
  const einheit = felder.einheit ?? "";
  const [tipp, setTipp] = useState(Math.round((min + max) / 2));
  const [ab, setAb] = useState(false);

  const anteil = (w: number) => ((w - min) / (max - min)) * 100;
  const zeige = (w: number) => w.toLocaleString("de-DE");
  const abstand = Math.abs(tipp - wahrheit);
  // Die Spanne als Maßstab: 5 % daneben ist bei „20 bis 200 Euro" etwas anderes als bei
  // „1 bis 3 Millionen".
  const genau = abstand <= (max - min) * 0.05;
  const nah = abstand <= (max - min) * 0.15;

  return (
    <div className="spiel spiel--schaetzen">
      <SpielKopf kicker="Schätzfrage" hinweis={`${zeige(min)}${einheit} bis ${zeige(max)}${einheit}`} />
      <p className="spiel__frage">{felder.frage ?? ""}</p>
      <div className="spiel-schaetz__buehne">
        <input
          className="spiel-schaetz__regler"
          type="range"
          min={min}
          max={max}
          value={tipp}
          disabled={ab}
          aria-label={felder.frage || "Ihr Tipp"}
          onChange={(e) => setTipp(Number(e.target.value))}
          style={{ background: `linear-gradient(to right, var(--ink) ${anteil(tipp)}%, rgba(51,74,39,.23) ${anteil(tipp)}%)` }}
        />
        <span className="spiel-schaetz__blase" style={{ left: `${anteil(tipp)}%` }}>
          <i aria-hidden="true" />
          {zeige(tipp)}{einheit}
        </span>
        {ab && (
          <span className="spiel-schaetz__blase spiel-schaetz__blase--wahrheit" style={{ left: `${anteil(wahrheit)}%`, top: 58 }}>
            <i aria-hidden="true" />
            {zeige(wahrheit)}{einheit}
          </span>
        )}
      </div>
      <div className="spiel-schaetz__skala">
        <span>{zeige(min)}{einheit}</span>
        <span>{zeige(max)}{einheit}</span>
      </div>
      {!ab && (
        <button type="button" className="btn spiel-schaetz__knopf" onClick={() => setAb(true)}>Tipp abgeben</button>
      )}
      <p className={"spiel__aufloesung" + (!ab ? "" : genau ? " spiel__aufloesung--richtig" : " spiel__aufloesung--falsch")} aria-live="polite">
        {ab && (
          <>
            <b>{genau ? "Sehr nah dran." : nah ? "Fast." : "Daneben."}</b>{" "}
            {felder.aufloesung || `Richtig sind ${zeige(wahrheit)}${einheit}.`}
          </>
        )}
      </p>
    </div>
  );
}
