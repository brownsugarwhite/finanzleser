"use client";

/**
 * Aktionen unter dem Ratgeber: Kurzfassung von Leo (aus dem CMS, klappt auf),
 * Teilen (Ausriss-Dialog), In den Aktenkoffer (mit Flug), Wächter setzen (Stufe 2/3), Vorlesen,
 * PDF zum Beitrag (falls im CMS hinterlegt — ersetzt die PdfPreview der alten Seite),
 * Das sieht Google (Kulissen).
 */
import { useEffect, useRef, useState } from "react";
import type { FadenKurzfassung } from "@/lib/types";
import type { BeitragPdf } from "@/lib/articleToolData";
import { useFaden } from "@/components/faden/FadenProvider";
import { teilenOeffnen } from "@/components/faden/TeilenDialog";
import { kulissenOeffnen } from "@/components/faden/Kulissen";
import { LeoBlase } from "@/components/faden/leo/Blase";

export default function Aktionen({ titel, url, kurzfassung, artikelId, pdf }: { titel: string; url: string; kurzfassung?: FadenKurzfassung; artikelId: string; pdf?: BeitragPdf | null }) {
  const { inDenKoffer, toast } = useFaden();
  const [kurz, setKurz] = useState(false);
  const kurzRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!kurzfassung) return;
    const h = () => { setKurz(true); setTimeout(() => { const k = document.getElementById("kopf"); const el = kurzRef.current; if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (k ? k.offsetHeight : 64) - 16, behavior: "smooth" }); }, 50); };
    document.addEventListener("faden:kurzfassung", h);
    return () => document.removeEventListener("faden:kurzfassung", h);
  }, [kurzfassung]);
  const voll = `https://www.finanzleser.de${url}`;

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
        {/* Die eine Handlung, die der Leser am ehesten will, ist eine Pille; alles
            weitere ein Textlink mit Strich, der beim Zeigen wächst. */}
        <button type="button" className="pille" onClick={(e) => inDenKoffer(titel, e.currentTarget)}>
          <span>In den Aktenkoffer</span>
          <i className="pille__knopf"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 19h16" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></i>
        </button>
        {kurzfassung && <button type="button" className="strichlink" onClick={() => setKurz(!kurz)} aria-expanded={kurz}>Kurzfassung von Leo<i /></button>}
        <button type="button" className="strichlink" onClick={(e) => teilenOeffnen(titel, voll, e.currentTarget)}>Als Ausriss teilen<i /></button>
        <button type="button" className="strichlink strichlink--still" onClick={() => toast("Wächter kommen mit Finanzleser Plus: Leo meldet sich, wenn sich ein Wert ändert.")}>Wächter setzen<i /></button>
        <button type="button" className="strichlink strichlink--still" onClick={vorlesen}>Vorlesen<i /></button>
        {pdf && (
          <a className="strichlink strichlink--still" href={pdf.pdfUrl} target="_blank" rel="noopener noreferrer" download>PDF zum Beitrag<i /></a>
        )}
        <button type="button" className="strichlink strichlink--still" onClick={() => kulissenOeffnen(url, titel)}>Das sieht Google<i /></button>
      </div>
      {kurzfassung && (
        <div className="wort wort--leo kurzfassung" hidden={!kurz} ref={kurzRef}>
          <span className="kicker kicker--gruen">Leo · Kurzfassung</span>
          <LeoBlase>
            {kurzfassung.saetze.map((s, i) => <p key={i}>{s}</p>)}
            {kurzfassung.quellen.length > 0 && (
              <div className="quellen"><b>Quellen</b>{kurzfassung.quellen.map((q, j) => <span key={j}>› {q}</span>)}</div>
            )}
          </LeoBlase>
        </div>
      )}
    </>
  );
}
