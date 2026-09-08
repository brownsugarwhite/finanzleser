"use client";

/**
 * Aktionen unter dem Ratgeber: Kurzfassung von Leo (aus dem CMS, klappt auf),
 * Teilen, In den Aktenkoffer, Wächter setzen (Stufe 2/3), Vorlesen.
 */
import { useState } from "react";
import type { FadenKurzfassung } from "@/lib/types";
import { useFaden } from "@/components/faden/FadenProvider";

export default function Aktionen({ titel, url, kurzfassung, artikelId }: { titel: string; url: string; kurzfassung?: FadenKurzfassung; artikelId: string }) {
  const { inDenKoffer, toast } = useFaden();
  const [kurz, setKurz] = useState(false);
  const voll = `https://www.finanzleser.de${url}`;

  const teilen = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: titel, url: voll }); return; }
      await navigator.clipboard.writeText(voll);
      toast("Adresse kopiert: " + voll);
    } catch { /* abgebrochen */ }
  };
  const vorlesen = () => {
    if (!("speechSynthesis" in window)) { toast("Vorlesen wird von diesem Browser nicht unterstützt."); return; }
    if (window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); return; }
    const art = document.getElementById(artikelId);
    const text = art ? (art as HTMLElement).innerText.slice(0, 6000) : titel;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE";
    window.speechSynthesis.speak(u);
    toast("Vorlesen gestartet. Noch einmal tippen stoppt.");
  };

  return (
    <>
      <div className="aktionen">
        {kurzfassung && <button type="button" className="btn btn--klein" onClick={() => setKurz(!kurz)} aria-expanded={kurz}>Kurzfassung von Leo</button>}
        <button type="button" className="textlink" onClick={teilen}>Ratgeber teilen</button>
        <button type="button" className="textlink textlink--still" onClick={() => inDenKoffer(titel)}>In den Aktenkoffer</button>
        <button type="button" className="textlink textlink--still" onClick={() => toast("Wächter kommen mit Finanzleser Plus: Leo meldet sich, wenn sich ein Wert ändert.")}>Wächter setzen</button>
        <button type="button" className="textlink textlink--still" onClick={vorlesen}>Vorlesen</button>
      </div>
      {kurzfassung && (
        <div className="wort wort--leo kurzfassung" hidden={!kurz}>
          <img src="/assets/leo.svg" alt="Leo" />
          <div>
            <span className="kicker kicker--gruen">Leo · Kurzfassung</span>
            {kurzfassung.saetze.map((s, i) => <p key={i}>{s}</p>)}
            {kurzfassung.quellen.length > 0 && (
              <div className="quellen"><b>Quellen</b>{kurzfassung.quellen.map((q, j) => <span key={j}>› {q}</span>)}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
