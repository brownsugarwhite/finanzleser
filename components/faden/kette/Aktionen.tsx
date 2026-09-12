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
import { LeoRede } from "@/components/faden/leo/Blase";
import { enthuellen, verbergen } from "@/lib/faden/aufklappen";

/* eslint-disable-next-line @typescript-eslint/no-unused-vars --
   `artikelId` trug nur das Vorlesen. Der Prop bleibt im Vertrag, weil das Vorlesen nur
   pausiert ist und die Aufrufer die Kennung weiter mitgeben. */
export default function Aktionen({ titel, url, kurzfassung, artikelId, pdf }: { titel: string; url: string; kurzfassung?: FadenKurzfassung; artikelId: string; pdf?: BeitragPdf | null }) {
  const { inDenKoffer, toast } = useFaden();
  const [kurz, setKurz] = useState(false);
  const kurzRef = useRef<HTMLDivElement>(null);
  // Aufklappen ist eine Bewegung nach unten, kein Sprung: Der Kasten wächst auf, und der
  // Blick hält seine Unterkante im Bild (Regel 3 des Scroll-Plans). Vorher rollte ein
  // weicher `scrollTo` die Kurzfassung unter den Kopf — ein Sprung mitten im Lesen.
  const umschalten = (auf: boolean) => {
    setKurz(auf);
    const el = kurzRef.current;
    if (!el) return;
    if (auf) enthuellen(el); else verbergen(el);
  };
  useEffect(() => {
    if (!kurzfassung) return;
    const h = () => umschalten(true);
    document.addEventListener("faden:kurzfassung", h);
    return () => document.removeEventListener("faden:kurzfassung", h);
  }, [kurzfassung]);
  const voll = `https://www.finanzleser.de${url}`;


  return (
    <>
      <div className="aktionen">
        {kurzfassung && <button type="button" className="btn btn--klein" onClick={() => umschalten(!kurz)} aria-expanded={kurz}>Kurzfassung von Leo</button>}
        <button type="button" className="textlink" onClick={(e) => teilenOeffnen(titel, voll, e.currentTarget)}>Teilen</button>
        <button type="button" className="textlink textlink--still" onClick={(e) => inDenKoffer(titel, e.currentTarget)}>In den Aktenkoffer</button>
        <button type="button" className="textlink textlink--still" onClick={() => toast("Wächter kommen mit Finanzleser Plus: Leo meldet sich, wenn sich ein Wert ändert.")}>Wächter setzen</button>
        {pdf && (
          <a className="textlink textlink--still" href={pdf.pdfUrl} target="_blank" rel="noopener noreferrer" download>PDF zum Beitrag</a>
        )}
        <button type="button" className="textlink textlink--still" onClick={() => kulissenOeffnen(url, titel)}>Das sieht Google</button>
      </div>
      {/* `hidden` setzen enthuellen/verbergen selbst — React soll es nicht bei jedem Render zurückschreiben. */}
      {kurzfassung && (
        <div className="wort wort--leo kurzfassung" hidden ref={kurzRef}>
          <span className="kicker kicker--gruen">Leo · Kurzfassung</span>
          <LeoRede>
            {kurzfassung.saetze.map((s, i) => <p key={i}>{s}</p>)}
            {kurzfassung.quellen.length > 0 && (
              <div className="quellen"><b>Quellen</b>{kurzfassung.quellen.map((q, j) => <span key={j}>› {q}</span>)}</div>
            )}
          </LeoRede>
        </div>
      )}
    </>
  );
}
