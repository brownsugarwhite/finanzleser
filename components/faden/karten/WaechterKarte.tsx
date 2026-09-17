"use client";

/**
 * Wächter-Karte (Port aus dem Prototyp, 05-js-neu.html waechterKarte()): Regeln aus dem
 * CMS als Schalter mit Glocke, Kanalwahl E-Mail/WhatsApp, Stand. Schalter liegen in diesem
 * Browser (lib/faden/waechter.ts); Benachrichtigungen kommen mit Finanzleser Plus.
 */
import { useRef, useState } from "react";
import type { WaechterRegel } from "@/lib/faden/optionen";
import { useWaechter } from "@/lib/faden/waechter";
import { useFaden } from "@/components/faden/FadenProvider";
import FadenIkon from "@/components/faden/FadenIkon";
import { nochmal } from "@/lib/faden/belohnung";

function wann(r: WaechterRegel): string {
  if (r.termin) return r.termin;
  if (r.stichtag) { const [m, t] = r.stichtag.split("-"); return `${t}.${m}.`; }
  return "";
}

export default function WaechterKarte({ regeln }: { regeln: WaechterRegel[] }) {
  const [stand, setzen] = useWaechter();
  const { toast } = useFaden();
  const [kanal, setKanal] = useState<"mail" | "wa">("mail");
  const glocken = useRef<Record<string, HTMLSpanElement | null>>({});
  const aktiv = regeln.filter((r) => stand[r.key]).length;
  return (
    <div className="waechter">
      <div className="waechter__liste">
        {regeln.map((r, i) => (
          <label key={r.key} className={"waechter__regel" + (stand[r.key] ? " an" : "")} style={{ animationDelay: `${i * 60}ms` }}>
            <span className="waechter__glocke" ref={(el) => { glocken.current[r.key] = el; }}><FadenIkon name="glocke" /></span>
            <span className="waechter__text"><b>{r.titel}</b><small>{r.regel}</small></span>
            <span className="waechter__wann">{wann(r)}</span>
            <span className="schalter">
              <input type="checkbox" checked={!!stand[r.key]} onChange={(e) => { setzen(r.key, e.target.checked); if (e.target.checked) nochmal(glocken.current[r.key], "laeutet"); }} aria-label={`${r.titel} ein/aus`} />
              <i />
            </span>
          </label>
        ))}
      </div>
      <div className="waechter__kanal">
        <span className="kicker">Wie soll ich Sie erreichen?</span>
        <div className="segment">
          <button type="button" className={kanal === "mail" ? "aktiv" : ""} onClick={() => { setKanal("mail"); toast("Wecker per E-Mail kommen mit Finanzleser Plus."); }}><FadenIkon name="mail" /> E-Mail</button>
          <button type="button" className={kanal === "wa" ? "aktiv" : ""} onClick={() => { setKanal("wa"); toast("Leo auf WhatsApp kommt mit Finanzleser Plus."); }}><FadenIkon name="flieger" /> WhatsApp</button>
        </div>
      </div>
      <p className="waechter__stand"><b>{aktiv} {aktiv === 1 ? "Wecker" : "Wecker"} aktiv.</b> Jeder einzeln abschaltbar, keine Nachricht ohne Anlass: eine Handvoll im Jahr.</p>
    </div>
  );
}
