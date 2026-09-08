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
        {kurzfassung && <button type="button" className="btn btn--klein" onClick={() => setKurz(!kurz)} aria-expanded={kurz}>Kurzfassung von Leo</button>}
        <button type="button" className="textlink" onClick={(e) => teilenOeffnen(titel, voll, e.currentTarget)}>Teilen</button>
        <button type="button" className="textlink textlink--still" onClick={(e) => inDenKoffer(titel, e.currentTarget)}>In den Aktenkoffer</button>
        <button type="button" className="textlink textlink--still" onClick={() => toast("Wächter kommen mit Finanzleser Plus: Leo meldet sich, wenn sich ein Wert ändert.")}>Wächter setzen</button>
        <button type="button" className="textlink textlink--still" onClick={vorlesen}>Vorlesen</button>
        {pdf && (
          <a className="textlink textlink--still" href={pdf.pdfUrl} target="_blank" rel="noopener noreferrer" download>PDF zum Beitrag</a>
        )}
        <button type="button" className="textlink textlink--still" onClick={() => kulissenOeffnen(url, titel)}>Das sieht Google</button>
      </div>
      {kurzfassung && (
        <div className="wort wort--leo kurzfassung" hidden={!kurz} ref={kurzRef}>
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
