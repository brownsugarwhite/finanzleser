"use client";

/**
 * Die Eingabe am unteren Rand: Suchpille „Was kann ich für Sie tun?“ mit Sprungleiste.
 * Ab zwei Zeichen zeigt die Leiste Treffer aus dem Bestand (Ratgeber, Rubriken, Themen,
 * Werkzeuge, Begriffe; Wortanfang zuerst), die letzte Zeile fragt Leo. Enter ohne
 * gewählten Treffer fragt Leo; Pfeiltasten wählen, Escape schließt.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { flugZu, reduzierteBewegung } from "@/lib/faden/belohnung";
import { useFaden } from "./FadenProvider";
import { zuAbschnitt } from "./RandLinks";
import FieldOutline from "@/components/ui/FieldOutline";
import type { IndexEintrag } from "@/lib/faden/index";
import { holeIndex, indexAusCache } from "@/lib/faden/indexClient";

const TYP_LABEL: Record<IndexEintrag["typ"], string> = { ratgeber: "Ratgeber", rubrik: "Rubrik", thema: "Thema", rechner: "Rechner", vergleich: "Vergleich", checkliste: "Checkliste", dokumente: "Dokument", begriff: "Begriff", seite: "Seite", spiel: "Spiel" };
const RANG: Record<IndexEintrag["typ"], number> = { ratgeber: 0, rubrik: 1, thema: 1, rechner: 2, vergleich: 2, checkliste: 2, dokumente: 2, begriff: 3, seite: 1, spiel: 2 };

function normal(s: string): string {
  return s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
}

export function sucheImIndex(index: IndexEintrag[], q: string, max = 8): IndexEintrag[] {
  const n = normal(q.trim());
  if (n.length < 2) return [];
  const bewertet: { e: IndexEintrag; s: number }[] = [];
  for (const e of index) {
    const t = normal(e.titel);
    let s = -1;
    if (t.startsWith(n)) s = 0;
    else if (t.includes(" " + n) || t.includes("-" + n)) s = 1;
    else if (t.includes(n)) s = 2;
    else if (e.unter && normal(e.unter).includes(n)) s = 3;
    if (s < 0) continue;
    bewertet.push({ e, s: s * 10 + RANG[e.typ] });
  }
  return bewertet.sort((a, b) => a.s - b.s || a.e.titel.localeCompare(b.e.titel, "de")).slice(0, max).map((x) => x.e);
}

/** Chip unter der Eingabe: Frage an Leo, Adresse, Anker im Kapitel oder ein Ereignis (etwa die Kurzfassung aufklappen). */
interface EingabeChip { text: string; frage?: string; href?: string; anker?: string; ereignis?: string }

export default function Eingabe() {
  const { navigieren, fragen, leo } = useFaden();
  const pathname = usePathname();
  const [chips, setChips] = useState<EingabeChip[]>([]);
  const [endeImBild, setEndeImBild] = useState(false);
  // Vorschläge kommen aus dem lebenden Kapitel (script[data-eingabe-chips]); sichtbar nur, wenn das Ende des Fadens im Bild ist.
  useEffect(() => {
    let liste: EingabeChip[] = [];
    try { const sc = document.querySelector("#kapitel-live script[data-eingabe-chips]"); if (sc) liste = JSON.parse(sc.textContent || "[]"); } catch { /* keine Chips */ }
    setChips(Array.isArray(liste) ? liste.slice(0, 6) : []);
    const ende = document.getElementById("strom-ende");
    if (!ende || !("IntersectionObserver" in window)) { setEndeImBild(true); return; }
    const io = new IntersectionObserver(([e]) => setEndeImBild(e.isIntersecting), { rootMargin: "0px 0px -60px 0px" });
    io.observe(ende);
    return () => io.disconnect();
  }, [pathname]);
  const zeigeChips = chips.length > 0 && endeImBild && !leo.nachrichten.length;
  const [wert, setWert] = useState("");
  const [index, setIndex] = useState<IndexEintrag[] | null>(indexAusCache());
  const [offen, setOffen] = useState(false);
  const [aktiv, setAktiv] = useState(-1);
  const wrap = useRef<HTMLDivElement>(null);
  const beschaeftigt = leo.status === "submitted" || leo.status === "streaming";

  useEffect(() => {
    if (wert.trim().length < 2 || index) return;
    let lebt = true;
    holeIndex().then((i) => { if (lebt) setIndex(i); });
    return () => { lebt = false; };
  }, [wert, index]);

  const treffer = useMemo(() => (index && wert.trim().length >= 2 ? sucheImIndex(index, wert) : []), [index, wert]);
  const zeigeLeiste = offen && wert.trim().length >= 2;
  const zeilen = treffer.length + 1; // + „Leo fragen“

  useEffect(() => {
    if (!zeigeLeiste) return;
    const klick = (ev: MouseEvent) => { if (!wrap.current?.contains(ev.target as Node)) setOffen(false); };
    document.addEventListener("click", klick);
    return () => document.removeEventListener("click", klick);
  }, [zeigeLeiste]);

  const leoFragen = (q: string) => {
    const t = q.trim(); if (!t) return;
    // „Frage steigt auf“ (Prototyp 05-js-neu.html): die Frage fliegt von der Zeile zur Blase im Faden.
    const inp = document.getElementById("frage");
    const r = inp?.getBoundingClientRect();
    const start = inp && r && r.top > 0 && r.bottom < window.innerHeight && !reduzierteBewegung() ? inp : null;
    setWert(""); setOffen(false); setAktiv(-1); fragen(t);
    if (!start) return;
    const t0 = performance.now();
    const suche = () => {
      const blasen = document.querySelectorAll<HTMLElement>("#leo-strom .wort--frage .blase--frage");
      const b = blasen[blasen.length - 1];
      if (b && (b.textContent || "").includes(t) && !b.dataset.geflogen) {
        b.dataset.geflogen = "1"; b.style.opacity = "0";
        flugZu(start, b, t, "flug-frage").then(() => { b.style.transition = "opacity .25s"; b.style.opacity = "1"; });
      } else if (performance.now() - t0 < 900) requestAnimationFrame(suche);
    };
    requestAnimationFrame(suche);
  };
  const waehlen = (e: IndexEintrag) => { setWert(""); setOffen(false); setAktiv(-1); navigieren(e.href); };
  const senden = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (beschaeftigt) { leo.stop(); return; }
    if (zeigeLeiste && aktiv >= 0 && aktiv < treffer.length) { waehlen(treffer[aktiv]); return; }
    leoFragen(wert);
  };
  const taste = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === "Escape") { setOffen(false); setAktiv(-1); return; }
    if (!zeigeLeiste) return;
    if (ev.key === "ArrowDown") { ev.preventDefault(); setAktiv((a) => Math.min(a + 1, zeilen - 1)); }
    else if (ev.key === "ArrowUp") { ev.preventDefault(); setAktiv((a) => Math.max(a - 1, -1)); }
  };

  return (
    <div className={"eingabe" + (zeigeChips ? " mit-chips" : "")}>
      <div className="eingabe__blur" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><b /></div>
      <div className="suchpille-wrap" id="fadenPille" ref={wrap}>
        <FieldOutline radius={26} gap={4} />
        {zeigeLeiste && (
          <div className="sprung" id="sprung" role="listbox" aria-label="Sprungleiste">
            <div className="sprung__kopf">{treffer.length ? "Im Bestand" : index ? "Nichts Passendes im Bestand" : "Bestand wird geladen …"}</div>
            {treffer.map((e, i) => (
              <button key={e.href + e.typ} type="button" role="option" aria-selected={i === aktiv} className={i === aktiv ? "aktiv" : ""} onMouseEnter={() => setAktiv(i)} onClick={() => waehlen(e)}>
                <span className="typ">{TYP_LABEL[e.typ]}</span><span>{e.titel}</span>{e.unter && <span className="unter">{e.unter}</span>}
              </button>
            ))}
            <button type="button" role="option" aria-selected={aktiv === treffer.length} className={"frage" + (aktiv === treffer.length ? " aktiv" : "")} onMouseEnter={() => setAktiv(treffer.length)} onClick={() => leoFragen(wert)}>
              Leo fragen: „{wert.trim()}“
            </button>
          </div>
        )}
        <form onSubmit={senden} autoComplete="off" className={"suchpille" + (wert || beschaeftigt ? " hat-text" : "")}>
          <label className="sr" htmlFor="frage">Fragen Sie Leo oder springen Sie im Bestand</label>
          <input id="frage" type="text" placeholder={beschaeftigt ? "Leo antwortet …" : "Was kann ich für Sie tun?"} autoComplete="off" value={wert} onChange={(e) => { setWert(e.target.value); setOffen(true); setAktiv(-1); }} onFocus={() => setOffen(true)} onKeyDown={taste} aria-autocomplete="list" aria-expanded={zeigeLeiste} />
          <button type="submit" className="senden">{beschaeftigt ? "Stopp" : "Fragen"}</button>
        </form>
      </div>
      {chips.length > 0 && (
        <div className="chips" id="eingabeChips">
          {chips.map((c) => <button key={c.text} type="button" className="chip" onClick={() => { if (c.frage) fragen(c.frage); else if (c.anker) zuAbschnitt(c.anker); else if (c.ereignis) document.dispatchEvent(new Event(c.ereignis)); else if (c.href) navigieren(c.href); }}>{c.text}</button>)}
        </div>
      )}
    </div>
  );
}
