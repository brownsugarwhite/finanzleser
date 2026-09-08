"use client";

/**
 * Lebensereignis-Karte (Port aus dem Prototyp, 05-js-neu.html ereignisKarte()): Phasen als
 * Zeitleiste mit abhakbaren Schritten und Chips zu Rechner, Checkliste, Vergleich oder
 * Ratgeber; darunter Wecker (Wächter-Regeln, die zu den Schritten passen). Haken bleiben in
 * diesem Browser (localStorage `faden-ereignis-<key>`); alles abgehakt bringt Punkte + Wappen.
 */
import { useEffect, useRef, useState } from "react";
import type { Lebensereignis, WaechterRegel } from "@/lib/faden/optionen";
import { useWaechter } from "@/lib/faden/waechter";
import { useFaden } from "@/components/faden/FadenProvider";
import FadenIkon from "@/components/faden/FadenIkon";

export interface EreignisZiel { href: string; titel: string }

export default function EreignisKarte({ ereignis, ziele, regeln, vorspann }: { ereignis: Lebensereignis; ziele: Record<string, EreignisZiel>; regeln: WaechterRegel[]; vorspann?: string }) {
  const { belohne, navigieren } = useFaden();
  const [stand, setzen] = useWaechter();
  const KEY = `faden-ereignis-${ereignis.key}`;
  const [haken, setHaken] = useState<Record<string, boolean>>({});
  const [belohnt, setBelohnt] = useState(false);
  const wurzel = useRef<HTMLDivElement>(null);
  const alle = ereignis.phasen.flatMap((p, i) => p.schritte.map((s, j) => `${i}-${j}`));

  useEffect(() => {
    try {
      const roh = JSON.parse(localStorage.getItem(KEY) || "null");
      if (roh && typeof roh === "object") { setHaken(roh.haken || {}); setBelohnt(!!roh.belohnt); }
    } catch { /* leer */ }
  }, [KEY]);

  const toggle = (id: string) => {
    setHaken((alt) => {
      const neu = { ...alt, [id]: !alt[id] };
      const fertig = alle.every((k) => neu[k]);
      let b = belohnt;
      if (fertig && !belohnt) { b = true; setBelohnt(true); belohne(20, wurzel.current?.closest<HTMLElement>(".kasten") || wurzel.current, { wappen: ereignis.wappen }); }
      try { localStorage.setItem(KEY, JSON.stringify({ haken: neu, belohnt: b })); } catch { /* egal */ }
      return neu;
    });
  };

  const slugs = new Set(ereignis.phasen.flatMap((p) => p.schritte.map((s) => s.slug)));
  const passende = regeln.filter((r) => r.links?.some((l) => slugs.has(l.slug)));
  const wecker = passende.length ? passende : regeln.slice(0, 3);
  const erledigt = alle.filter((k) => haken[k]).length;

  return (
    <div className="ereignis" ref={wurzel}>
      {vorspann && <p className="ereignis__vorspann">{vorspann}</p>}
      <div className="zeitleiste">
        {ereignis.phasen.map((p, i) => (
          <div key={p.titel} className="phase">
            <span className="phase__titel">{p.titel}</span>
            {p.schritte.map((s, j) => {
              const id = `${i}-${j}`;
              const z = ziele[`${s.typ}:${s.slug}`];
              return (
                <label key={id} className="schritt" style={{ animationDelay: `${(i * 3 + j) * 60}ms` }}>
                  <input type="checkbox" checked={!!haken[id]} onChange={() => toggle(id)} />
                  <span className={haken[id] ? "erledigt" : ""}>{s.text}</span>
                  {z && <button type="button" className="chip chip--still" onClick={(e) => { e.preventDefault(); navigieren(z.href); }}>{z.titel}</button>}
                </label>
              );
            })}
          </div>
        ))}
      </div>
      <p className="ereignis__stand"><b>{erledigt} von {alle.length}</b> Schritten erledigt.{belohnt ? " Wappen und Punkte sind gutgeschrieben." : ""}</p>
      {wecker.length > 0 && (
        <div className="ereignis__waechter">
          <span className="kicker"><FadenIkon name="glocke" /> Wecker für Sie</span>
          {wecker.map((r) => (
            <label key={r.key} className="schalter-zeile">
              <span className="schalter"><input type="checkbox" checked={!!stand[r.key]} onChange={(e) => setzen(r.key, e.target.checked)} aria-label={r.titel} /><i /></span>
              <span><b>{r.titel}</b> · {r.regel}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
