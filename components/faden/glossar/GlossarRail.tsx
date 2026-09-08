"use client";

/**
 * Glossar der Sitzung in der rechten Randspalte: jeder angetippte Begriff bleibt hier,
 * neueste oben, einer aufgeklappt. Daten aus dem Kapitel-JSON oder der Begriffs-Route.
 */
import { useEffect, useState } from "react";
import { useFaden } from "@/components/faden/FadenProvider";
import type { BegriffDaten } from "@/lib/faden/glossar";

const LABEL: Record<string, string> = { rechner: "Rechner", checkliste: "Checkliste", vergleich: "Vergleich", dokumente: "Dokument" };

export default function GlossarRail() {
  const { glossarSitzung, glossarOffen, begriffAufklappen, begriffEntfernen, begriffHolen } = useFaden();
  const [daten, setDaten] = useState<Record<string, BegriffDaten | null>>({});

  useEffect(() => {
    glossarSitzung.forEach((s) => {
      if (daten[s] !== undefined) return;
      begriffHolen(s).then((d) => setDaten((alt) => (alt[s] === undefined ? { ...alt, [s]: d } : alt)));
    });
  }, [glossarSitzung, begriffHolen, daten]);

  if (!glossarSitzung.length) {
    return <span className="rand__leer">Tippen Sie im Text auf einen <span className="begriff" style={{ cursor: "default" }}>grünen Begriff</span>. Die Erklärung landet hier und bleibt für diese Sitzung.</span>;
  }
  return (
    <>
      {glossarSitzung.map((s) => {
        const d = daten[s];
        const offen = glossarOffen === s;
        return (
          <div key={s} className={"eintrag-g" + (offen ? " offen" : "")} data-k={s}>
            <button type="button" onClick={() => begriffAufklappen(offen ? null : s)} aria-expanded={offen}><span>{d?.titel || s}</span><i>+</i></button>
            <div className="erkl">
              {d ? d.erkl : "…"}
              {d?.quelle && <small className="quelle"> Quelle: {d.quelle}</small>}
              <div className="mehr">
                {d?.ratgeber && <a className="textlink" href={d.ratgeber.href}>Ratgeber</a>}
                {d?.tool && <a className="textlink" href={d.tool.href}>{LABEL[d.tool.typ] || "Werkzeug"}</a>}
                <a className="textlink textlink--still" href={d?.url || `/glossar/${s}`}>Leo fragen</a>
                <button type="button" className="textlink textlink--still" onClick={() => begriffEntfernen(s)}>Entfernen</button>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
