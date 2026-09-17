"use client";

/**
 * Das Eintragefeld für Leos Wochenbrief, wie es die Übergabe „Finanzleser Heute“
 * (Baustein 4) zeigt: die FL Adresszeile auf einer Glasplatte, darunter die
 * Datenschutzzeile. Nach dem Eintragen ein Stempel „EINGETRAGEN“.
 *
 * Es schickt an denselben Endpunkt wie bisher (`/api/newsletter`, CleverReach mit
 * Double-Opt-in) und merkt sich den Stand in localStorage `faden-wochenbrief` — wer
 * eingetragen ist, sieht die Bestätigung statt des Feldes.
 *
 * 🚨 Die Einwilligung steht als SATZ unter dem Feld, nicht mehr als Kästchen daneben.
 * So zeigt es die Übergabe, und das Double-Opt-in bleibt der Nachweis: Ohne den Klick in
 * der Bestätigungsmail wird niemand eingetragen. Wer das Kästchen zurück will, setzt es
 * hier wieder ein — der Endpunkt hat sich nicht geändert.
 */
import { useEffect, useState } from "react";
import Adresszeile from "@/components/faden/Adresszeile";

const KEY = "faden-wochenbrief";

/** „Donnerstag, 11. September“ — der nächste Donnerstag (heute, wenn Donnerstag). */
function naechsterDonnerstag(d = new Date()): string {
  const t = new Date(d);
  t.setDate(t.getDate() + ((4 - t.getDay() + 7) % 7));
  return t.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
}

export default function WochenbriefFeld() {
  const [eingetragen, setEingetragen] = useState<string | null>(null);
  const [frisch, setFrisch] = useState(false);

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s && typeof s.mail === "string") setEingetragen(s.mail); } catch { /* kein Speicher */ }
  }, []);

  const senden = async (mail: string): Promise<void | string> => {
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mail, consent: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return data?.error || "Eintragen hat nicht geklappt. Bitte später noch einmal.";
      try { localStorage.setItem(KEY, JSON.stringify({ mail, seit: new Date().toISOString() })); } catch { /* kein Speicher */ }
      setFrisch(true);
    } catch {
      return "Eintragen hat nicht geklappt. Bitte später noch einmal.";
    }
  };

  // Schon eingetragen (aus einer früheren Sitzung): die Zeile hat nichts mehr zu tun.
  if (eingetragen && !frisch) {
    return (
      <div className="wb-platte__fertig">
        <span className="kicker kicker--gruen">Eingetragen</span>
        <p>{eingetragen} · Nächste Ausgabe: {naechsterDonnerstag()}.{" "}
          <button type="button" className="strich-link strich-link--still" onClick={() => { try { localStorage.removeItem(KEY); } catch { /* egal */ } setEingetragen(null); }}>Andere Adresse</button>
        </p>
      </div>
    );
  }

  return (
    <>
      {frisch && <span className="wb-platte__stempel" aria-hidden="true">Eingetragen</span>}
      <Adresszeile
        label={frisch ? "Erste Ausgabe: Donnerstag" : "Ihre E-Mail · donnerstags"}
        platzhalter="ihre@adresse.de"
        knopf="Eintragen"
        onSenden={senden}
        hinweis={<>Mit dem Eintragen stimmen Sie der <a href="/datenschutz" data-faden-aus="" target="_blank" rel="noopener">Datenschutzerklärung</a> zu. Abmelden mit einem Klick in jeder Ausgabe.</>}
        hinweisFertig={<>Fast geschafft: bitte den Link in der Bestätigungsmail anklicken.</>}
      />
    </>
  );
}
