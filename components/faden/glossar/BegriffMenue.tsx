"use client";

/**
 * Klickmenü zu einem grünen Begriff im Text: Erklärung an Ort und Stelle, Ratgeber,
 * Werkzeug, die vorbereitete Leo-Frage, Verweis auf die eigene Seite. Ein Menü für die
 * ganze Hülle; die Daten kommen aus dem JSON des Kapitels oder aus /api/faden/glossar/<slug>.
 * Der Klick wird in der Capture-Phase abgefangen, damit der Klick-Abfang des Fadens nicht
 * navigiert; mit Strg/Cmd öffnet der Link wie gewohnt die eigene Seite.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useFaden } from "@/components/faden/FadenProvider";
import type { BegriffDaten } from "@/lib/faden/glossar";

interface Offen { slug: string; anker: HTMLElement; daten: BegriffDaten | null; zeige: "" | "erkl" | "antwort" }

export default function BegriffMenue() {
  const { begriffHolen, begriffMerken, toast } = useFaden();
  const pathname = usePathname();
  const [offen, setOffen] = useState<Offen | null>(null);
  const offenRef = useRef<Offen | null>(null);
  offenRef.current = offen;
  const ref = useRef<HTMLDivElement>(null);
  const [wurzel, setWurzel] = useState<HTMLElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number; pfeil: number; oben: boolean }>({ left: 0, top: 0, pfeil: 22, oben: false });

  useEffect(() => { setWurzel(document.querySelector<HTMLElement>(".faden-shell")); }, []);

  const schliessen = useCallback(() => {
    offenRef.current?.anker.classList.remove("offen");
    setOffen(null);
  }, []);

  // Klick auf einen grünen Begriff (Capture: läuft vor dem Klick-Abfang des Fadens).
  useEffect(() => {
    const h = (ev: MouseEvent) => {
      const b = (ev.target as Element | null)?.closest?.("a.begriff[data-b]") as HTMLElement | null;
      if (!b || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      ev.preventDefault();
      const slug = b.dataset.b || "";
      const aktuell = offenRef.current;
      if (aktuell?.anker === b) { schliessen(); return; }
      aktuell?.anker.classList.remove("offen");
      b.classList.add("offen");
      setOffen({ slug, anker: b, daten: null, zeige: "" });
      begriffMerken(slug, false);
      begriffHolen(slug).then((d) => setOffen((o) => (o && o.slug === slug && o.anker === b ? { ...o, daten: d } : o)));
    };
    document.addEventListener("click", h, true);
    return () => document.removeEventListener("click", h, true);
  }, [begriffHolen, begriffMerken, schliessen]);

  // Klick daneben, Escape, Seitenwechsel → zu.
  useEffect(() => {
    if (!offen) return;
    const klick = (ev: MouseEvent) => { const t = ev.target as Element | null; if (t && (ref.current?.contains(t) || t.closest("a.begriff"))) return; schliessen(); };
    const taste = (ev: KeyboardEvent) => { if (ev.key === "Escape") schliessen(); };
    document.addEventListener("click", klick);
    document.addEventListener("keydown", taste);
    return () => { document.removeEventListener("click", klick); document.removeEventListener("keydown", taste); };
  }, [offen, schliessen]);
  useEffect(() => { schliessen(); }, [pathname, schliessen]);

  // Position: unter dem Wort, bei Platzmangel darüber; Pfeil auf die Wortmitte.
  useLayoutEffect(() => {
    if (!offen || !ref.current || !wurzel) return;
    const r0 = offen.anker.getBoundingClientRect();
    const cr = wurzel.getBoundingClientRect();
    const breite = Math.min(320, window.innerWidth - 24);
    const links = Math.max(8, Math.min(window.innerWidth - breite - 8, r0.left + r0.width / 2 - 34));
    const mh = ref.current.offsetHeight;
    const kopf = document.getElementById("kopf")?.offsetHeight || 64;
    let top = r0.bottom + 10;
    let oben = false;
    if (r0.bottom + 10 + mh > window.innerHeight && r0.top - mh - 10 > kopf) { top = r0.top - mh - 10; oben = true; }
    setPos({ left: links - cr.left, top: top - cr.top, pfeil: Math.max(12, Math.min(breite - 24, r0.left + r0.width / 2 - links - 6)), oben });
  }, [offen, wurzel]);

  if (!offen || !wurzel) return null;
  const d = offen.daten;
  const zeige = (z: Offen["zeige"]) => setOffen((o) => (o ? { ...o, zeige: o.zeige === z ? "" : z } : o));
  const seite = d?.url || `/glossar/${offen.slug}`;
  return createPortal(
    <div ref={ref} className={"bmenu offen" + (pos.oben ? " oben" : "")} role="dialog" aria-label="Begriff" style={{ left: pos.left, top: pos.top, "--pfeil": `${pos.pfeil}px` } as CSSProperties}>
      <div className="bmenu__titel">{d ? d.titel : offen.anker.textContent}</div>
      <button type="button" className="zeile" onClick={() => { zeige("erkl"); begriffMerken(offen.slug, true); if (window.innerWidth < 1440) toast("Gemerkt: Glossar der Sitzung, Knopf „Glossar ✦“"); }}><i>📖</i>Begriffserklärung</button>
      {offen.zeige === "erkl" && <div className="erkl">{d ? d.erkl : "Lädt …"}{d?.quelle && <small> · Quelle: {d.quelle}</small>}</div>}
      {d?.ratgeber && <a className="zeile" href={d.ratgeber.href} onClick={schliessen}><i>📰</i>Ratgeber „{d.ratgeber.titel}“</a>}
      {d?.tool && <a className="zeile" href={d.tool.href} onClick={schliessen}><i className={`dot dot--${d.tool.typ}`} />{d.tool.titel}</a>}
      {d?.frage && <button type="button" className="zeile leo-zeile" onClick={() => zeige("antwort")}><span>„{d.frage}“</span><img src="/assets/leo.svg" alt="Leo fragen" /></button>}
      {offen.zeige === "antwort" && d && <div className="erkl"><b>Leo:</b> {d.antwort || "Die Antwort kommt mit Leo im nächsten Schritt."}{d.quelle && <small> · Quelle: {d.quelle}</small>}</div>}
      <a className="gemerkt" href={seite} onClick={schliessen}>Eigene Seite: {seite} · Erklärungen bleiben rechts unter „Glossar · Aktuelle Sitzung“</a>
    </div>,
    wurzel,
  );
}
