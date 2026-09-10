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
import LeoChatSendButton from "@/components/ui/LeoChatSendButton";
import VersichererSelect from "@/components/ui/VersichererSelect";
import type { Versicherer } from "@/lib/versicherer";
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

/** Maße der Pille — 1:1 aus dem Leo-Chat der Live-Seite (components/ui/LeoIcon.tsx). */
const PILLE_RADIUS = 35;
/** Ab hier scrollt das Feld intern, statt weiter zu wachsen (Live: 66 px). */
const FELD_MAX = 66;

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
  // 🚨 Die Eingabe klebt fest am unteren Bildschirmrand (`position: fixed`), nicht mehr
  // `sticky` in #mitte — sticky stieg am Fadenende um die Höhe der Fußnote nach oben
  // (gemessen: Unterkante 775 statt 1000). Fest heißt aber: Sie weiß nichts mehr von der
  // Spalte, in der sie steht. Also wird die Mittelspalte gemessen und als Lage und Breite
  // mitgegeben; die eigene Höhe geht als `--eingabe-h` ans Dokument (Bodenabstand des
  // Stroms, Polster unter dem letzten Kapitel, Fußnote).
  const wurzel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wurzel.current;
    const mitte = document.getElementById("mitte");
    if (!el || !mitte) return;
    const messen = () => {
      const r = mitte.getBoundingClientRect();
      const st = getComputedStyle(mitte);
      const links = r.left + parseFloat(st.paddingLeft);
      const breite = r.width - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight);
      el.style.setProperty("--eingabe-links", `${Math.round(links)}px`);
      el.style.setProperty("--eingabe-breite", `${Math.round(breite)}px`);
      document.documentElement.style.setProperty("--eingabe-h", `${Math.round(el.offsetHeight)}px`);
    };
    messen();
    const ro = new ResizeObserver(messen);
    ro.observe(mitte);
    ro.observe(el);
    window.addEventListener("resize", messen);
    return () => { ro.disconnect(); window.removeEventListener("resize", messen); };
  }, []);
  const [wert, setWert] = useState("");
  const [index, setIndex] = useState<IndexEintrag[] | null>(indexAusCache());
  const [offen, setOffen] = useState(false);
  const [aktiv, setAktiv] = useState(-1);
  const wrap = useRef<HTMLDivElement>(null);
  const pille = useRef<HTMLFormElement>(null);
  const feld = useRef<HTMLTextAreaElement>(null);
  const [versicherer, setVersicherer] = useState<Versicherer | null>(null);
  const beschaeftigt = leo.status === "submitted" || leo.status === "streaming";
  // Auto-Grow wie im Leo-Chat der Live-Seite: Höhe an den Inhalt, dann interner Scroll.
  const wachsen = (ta: HTMLTextAreaElement) => { ta.style.height = "auto"; ta.style.height = `${Math.min(ta.scrollHeight, FELD_MAX)}px`; };
  useEffect(() => { if (feld.current) wachsen(feld.current); }, [wert]);

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
  const taste = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (ev.key === "Escape") { setOffen(false); setAktiv(-1); return; }
    // Enter sendet, Umschalt+Enter macht eine neue Zeile — wie im Leo-Chat der Live-Seite.
    if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); senden(ev); return; }
    if (!zeigeLeiste) return;
    if (ev.key === "ArrowDown") { ev.preventDefault(); setAktiv((a) => Math.min(a + 1, zeilen - 1)); }
    else if (ev.key === "ArrowUp") { ev.preventDefault(); setAktiv((a) => Math.max(a - 1, -1)); }
  };

  return (
    <div className={"eingabe" + (zeigeChips ? " mit-chips" : "")} ref={wurzel}>
      <div className="eingabe__blur" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><b /></div>
      <div className="suchpille-wrap" id="fadenPille" ref={wrap}>
        <FieldOutline radius={PILLE_RADIUS} gap={4} mess={pille} verankert="unten" />
        {/* 🚨 Die Pille klebt unten und macht nach OBEN auf (`column-reverse`): die
            Sprungleiste liegt im selben Kasten, der Kasten wächst nach oben, und der
            innere Ring fährt mit — wie in der Suche auf der Live-Seite, nur andersherum. */}
        <form ref={pille} onSubmit={senden} autoComplete="off" className={"suchpille" + (wert || beschaeftigt ? " hat-text" : "") + (zeigeLeiste ? " ist-offen" : "")}>
          <div className="suchpille__feld">
            <label className="sr" htmlFor="frage">Fragen Sie Leo oder springen Sie im Bestand</label>
            <textarea
              id="frage"
              ref={feld}
              rows={1}
              placeholder={beschaeftigt ? "Leo antwortet …" : "Sende Leo eine Nachricht ..."}
              autoComplete="off"
              value={wert}
              onChange={(e) => { setWert(e.target.value); wachsen(e.currentTarget); setOffen(true); setAktiv(-1); }}
              onFocus={() => setOffen(true)}
              onKeyDown={taste}
              aria-autocomplete="list"
              aria-expanded={zeigeLeiste}
            />
            <div className="suchpille__fuss">
              <VersichererSelect value={versicherer} onChange={setVersicherer} />
            </div>
            <button type="submit" className="suchpille__senden" aria-label={beschaeftigt ? "Antwort stoppen" : "Nachricht senden"}>
              <LeoChatSendButton status={beschaeftigt ? "streaming" : "ready"} />
            </button>
          </div>
          <div className="suchpille__leiste" aria-hidden={!zeigeLeiste}>
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
          </div>
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
