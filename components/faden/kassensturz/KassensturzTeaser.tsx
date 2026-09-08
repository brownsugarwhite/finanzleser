"use client";

/**
 * Der Kassensturz-Kasten unter jedem Ratgeber (Port aus dem Prototyp, 04-js-inhalt.html
 * `kassensturzTeaser()`): Kopfzeile, leere Fortschrittslinie, eine Frage, Knopf zum
 * Start. Liegt schon ein Ergebnis in localStorage `faden-kassensturz`, steht stattdessen
 * „Ihr Kassensturz vom … · Score N“ mit Link auf die Ergebnisseite.
 */
import { useSyncExternalStore } from "react";
import { KASSENSTURZ_URL, KS_SPEICHER, datumLang } from "./logik";

function abonnieren(cb: () => void): () => void {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}
function lesen(): string | null {
  try { return localStorage.getItem(KS_SPEICHER); } catch { return null; }
}
function serverLesen(): string | null {
  return null;
}

export default function KassensturzTeaser() {
  const roh = useSyncExternalStore(abonnieren, lesen, serverLesen);
  let erg: { datum: string; score: number } | null = null;
  if (roh) {
    try {
      const s = JSON.parse(roh) as { fertig?: boolean; datum?: string; score?: number };
      if (s && s.fertig && typeof s.score === "number") erg = { datum: typeof s.datum === "string" ? s.datum : "", score: s.score };
    } catch { /* kein gültiger Stand */ }
  }
  return (
    <div className="kasten kasten--ks ks-teaser">
      <div className="ks">
        <div className="ks__kopf">
          <span className="kicker kicker--pink">Finanz-Kassensturz</span>
          <span className="ks__stand">{erg ? "Ergebnis" : "3 Minuten"}</span>
        </div>
        <div className="ks__fortschritt"><i style={{ width: erg ? "100%" : 0 }} /></div>
        <div className="ks__buehne">
          {erg ? (
            <>
              <div className="ks__frage">Ihr Kassensturz vom {datumLang(erg.datum)} · Score {erg.score}</div>
              <p className="ks__hinweis">Profil, Ampel und Ihre Lücken liegen bereit. Die Werte ändern sich jedes Jahr; in sechs Monaten lohnt ein neuer Durchgang.</p>
              <a className="ks__weiter" href={KASSENSTURZ_URL}>Ergebnis ansehen<i>→</i></a>
            </>
          ) : (
            <>
              <div className="ks__frage">Wie gut sind Sie eigentlich aufgestellt?</div>
              <p className="ks__hinweis">Acht Fragen, keine Tastatur. Am Ende sehen Sie Ihr Profil und Ihre drei größten Lücken, sofort und vollständig.</p>
              <a className="ks__weiter" href={KASSENSTURZ_URL}>Kassensturz starten<i>→</i></a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
