"use client";

/**
 * Aktenkoffer-Karte (Port aus dem Prototyp, 05-js-neu.html kofferKarte()): was in diesem
 * Browser liegt, mit Öffnen und Entfernen; leer mit Erklärung; darunter „Sichern?“ als
 * Hinweis auf Finanzleser Plus (Stufe 3, hier nur Toast).
 */
import { useState } from "react";
import { useFaden } from "@/components/faden/FadenProvider";
import FadenIkon from "@/components/faden/FadenIkon";

function ikonFuer(titel: string): string {
  if (/Checkliste/i.test(titel)) return "haken";
  if (/Vergleich|Tarif/i.test(titel)) return "waage";
  if (/Antwort|Frage|Leo/i.test(titel)) return "frage";
  if (/Kassensturz/i.test(titel)) return "kurve";
  return "scheine";
}

export default function AktenkofferKarte() {
  const { koffer, kofferEntfernen, navigieren, toast } = useFaden();
  const [weg, setWeg] = useState<string[]>([]);
  const [mail, setMail] = useState("");

  const oeffnen = async (titel: string) => {
    try {
      const r = await fetch("/api/faden/index");
      const liste = (await r.json()) as { titel?: string; href?: string; title?: string; url?: string }[];
      const t = titel.toLowerCase();
      const treffer = (Array.isArray(liste) ? liste : []).find((e) => (e.titel || e.title || "").toLowerCase() === t);
      const href = treffer?.href || treffer?.url;
      navigieren(href || `/suche?q=${encodeURIComponent(titel)}`);
    } catch {
      navigieren(`/suche?q=${encodeURIComponent(titel)}`);
    }
  };
  const entfernen = (titel: string) => {
    setWeg((w) => [...w, titel]);
    setTimeout(() => { kofferEntfernen(titel); setWeg((w) => w.filter((x) => x !== titel)); }, 300);
  };

  return (
    <div className="koffer">
      {koffer.length === 0 ? (
        <div className="koffer__leer">
          <FadenIkon name="koffer" />
          <p>Noch leer. Unter jedem Ergebnis, jeder Checkliste und jeder Antwort steht „In den Aktenkoffer“. Was dort liegt, bleibt in diesem Browser; mit Finanzleser Plus auf allen Geräten.</p>
        </div>
      ) : (
        <div className="koffer__liste">
          {koffer.map((t, i) => (
            <div key={t} className={"koffer__eintrag" + (weg.includes(t) ? " weg" : "")} style={{ animationDelay: `${i * 50}ms` }}>
              <span className="koffer__ikon"><FadenIkon name={ikonFuer(t)} /></span>
              <span className="koffer__text"><b>{t}</b><small>in diesem Browser abgelegt</small></span>
              <span className="koffer__akt">
                <button type="button" className="textlink" onClick={() => oeffnen(t)}>Öffnen</button>
                <button type="button" className="textlink textlink--still" onClick={() => entfernen(t)}>Entfernen</button>
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="koffer__sichern">
        <p>Wenn Sie den Browser schließen, ist der Koffer weg. <b>Soll ich ihn sichern?</b> Ein Feld genügt.</p>
        <form className="reihe" onSubmit={(e) => { e.preventDefault(); if (!mail.trim()) return; toast("Sichern und Anmelden kommen mit Finanzleser Plus (Stufe 3)."); }}>
          <input type="email" placeholder="ihre@adresse.de" aria-label="E-Mail" value={mail} onChange={(e) => setMail(e.target.value)} />
          <button className="btn btn--klein btn--primary" type="submit">Sichern</button>
        </form>
      </div>
    </div>
  );
}
