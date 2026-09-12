"use client";

/**
 * „Leo fragt“ (rechte Randspalte, Port aus dem Prototyp 03-js-core.html): Leo kommt von
 * sich aus ins Gespräch, wenn das lebende Kapitel zu einer Lebenslage passt (Haftpflicht,
 * Kinder, Hund, …). Der Kasten sitzt im Fuß der Leiste über der Anzeige (#leoFrage),
 * mit Regler oder Chips und „Später ✕“; die Antwort erscheint immer unten im Faden
 * (Regler → fragen(), Chips → navigieren()). Danach ein kurzer Danke-Kasten.
 * Jede Frage höchstens einmal je Sitzung (sessionStorage), Timer nur bei sichtbarer Seite.
 * Die Fragen kommen aus dem CMS über /api/faden/leo-fragt, einmal je Sitzung geladen.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useFaden } from "@/components/faden/FadenProvider";
import type { FadenZiel, LeoFragtEintrag } from "@/lib/faden/optionen";

const GEZEIGT_KEY = "faden-leo-fragt-gezeigt";
const CACHE_KEY = "faden-leo-fragt";
const STANDARD_SEKUNDEN = 15;
const DANKE_MS = 5000;
const DANKE_MIT_LINK_MS = 8000;
const LEO = "/assets/leo.svg";
const DANKE_TEXT = "Danke. Meine Antwort steht unten im Faden.";
const DANKE_HINWEIS = "Der Faden ist dorthin gesprungen.";
// Nur nach navigieren(): das merkt die Lesestelle (FadenProvider), fragen() nicht.
const DANKE_HINWEIS_ZURUECK = "Der Faden ist dorthin gesprungen. „Zurück zur Lesestelle“ oben bringt Sie zurück.";
const ZUM: Record<string, string> = { vergleich: "Zum Vergleich", rechner: "Zum Rechner", checkliste: "Zur Checkliste", post: "Zum Ratgeber", dokumente: "Zum Dokument", dokument: "Zum Dokument", glossar: "Zum Begriff", begriff: "Zum Begriff" };

type Chip = NonNullable<LeoFragtEintrag["chips"]>[number];

let cache: LeoFragtEintrag[] | null = null;
let laedt: Promise<LeoFragtEintrag[]> | null = null;

/** Liste einmal je Sitzung: Modul-Cache, dann sessionStorage, dann die ISR-Route. */
function holeFragen(): Promise<LeoFragtEintrag[]> {
  if (cache) return Promise.resolve(cache);
  try {
    const roh = sessionStorage.getItem(CACHE_KEY);
    if (roh) { cache = JSON.parse(roh) as LeoFragtEintrag[]; return Promise.resolve(cache); }
  } catch { /* kein sessionStorage */ }
  if (!laedt) {
    laedt = fetch("/api/faden/leo-fragt")
      .then((r) => { if (!r.ok) throw new Error(`leo-fragt: HTTP ${r.status}`); return r.json(); })
      .then((j: { fragen?: LeoFragtEintrag[] }) => {
        const liste = Array.isArray(j.fragen) ? j.fragen : [];
        if (liste.length) { // eine leere oder fehlgeschlagene Antwort nicht für die Sitzung einfrieren
          cache = liste;
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(liste)); } catch { /* egal */ }
        }
        return liste;
      })
      .catch(() => { laedt = null; return []; });
  }
  return laedt;
}

function gezeigte(): string[] {
  try { const l = JSON.parse(sessionStorage.getItem(GEZEIGT_KEY) || "[]"); return Array.isArray(l) ? l : []; } catch { return []; }
}
function merkeGezeigt(key: string): void {
  const l = gezeigte();
  if (l.includes(key)) return;
  l.push(key);
  try { sessionStorage.setItem(GEZEIGT_KEY, JSON.stringify(l)); } catch { /* egal */ }
}

/**
 * Frage, die zum lebenden Kapitel passt: ausloeser.wert (klein) als Teilstring in data-key,
 * data-pfad, data-titel oder den Krumen-Hrefs. Nur Lebenslagen; die erste noch nicht
 * gestellte gewinnt (Reihenfolge = Rang aus dem CMS, wie FRAGE_NACH im Prototyp).
 */
function passendeFrage(fragen: LeoFragtEintrag[]): LeoFragtEintrag | null {
  const live = document.getElementById("kapitel-live");
  if (!live) return null;
  const krumen = Array.from(live.querySelectorAll<HTMLAnchorElement>(".krumen a")).map((a) => a.getAttribute("href") || "");
  const heu = [live.dataset.key, live.dataset.pfad, live.dataset.titel, ...krumen].filter(Boolean).join(" ").toLowerCase();
  const schon = gezeigte();
  for (const f of fragen) {
    if (f.ausloeser?.art !== "lebenslage" || !f.ausloeser.wert || schon.includes(f.key)) continue;
    if (!(f.art === "chips" ? f.chips?.length : f.regler)) continue;
    if (heu.includes(f.ausloeser.wert.toLowerCase())) return f;
  }
  return null;
}

function mitParam(href: string, param?: FadenZiel["param"]): string {
  if (!param) return href;
  const u = new URL(href, location.origin);
  for (const [k, v] of Object.entries(param)) u.searchParams.set(k, String(v));
  return u.pathname + u.search + u.hash;
}

function zahl(n: number): string { return n.toLocaleString("de-DE"); }

interface Danke { text: string; hinweis?: string; link?: { href: string; text: string } }
interface Offen { frage: LeoFragtEintrag; phase: "frage" | "danke"; danke?: Danke }

/**
 * `vorgabe` ist der Zugang für den Schaukasten (app/schaukasten): eine feste Frage,
 * sofort offen, ohne Abruf und ohne Auslöser. So zeigt der Schaukasten die ECHTE
 * Komponente statt eines Nachbaus — im Betrieb bleibt der Weg über das CMS derselbe.
 */
export default function LeoFragt({ vorgabe }: { vorgabe?: LeoFragtEintrag } = {}) {
  const { fragen: anLeo, navigieren } = useFaden();
  const pathname = usePathname();
  const [fragen, setFragen] = useState<LeoFragtEintrag[] | null>(cache);
  const [offen, setOffen] = useState<Offen | null>(null);
  const [wert, setWert] = useState(0);
  const offenRef = useRef(false); // wie leoFrageOffen im Prototyp: höchstens ein Kasten
  const dankeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (vorgabe) return; // feste Frage: nichts abrufen
    let lebt = true;
    holeFragen().then((l) => { if (lebt) setFragen(l); });
    return () => { lebt = false; if (dankeTimer.current) clearTimeout(dankeTimer.current); };
  }, [vorgabe]);

  const weg = useCallback(() => {
    if (dankeTimer.current) { clearTimeout(dankeTimer.current); dankeTimer.current = null; }
    offenRef.current = false;
    setOffen(null);
  }, []);

  const zeigen = useCallback((f: LeoFragtEintrag) => {
    merkeGezeigt(f.key); // „Später ✕“ zählt ebenso als gezeigt
    offenRef.current = true;
    setWert(f.regler?.wert ?? f.regler?.min ?? 0);
    setOffen({ frage: f, phase: "frage" });
  }, []);

  const danke = useCallback((f: LeoFragtEintrag, d: Danke, ms: number) => {
    setOffen({ frage: f, phase: "danke", danke: d });
    if (dankeTimer.current) clearTimeout(dankeTimer.current);
    dankeTimer.current = setTimeout(weg, ms);
  }, [weg]);

  useEffect(() => { if (vorgabe) zeigen(vorgabe); }, [vorgabe, zeigen]);

  // Auslöser: nach jedem Kapitelwechsel prüfen, ob eine Frage passt; der Timer läuft nur,
  // solange die Seite sichtbar ist, und beginnt nach dem Zurückkommen von vorn.
  useEffect(() => {
    if (!fragen?.length || offenRef.current) return;
    const f = passendeFrage(fragen);
    if (!f) return;
    let ms = (f.ausloeser.nach_sekunden || STANDARD_SEKUNDEN) * 1000;
    if (process.env.NODE_ENV === "development" && /[?&]leofragt=schnell(&|$)/.test(location.search)) ms = 1000;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const stopp = () => { if (timer) { clearTimeout(timer); timer = null; } };
    const start = () => {
      stopp();
      if (document.visibilityState !== "visible") return;
      timer = setTimeout(() => { timer = null; if (!offenRef.current && !gezeigte().includes(f.key)) zeigen(f); }, ms);
    };
    document.addEventListener("visibilitychange", start);
    start();
    return () => { stopp(); document.removeEventListener("visibilitychange", start); };
  }, [fragen, pathname, zeigen]);

  const antworten = () => {
    if (!offen) return;
    const f = offen.frage;
    anLeo((f.antwort_vorlage || "{wert}").replace(/\{wert\}/g, zahl(wert)));
    const link = f.ziel?.href ? { href: f.ziel.href, text: ZUM[f.ziel.typ] || "Weiter" } : undefined;
    danke(f, { text: DANKE_TEXT, hinweis: DANKE_HINWEIS, link }, link ? DANKE_MIT_LINK_MS : DANKE_MS);
  };

  const chipWaehlen = (chip: Chip) => {
    if (!offen) return;
    const f = offen.frage;
    const z = chip.ziel;
    if (z?.href) {
      danke(f, { text: DANKE_TEXT, hinweis: DANKE_HINWEIS_ZURUECK }, DANKE_MS);
      navigieren(mitParam(z.href, z.param));
    } else {
      // „keins“ oder ein Ziel ohne Adresse im Faden (Kassensturz, WhatsApp, Wochenbrief): nur danken.
      danke(f, { text: "Danke, notiert." }, DANKE_MS);
    }
  };

  if (!offen) return <div id="leoFrage" hidden />;
  const f = offen.frage;

  if (offen.phase === "danke") {
    const d = offen.danke;
    const link = d?.link;
    return (
      <div id="leoFrage">
        <div className="leo-frage leo-frage--danke">
          <div className="kopf-f"><img src={LEO} alt="" /><span className="kicker kicker--gruen">Leo</span></div>
          <p>{d?.text}</p>
          {d?.hinweis && <span className="hinweis-f"><i>↓</i> {d.hinweis}</span>}
          {link && <a className="textlink" href={link.href} onClick={(e) => { e.preventDefault(); weg(); navigieren(link.href); }}>{link.text} →</a>}
        </div>
      </div>
    );
  }

  const r = f.regler;
  const einheit = r?.einheit ?? "";
  return (
    <div id="leoFrage">
      <div className="leo-frage" role="group" aria-label="Leo fragt">
        <div className="kopf-f"><img src={LEO} alt="" /><span className="kicker kicker--gruen">Leo fragt</span></div>
        <p>{f.text}</p>
        <button type="button" className="spaeter" onClick={weg}>Später ✕</button>
        {f.art === "chips" && f.chips ? (
          <>
            <div className="chips">
              {f.chips.map((c) => <button key={c.text} type="button" className="chip" onClick={() => chipWaehlen(c)}>{c.text}</button>)}
            </div>
            <span className="hinweis-f"><i>↓</i> Leo antwortet unten im Faden, nicht hier.</span>
          </>
        ) : r ? (
          <>
            <div className="regler">
              <input type="range" min={r.min} max={r.max} step={r.schritt || 1} value={wert} aria-label={f.text} onChange={(e) => setWert(Number(e.target.value))} />
              <span className="wert">{zahl(wert)}{einheit}</span>
            </div>
            <div className="werte"><span>{zahl(r.min)}{einheit}</span><span>{zahl(r.max)}{einheit}</span></div>
            <div className="aktion">
              <button type="button" className="btn btn--klein btn--primary" onClick={antworten}>Antworten</button>
              <span className="hinweis-f"><i>↓</i> Antwort erscheint im Faden</span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
