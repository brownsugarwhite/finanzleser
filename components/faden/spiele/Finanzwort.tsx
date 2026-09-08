"use client";

/**
 * Finanzwort des Tages – Wordle-Mechanik mit einem Begriff aus dem Glossar. Port von
 * wortspiel() aus docs/prototype/src/04-js-inhalt.html: 6 Versuche × N Buchstaben,
 * Bewertung richtig/drin/falsch, Bildschirm- und physische Tastatur mit gefärbten Tasten,
 * Hüpfen der Kacheln beim Treffer, Hinweis 1 nach dem 2. und Hinweis 2 nach dem 4.
 * Fehlversuch, Auflösung mit Erklärung und Glossar-Link, Teilen als Raster, Serie aus dem
 * Punktekonto (FadenProvider).
 *
 * Stand des Tages in localStorage `faden-finanzwort` ({ slug, eingaben, fertig, gewonnen }),
 * Wiederaufnahme beim Neuladen ohne erneute Belohnung. Das Lösungswort kommt als Prop
 * (RSC-Payload); ins gerenderte HTML gelangt es erst mit der Auflösung – vorher weder als
 * Text noch als data-Attribut.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useFaden } from "@/components/faden/FadenProvider";
import { reduzierteBewegung } from "@/lib/faden/belohnung";
import { buildGlossarUrl } from "@/lib/urls";
import { spielUrl } from "./spielUrl";

export interface FinanzwortProps {
  slug: string;
  /** Lösungswort in Großbuchstaben (A–Z, Ä, Ö, Ü). */
  wort: string;
  /** Glossar-Slug des Begriffs. */
  begriff: string;
  /** Anzeigename des Begriffs (Glossar-Titel); ohne ihn wird das Wort als „Police“ geschrieben. */
  begriffName?: string;
  hinweis1: string;
  hinweis2: string;
  erklaerung: string;
  /** Laufende Nummer (Finanzwort #N). */
  nr: number;
  /** YYYY-MM-DD des Spiels oder null. */
  datum: string | null;
  punkte: number;
  wappen: string;
}

const MAX = 6;
const SPEICHER = "faden-finanzwort";
const TASTATUR = ["QWERTZUIOPÜ", "ASDFGHJKLÖÄ", "⏎YXCVBNM⌫"];
const BUCHSTABE = /^[A-ZÄÖÜ]$/;

type Wertung = "richtig" | "drin" | "falsch";
const WERTUNG_TEXT: Record<Wertung, string> = { richtig: "richtig", drin: "an anderer Stelle enthalten", falsch: "nicht enthalten" };

interface Gespeichert { slug: string; eingaben: string[]; fertig: boolean; gewonnen: boolean }

function heuteBerlin(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** Bewertung wie im Prototyp: erst exakte Treffer, dann „drin“ gegen den Rest (jeder Buchstabe zählt einmal). */
function bewerte(tipp: string, wort: string): Wertung[] {
  const L = wort.length;
  const res: (Wertung | undefined)[] = new Array(L);
  const rest: (string | null)[] = wort.split("");
  for (let i = 0; i < L; i++) if (tipp[i] === wort[i]) { res[i] = "richtig"; rest[i] = null; }
  for (let j = 0; j < L; j++) {
    if (res[j]) continue;
    const idx = rest.indexOf(tipp[j]);
    if (idx > -1) { res[j] = "drin"; rest[idx] = null; } else res[j] = "falsch";
  }
  return res as Wertung[];
}

function raster(bewertungen: Wertung[][]): string {
  return bewertungen.map((r) => r.map((x) => (x === "richtig" ? "🟩" : x === "drin" ? "🟨" : "⬜")).join("")).join("\n");
}

export default function Finanzwort({ slug, wort, begriff, begriffName, hinweis1, hinweis2, erklaerung, nr, datum, punkte, wappen }: FinanzwortProps) {
  const { belohne, toast, serie, begriffMerken } = useFaden();
  const L = wort.length;
  const name = begriffName || wort.charAt(0) + wort.slice(1).toLowerCase();

  const huelle = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>[]>([]);
  const spaeter = useCallback((fn: () => void, ms: number) => { timer.current.push(setTimeout(fn, ms)); }, []);
  useEffect(() => { const t = timer.current; return () => { t.forEach(clearTimeout); }; }, []);

  const [geladen, setGeladen] = useState(false);
  const [eingaben, setEingaben] = useState<string[]>([]);
  const [aktuell, setAktuell] = useState("");
  const [fertig, setFertig] = useState(false);
  const [gewonnen, setGewonnen] = useState(false);
  const [ende, setEnde] = useState(false);
  /** Zellen der zuletzt eingetragenen Reihe, deren Bewertung schon sichtbar ist (0 … L, gestaffelt). */
  const [aufgedeckt, setAufgedeckt] = useState(0);
  const [huepft, setHuepft] = useState(0);
  const [wackel, setWackel] = useState(false);
  const [statusText, setStatusText] = useState(`Ein Begriff aus dem Glossar, ${L} Buchstaben, ${MAX} Versuche. Tippen Sie los.`);

  // Wiederaufnahme des Tages (nur derselbe Slug), ohne erneute Belohnung.
  useEffect(() => {
    let g: Partial<Gespeichert> | null = null;
    try { const raw = localStorage.getItem(SPEICHER); if (raw) g = JSON.parse(raw); } catch { g = null; }
    if (g && g.slug === slug && Array.isArray(g.eingaben)) {
      const e = g.eingaben.filter((x): x is string => typeof x === "string" && x.length === L).slice(0, MAX);
      const gew = e.includes(wort);
      const f = gew || e.length >= MAX;
      setEingaben(e); setAufgedeckt(L); setGewonnen(gew); setFertig(f); setEnde(f);
      if (gew) setHuepft(L);
      else if (e.length) setStatusText(`Versuch ${e.length + 1} von ${MAX}.`);
    }
    setGeladen(true);
  }, [slug, wort, L]);

  const speichern = useCallback((e: string[], f: boolean, g: boolean) => {
    const stand: Gespeichert = { slug, eingaben: e, fertig: f, gewonnen: g };
    try { localStorage.setItem(SPEICHER, JSON.stringify(stand)); } catch { /* kein Speicher (privater Modus) */ }
  }, [slug]);

  // Fokus wie im Prototyp, damit die physische Tastatur sofort greift.
  useEffect(() => {
    if (!geladen || fertig) return;
    const t = setTimeout(() => huelle.current?.focus({ preventScroll: true }), 100);
    return () => clearTimeout(t);
  }, [geladen, fertig]);

  const bewertungen = useMemo(() => eingaben.map((t) => bewerte(t, wort)), [eingaben, wort]);
  const fehlversuche = eingaben.length - (gewonnen ? 1 : 0);

  // Tastenfarben aus allen schon aufgedeckten Zellen: richtig bleibt, drin fällt nie auf falsch zurück.
  const tastenFarben = useMemo(() => {
    const m: Record<string, Wertung> = {};
    bewertungen.forEach((res, r) => {
      const n = r < bewertungen.length - 1 ? L : aufgedeckt;
      for (let i = 0; i < n; i++) {
        const k = eingaben[r].charAt(i);
        const alt = m[k];
        if (alt === "richtig" || (res[i] === "falsch" && alt === "drin")) continue;
        m[k] = res[i];
      }
    });
    return m;
  }, [bewertungen, eingaben, aufgedeckt, L]);

  const taste = useCallback((k: string) => {
    if (!geladen || fertig) return;
    if (k === "⌫") { setAktuell((a) => a.slice(0, -1)); return; }
    if (k === "⏎") {
      if (aktuell.length < L) {
        setStatusText(`Das Wort braucht ${L} Buchstaben.`);
        setWackel(true);
        spaeter(() => setWackel(false), 450);
        return;
      }
      const tipp = aktuell;
      const neu = [...eingaben, tipp];
      const red = reduzierteBewegung();
      setEingaben(neu); setAktuell(""); setAufgedeckt(0);
      for (let i = 0; i < L; i++) spaeter(() => setAufgedeckt(i + 1), red ? 0 : i * 120);
      if (tipp === wort) {
        setFertig(true); setGewonnen(true); speichern(neu, true, true);
        spaeter(() => { for (let i = 0; i < L; i++) spaeter(() => setHuepft(i + 1), i * 70); }, red ? 0 : 700);
        spaeter(() => {
          belohne(punkte, huelle.current?.closest<HTMLElement>(".kasten") ?? null, { wappen: wappen || undefined });
          if (begriff) begriffMerken(begriff, false);
          setEnde(true);
        }, red ? 0 : 1100);
        return;
      }
      const reihe = neu.length;
      if (reihe === MAX) {
        setFertig(true); speichern(neu, true, false);
        spaeter(() => { if (begriff) begriffMerken(begriff, false); setEnde(true); }, red ? 0 : 800);
        return;
      }
      speichern(neu, false, false);
      setStatusText(`Versuch ${reihe + 1} von ${MAX}.`);
      return;
    }
    if (BUCHSTABE.test(k)) setAktuell((a) => (a.length < L ? a + k : a));
  }, [geladen, fertig, aktuell, eingaben, L, wort, spaeter, speichern, belohne, punkte, wappen, begriffMerken, begriff]);

  const tasteGedrueckt = (ev: KeyboardEvent<HTMLDivElement>) => {
    if (fertig || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    const k = ev.key.toUpperCase();
    if (k === "ENTER") {
      // Enter auf einer per Tab fokussierten Bildschirmtaste löst deren Klick aus, nicht die Prüfung.
      if ((ev.target as HTMLElement).closest(".taste")) return;
      ev.preventDefault(); taste("⏎");
    } else if (k === "BACKSPACE") { ev.preventDefault(); taste("⌫"); }
    else if (BUCHSTABE.test(k)) taste(k);
  };

  const teilen = () => {
    const text = `Finanzwort #${nr} · ${bewertungen.length}/${MAX}\n${raster(bewertungen)}\nfinanzleser.de${spielUrl(slug)}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast("Ergebnis kopiert"), () => toast(text));
    else toast(text);
  };

  const heute = datum === heuteBerlin();

  return (
    <div className="wortspiel" ref={huelle} role="group" tabIndex={0} onKeyDown={tasteGedrueckt} aria-label={`Finanzwort #${nr}: ${L} Buchstaben, ${MAX} Versuche`}>
      <div className="gitter" role="table" aria-label="Spielfeld">
        {Array.from({ length: MAX }, (_, r) => {
          const gesendet = r < eingaben.length;
          const tipp = gesendet ? eingaben[r] : r === eingaben.length ? aktuell : "";
          const res = gesendet ? bewertungen[r] : null;
          const letzte = r === eingaben.length - 1;
          const aktiv = !fertig && r === eingaben.length;
          return (
            <div className="reihe-w" role="row" key={r}>
              {Array.from({ length: L }, (_, c) => {
                const b = tipp.charAt(c);
                const w = res && (!letzte || c < aufgedeckt) ? res[c] : null;
                const cls = ["zelle", b && "voll", w, aktiv && wackel && "wackel", gewonnen && letzte && c < huepft && "huepft"].filter(Boolean).join(" ");
                return (
                  <div key={c} role="cell" className={cls} aria-label={`Reihe ${r + 1}, Buchstabe ${c + 1}: ${b || "leer"}${w ? `, ${WERTUNG_TEXT[w]}` : ""}`}>{b}</div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="status" role="status" aria-live="polite">
        {ende
          ? gewonnen
            ? <><b>Richtig, „{name}“ in {bewertungen.length} von {MAX}.</b> <span className="punkte">+{punkte} Punkte</span> · Serie: {serie} Tage</>
            : <><b>Das Wort war „{name}“.</b> Morgen gibt es das nächste. Serie bleibt bei {serie} Tagen.</>
          : statusText}
      </div>
      {(ende || fehlversuche >= 2) && (
        <div className="hinweis-w">
          {ende
            ? <><b>{name}:</b> {erklaerung}</>
            : <><b>Hinweis 1:</b> {hinweis1}{fehlversuche >= 4 && <><br /><b>Hinweis 2:</b> {hinweis2}</>}</>}
        </div>
      )}
      <div className="tasten" aria-label="Bildschirmtastatur">
        {TASTATUR.map((zeile) => (
          <div key={zeile}>
            {zeile.split("").map((k) => {
              const breit = k === "⏎" || k === "⌫";
              const farbe = tastenFarben[k];
              const label = k === "⏎" ? "Eingabe prüfen" : k === "⌫" ? "Buchstabe löschen" : `${k}${farbe ? `, ${WERTUNG_TEXT[farbe]}` : ""}`;
              return (
                <button key={k} type="button" className={["taste", breit && "breit", farbe].filter(Boolean).join(" ")} aria-label={label} onMouseDown={(e) => e.preventDefault()} onClick={() => taste(k)}>
                  {k === "⏎" ? "Enter" : k}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {ende && (
        <>
          <div className="reihe">
            <button type="button" className="chip chip--spiel" onClick={teilen}>Ergebnis teilen</button>
            {begriff && <a className="chip" href={buildGlossarUrl(begriff)}>Mehr zu „{name}“</a>}
          </div>
          {gewonnen && <p className="quelle">{heute ? "Morgen gibt es ein neues Wort." : "Das Finanzwort von heute steht auf der Startseite."}</p>}
        </>
      )}
    </div>
  );
}
