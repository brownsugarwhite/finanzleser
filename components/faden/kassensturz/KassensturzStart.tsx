"use client";

/**
 * Das Deckblatt vor dem Kassensturz (Wunsch vom 12.09.2026): Der Kassensturz beginnt im
 * Kapitel „Heute" nicht mehr mitten in Frage 1, sondern mit einer Titelseite — Kopfzeile,
 * fünf offene Segmente, eine Frage, ein Knopf.
 *
 * 🚨 Kein weißer Kasten: Das Deckblatt trägt bewusst KEIN `.kasten`. Diese Klasse bringt
 * Papierfläche, Rahmen und die 3-px-Oberkante mit; im Zeitungssatz steht der Text direkt
 * auf der Seite. Alles andere sind dieselben `ks__*`-Klassen wie im laufenden
 * Kassensturz, damit der Übergang formgleich ist.
 *
 * 🚨 Auch wer schon einen Stand hat, sieht zuerst das Deckblatt — es ändert nur seinen
 * Text. Direkt in die Frage zu springen hieße: Der Server liefert das Deckblatt, die
 * Hydration tauscht es aus, und genau dieses Flackern soll weg. `useSyncExternalStore`
 * mit `serverLesen → null` hält Server und ersten Client-Render deckungsgleich.
 */
import { useState, useSyncExternalStore } from "react";
import type { KassensturzDaten } from "@/lib/faden/optionen";
import Kassensturz, { type Ziel } from "./Kassensturz";
import Fortschrittsreihe from "./Fortschrittsreihe";
import Button from "@/components/ui/Button";
import { KS_EREIGNIS, KS_SPEICHER, datumLang, offeneFragen } from "./logik";

function abonnieren(cb: () => void): () => void {
  window.addEventListener("storage", cb);
  document.addEventListener(KS_EREIGNIS, cb);
  return () => { window.removeEventListener("storage", cb); document.removeEventListener(KS_EREIGNIS, cb); };
}
function lesen(): string | null {
  try { return localStorage.getItem(KS_SPEICHER); } catch { return null; }
}
function serverLesen(): string | null {
  return null;
}

export default function KassensturzStart({ daten, ziele }: { daten: KassensturzDaten; ziele: Record<string, Ziel> }) {
  const [offen, setOffen] = useState(false);
  const roh = useSyncExternalStore(abonnieren, lesen, serverLesen);

  if (offen) return <Kassensturz daten={daten} ziele={ziele} />;

  let erg: { datum: string; score: number } | null = null;
  let begonnen = false;
  if (roh) {
    try {
      const s = JSON.parse(roh) as { fertig?: boolean; idx?: number; datum?: string; score?: number };
      if (s && s.fertig && typeof s.score === "number") erg = { datum: typeof s.datum === "string" ? s.datum : "", score: s.score };
      else if (s && typeof s.idx === "number" && s.idx > 0) begonnen = true;
    } catch { /* kein gültiger Stand */ }
  }

  const untertitel = daten.untertitel ? ` · ${daten.untertitel}` : "";
  // 🚨 Die Zahl kommt aus den Daten, nicht aus dem Text. Das CMS bestimmt, wie viele
  // Fragen offen sind; ein fest getipptes „fünf" auf dem Deckblatt widerspräche dem
  // Fortschritt im Lauf darunter (gemessen 12.09.2026: acht Segmente).
  const anzahl = Math.max(1, offeneFragen(daten.fragen || [], {}).length);
  return (
    <div className="ks ks-deck" id="kassensturz">
      <div className="ks__kopf">
        <span className="kicker kicker--gruen ks__marke"><i /> {daten.titel}{untertitel}</span>
        <span className="ks__stand">{erg ? "Ausgewertet" : begonnen ? "Angefangen" : "Noch nicht begonnen"}</span>
      </div>
      <Fortschrittsreihe nr={erg ? anzahl + 1 : 0} gesamt={anzahl} />
      <div className="ks__buehne">
        {erg ? (
          <>
            <div className="ks__frage">Ihr Kassensturz vom {datumLang(erg.datum)} · Score {erg.score}</div>
            <p className="ks__hinweis">Profil, Ampel und Ihre Lücken liegen bereit. Die Werte ändern sich jedes Jahr; in sechs Monaten lohnt ein neuer Durchgang.</p>
            <span className="ks-deck__start"><Button label="Ergebnis ansehen" onClick={() => setOffen(true)} /></span>
          </>
        ) : (
          <>
            <div className="ks__frage">Wie gut sind Sie eigentlich aufgestellt?</div>
            <p className="ks__hinweis">{anzahl} Fragen, keine Tastatur. Am Ende sehen Sie Ihr Profil, Ihre Ampel und Ihre drei größten Lücken — sofort und vollständig.</p>
            {/* Der Name ist der Haken für die Sonden (tools/faden-*-mess.mjs) — der Knopf
                selbst kommt unverändert von der Live-Seite und trägt keine eigene Klasse. */}
            <span className="ks-deck__start"><Button label={begonnen ? "Weitermachen" : "Kassensturz starten"} onClick={() => setOffen(true)} /></span>
          </>
        )}
      </div>
    </div>
  );
}
