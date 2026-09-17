"use client";

/**
 * Teilen als Zeitungsausriss (Port aus dem Prototyp, 05-js-neu.html teilenDialog()):
 * Link kopieren · WhatsApp · E-Mail · Drucken, unter dem auslösenden Knopf. Öffnen per
 * `teilenOeffnen(titel, url, anker)` von überall; schließt bei Klick daneben und Escape.
 */
import { useEffect, useRef, useState } from "react";
import { useFaden } from "./FadenProvider";

interface Teilen { titel: string; url: string; left: number; top: number }

export function teilenOeffnen(titel: string, url: string, anker: HTMLElement | null): void {
  document.dispatchEvent(new CustomEvent("faden:teilen", { detail: { titel, url, anker } }));
}

const IKON = {
  link: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5" /></svg>,
  flieger: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 3 3 10.5l7.5 3L13.5 21z" /><path d="M10.5 13.5 21 3" /></svg>,
  mail: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>,
  drucker: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 8V3h10v5M7 17H4v-6h16v6h-3" /><rect x="7" y="14" width="10" height="7" /></svg>,
};

export default function TeilenDialog() {
  const { toast } = useFaden();
  const [offen, setOffen] = useState<Teilen | null>(null);
  const [kopiert, setKopiert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (ev: Event) => {
      const { titel, url, anker } = (ev as CustomEvent<{ titel: string; url: string; anker: HTMLElement | null }>).detail;
      document.querySelectorAll(".teilen-anker").forEach((e) => e.classList.remove("teilen-anker"));
      const r = anker?.getBoundingClientRect() || { left: 16, bottom: 120 };
      const breite = 340;
      const left = Math.max(8, Math.min(window.innerWidth - breite - 8, r.left)) + window.scrollX;
      anker?.classList.add("teilen-anker");
      setKopiert(false);
      setOffen({ titel, url, left, top: r.bottom + window.scrollY + 8 });
    };
    document.addEventListener("faden:teilen", h);
    return () => document.removeEventListener("faden:teilen", h);
  }, []);

  useEffect(() => {
    if (!offen) return;
    const klick = (ev: MouseEvent) => {
      const z = ev.target as Element | null;
      if (ref.current && z && !ref.current.contains(z) && !z.closest?.(".teilen-anker")) setOffen(null);
    };
    const taste = (ev: KeyboardEvent) => { if (ev.key === "Escape") setOffen(null); };
    document.addEventListener("click", klick);
    document.addEventListener("keydown", taste);
    return () => { document.removeEventListener("click", klick); document.removeEventListener("keydown", taste); };
  }, [offen]);

  if (!offen) return null;
  const kopieren = async () => {
    try { await navigator.clipboard.writeText(offen.url); setKopiert(true); toast("Link kopiert: " + offen.url); }
    catch { toast(offen.url); }
  };
  const text = `${offen.titel} – ${offen.url}`;
  return (
    <div ref={ref} className="teilen-dialog offen" role="dialog" aria-label="Teilen" style={{ left: offen.left, top: offen.top }}>
      <div className="teilen__ausriss"><span className="kicker">finanzleser.de</span><b>{offen.titel}</b><small>{offen.url.replace("https://www.", "")}</small></div>
      <div className="teilen__wege">
        <button type="button" className={kopiert ? "gestempelt" : ""} onClick={kopieren}>{IKON.link}<span>Link kopieren</span></button>
        <button type="button" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener")}>{IKON.flieger}<span>WhatsApp</span></button>
        <button type="button" onClick={() => { location.href = `mailto:?subject=${encodeURIComponent(offen.titel)}&body=${encodeURIComponent(text)}`; }}>{IKON.mail}<span>E-Mail</span></button>
        <button type="button" onClick={() => { setOffen(null); setTimeout(() => window.print(), 50); }}>{IKON.drucker}<span>Drucken</span></button>
      </div>
    </div>
  );
}
