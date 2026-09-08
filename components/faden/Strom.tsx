"use client";

/**
 * Der Strom: eingefrorene Kapitel (Verlauf) + das lebende Kapitel (die aktuelle Seite).
 * Schnappschüsse sind reines HTML (inert), Kopfzeile mit Nummer, Pfad, Uhrzeit;
 * aufklappen zeigt den statischen Inhalt, „erneut öffnen“ navigiert wirklich.
 */
import type { ReactNode } from "react";
import { useFaden } from "./FadenProvider";

export default function Strom({ children }: { children: ReactNode }) {
  const { verlauf, kapitelUmschalten, navigieren } = useFaden();
  return (
    <div className="strom" id="strom">
      {verlauf.map((k, i) => (
        <section key={k.id} className={"kapitel kapitel--alt" + (k.offen ? "" : " zu")} inert={!k.offen} id={`kapitel-alt-${k.id}`}>
          <div className="kapitel__kopf" onClick={() => { if (!k.offen) kapitelUmschalten(k.id); }}>
            <span className="kicker">Kapitel {i + 1}{k.pfad.length ? " · " + k.pfad.join(" › ") : ""} · {k.zeit}</span>
            <h2>{k.titel}</h2>
            <button type="button" className="toggle-k" onClick={(e) => { e.stopPropagation(); kapitelUmschalten(k.id); }}>
              {k.offen ? "einklappen ▴" : "aufklappen ▾"}
            </button>
          </div>
          <div className="kapitel__inhalt">
            {k.html ? (
              <div className="kapitel__schnappschuss" dangerouslySetInnerHTML={{ __html: k.html }} />
            ) : (
              <p className="kapitel__wieder">Dieses Kapitel lag vor dem Neuladen im Faden. <button type="button" className="textlink" onClick={() => navigieren(k.url)}>Erneut öffnen</button></p>
            )}
            <div className="kapitel__wieder-zeile"><button type="button" className="textlink textlink--still" onClick={() => navigieren(k.url)}>Kapitel ans Ende des Fadens holen ↓</button></div>
          </div>
        </section>
      ))}
      {children}
    </div>
  );
}
