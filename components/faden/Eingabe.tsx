"use client";

/**
 * Die Eingabe am unteren Rand: Suchpille „Was kann ich für Sie tun?“. Bis Leo
 * (Meilenstein 5) angeschlossen ist, führt Enter auf die bestehende Suche.
 * Die Sprungleiste (Typeahead über den Bestand) kommt ebenfalls mit M5.
 */
import { useState } from "react";
import { useFaden } from "./FadenProvider";

export default function Eingabe() {
  const { navigieren } = useFaden();
  const [wert, setWert] = useState("");
  const senden = (e: React.FormEvent) => {
    e.preventDefault();
    const q = wert.trim();
    if (!q) return;
    setWert("");
    navigieren(`/suche?q=${encodeURIComponent(q)}`);
  };
  return (
    <div className="eingabe">
      <div className="eingabe__blur" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><b /></div>
      <div className="suchpille-wrap" id="fadenPille">
        <form onSubmit={senden} autoComplete="off" className={"suchpille" + (wert ? " hat-text" : "")}>
          <label className="sr" htmlFor="frage">Fragen Sie Leo oder suchen Sie im Bestand</label>
          <input id="frage" type="text" placeholder="Was kann ich für Sie tun?" autoComplete="off" value={wert} onChange={(e) => setWert(e.target.value)} />
          <button type="submit" className="senden">Fragen</button>
        </form>
      </div>
      <div className="chips" id="eingabeChips" />
    </div>
  );
}
