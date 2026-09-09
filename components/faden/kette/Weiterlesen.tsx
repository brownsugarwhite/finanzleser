"use client";

/**
 * „Dazu wird oft gefragt“ am Ende eines Fachabschnitts: die Leo-Fragen aus dem CMS
 * (leo_fragen) als Chips; die Antwort klappt an Ort und Stelle auf. Antworten stehen
 * vollständig im SSR-HTML (indexierbar), nur ausgeblendet.
 */
import { useState } from "react";
import type { FadenFrage } from "@/lib/types";
import { FrageBlase, LeoBlase } from "@/components/faden/leo/Blase";

export default function Weiterlesen({ fragen }: { fragen: FadenFrage[] }) {
  const [offen, setOffen] = useState<number | null>(null);
  return (
    <div className="weiterlesen">
      <span className="kicker kicker--gruen">Dazu wird oft gefragt</span>
      <div className="fragen">
        {fragen.map((f, i) => (
          <button key={i} type="button" className={"chip chip--leo" + (offen === i ? " gewaehlt" : "")} onClick={() => setOffen(offen === i ? null : i)} aria-expanded={offen === i}>
            {f.frage}
          </button>
        ))}
      </div>
      {fragen.map((f, i) => (
        <div key={i} className="antwort" hidden={offen !== i}>
          <div className="wort wort--frage"><FrageBlase><p>{f.frage}</p></FrageBlase></div>
          <div className="wort wort--leo">
            <span className="kicker kicker--gruen">Leo</span>
            <LeoBlase>
              <p>{f.antwort}</p>
              {f.quellen.length > 0 && (
                <div className="quellen"><b>Quellen</b>{f.quellen.map((q, j) => <span key={j}>› {q}</span>)}</div>
              )}
            </LeoBlase>
          </div>
        </div>
      ))}
    </div>
  );
}
