"use client";

/**
 * Leos Wochenbrief: ein Feld, eine Einwilligung, Double-Opt-in über /api/newsletter
 * (CleverReach, wie der alte Newsletter-Banner). Wer eingetragen ist, sieht statt des
 * Feldes die Bestätigung mit dem nächsten Donnerstag (Stand in localStorage `faden-wochenbrief`).
 */
import { useEffect, useState } from "react";
import { useFaden } from "./FadenProvider";

const KEY = "faden-wochenbrief";

/** „Donnerstag, 11. September“ — der nächste Donnerstag (heute, wenn Donnerstag). */
function naechsterDonnerstag(d = new Date()): string {
  const t = new Date(d);
  t.setDate(t.getDate() + ((4 - t.getDay() + 7) % 7));
  return t.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
}

export default function WochenbriefForm({ klein }: { klein?: boolean }) {
  const { toast } = useFaden();
  const [mail, setMail] = useState("");
  const [einverstanden, setEinverstanden] = useState(false);
  const [laedt, setLaedt] = useState(false);
  const [eingetragen, setEingetragen] = useState<string | null>(null);

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s && typeof s.mail === "string") setEingetragen(s.mail); } catch { /* leer */ }
  }, []);

  if (eingetragen) {
    return (
      <p className="quelle wb-eingetragen">
        Eingetragen: {eingetragen} · bitte den Link in der Bestätigungsmail anklicken. Nächste Ausgabe: {naechsterDonnerstag()}.{" "}
        <button type="button" className="textlink textlink--still" onClick={() => { try { localStorage.removeItem(KEY); } catch { /* egal */ } setEingetragen(null); }}>Andere Adresse</button>
      </p>
    );
  }

  const senden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (laedt) return;
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(mail)) { toast("Bitte eine gültige E-Mail-Adresse eintragen."); return; }
    if (!einverstanden) { toast("Bitte der Datenschutzerklärung zustimmen."); return; }
    setLaedt(true);
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: mail, consent: true }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast(data?.error || "Eintragen hat nicht geklappt. Bitte später noch einmal."); return; }
      try { localStorage.setItem(KEY, JSON.stringify({ mail, seit: new Date().toISOString() })); } catch { /* egal */ }
      setEingetragen(mail);
      toast("Fast geschafft: Bitte den Link in der Bestätigungsmail anklicken.");
      setMail("");
    } catch {
      toast("Eintragen hat nicht geklappt. Bitte später noch einmal.");
    } finally {
      setLaedt(false);
    }
  };

  return (
    <form className={klein ? "wb-form wb-form--klein" : "wb-form reihe"} onSubmit={senden}>
      <input type="email" placeholder={klein ? "E-Mail" : "ihre@adresse.de"} aria-label="E-Mail für den Wochenbrief" value={mail} onChange={(e) => setMail(e.target.value)} disabled={laedt} />
      <button className={klein ? "wb-form__senden" : "btn btn--klein btn--primary"} type="submit" disabled={laedt}>{laedt ? "Sendet …" : klein ? "Abonnieren" : "Eintragen"}</button>
      <label className="wb-consent">
        <input type="checkbox" checked={einverstanden} onChange={(e) => setEinverstanden(e.target.checked)} />
        <span>Ich stimme der <a href="/datenschutz" data-faden-aus="" target="_blank" rel="noopener">Datenschutzerklärung</a> zu. Abmelden mit einem Klick in jeder Ausgabe.</span>
      </label>
    </form>
  );
}
