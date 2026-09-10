"use client";

/**
 * Zustand des Fadens (Stufe 1): Verlauf (eingefrorene Kapitel), Aktenkoffer, Punkte/Serie/Wappen
 * mit Belohnung, Toast, Navigation „anhängen statt ersetzen“.
 *
 * Kapitelmodell: Das lebende Kapitel ist die aktuelle Next-Seite (#kapitel-live am Ende
 * des Stroms). Bei jedem internen Link wird das lebende Kapitel als HTML-Schnappschuss
 * (inert, gefaltet) in den Verlauf gelegt, dann navigiert Next normal. Erneut öffnen =
 * echte Navigation (Schnappschuss fällt weg, weil das Ziel wieder lebt).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { zeigeAnfang, zeigeAnfangStabil, merkeKnoten, mitAusgleich, unterDenKopf, kopfHoehe } from "@/lib/faden/scrollen";
import { greifen } from "@/lib/faden/schnappschuss";
import { fadenZiel, istHier } from "@/lib/faden/ziel";
import { useFadenPrefetch } from "@/lib/faden/usePrefetch";
import { kapitelPinnen } from "@/lib/faden/useAbschnittAktiv";
import type { BegriffDaten } from "@/lib/faden/glossar";
import { useChat } from "@ai-sdk/react";
import type { LeoUIMessage } from "@/lib/ai/leoMessage";
import { usePathname, useRouter } from "next/navigation";
import { LEVEL_STANDARD, levelZu, type Level } from "@/lib/faden/optionen";
import { abzeichen, flugZu, IKON_DOKUMENT, konfetti, nochmal, reduzierteBewegung } from "@/lib/faden/belohnung";

export interface Schnappschuss {
  id: string;
  key: string;
  titel: string;
  pfad: string[];
  url: string;
  zeit: string; // HH:MM
  /** Roh-HTML, ungesäubert; `saeubern()` läuft erst beim Aufklappen. Leer nach Reload (nur Kopfzeile). */
  html: string;
  /** Höhe des Kapitels samt Leos Wortwechsel im Moment des Einfrierens — der Schnappschuss darf nie kürzer sein (feste Höhen, siehe greifen). */
  hoehe?: number;
  offen: boolean;
}

/** Ziel der laufenden Navigation — Skelett und Verlaufszeile kennen so Titel und Adresse, bevor der Inhalt da ist. */
export interface LadeZiel { href: string; titel?: string }

export interface BlattZustand { key: "ratgeber" | "finanztools" | "service" | "plus"; a?: string; b?: string }

/** Gemerkte Lesestelle vor einem Sprung ans Ende des Fadens (Kapitel + Versatz, damit der Rücksprung auch nach dem Einfrieren stimmt). */
export interface Lesestelle { y: number; kapitelId: string | null; offset: number; titel: string }

interface FadenContextWert {
  blatt: BlattZustand | null;
  blattOeffnen: (key: BlattZustand["key"], a?: string, b?: string) => void;
  blattZu: () => void;
  verlauf: Schnappschuss[];
  kapitelNr: number;
  /** Interne Navigation „anhängen statt ersetzen“; `wandert` lässt das neue Kapitel kurz einschweben (Kapitel ans Ende geholt); `titel` steht sofort im Skelett und im Verlauf. */
  navigieren: (href: string, opts?: { wandert?: boolean; titel?: string }) => void;
  /**
   * Eine Navigation läuft: Der Strom zeigt statt der (noch alten) Seite das Skelett und
   * springt sofort dorthin — Port von `ladeDann` aus dem Prototyp.
   */
  laedt: boolean;
  /** Die Antwort lässt länger auf sich warten (> 8 s): das Skelett sagt es und wartet weiter. */
  laedtLange: boolean;
  ladeZiel: LadeZiel | null;
  kapitelUmschalten: (id: string) => void;
  koffer: string[];
  /** Eintrag ablegen; mit `von` fliegt ein Beleg vom Knopf zum Koffer im Lesezeichen. */
  inDenKoffer: (titel: string, von?: Element | null) => void;
  kofferEntfernen: (titel: string) => void;
  lesestelle: Lesestelle | null;
  lesestelleZurueck: () => void;
  toast: (text: string) => void;
  /** Glossar der Sitzung: angetippte Begriffe, neueste zuerst; einer aufgeklappt. */
  glossarSitzung: string[];
  glossarOffen: string | null;
  begriffMerken: (slug: string, aufklappen?: boolean) => void;
  begriffAufklappen: (slug: string | null) => void;
  begriffEntfernen: (slug: string) => void;
  /** Begriffsdaten aus dem Kapitel-JSON, sonst /api/faden/glossar/<slug>; null = unbekannt. */
  begriffHolen: (slug: string) => Promise<BegriffDaten | null>;
  /** Leo: eine Chat-Instanz für die ganze Sitzung; sichtbar sind die Nachrichten des lebenden Kapitels. */
  leo: { nachrichten: LeoUIMessage[]; status: "submitted" | "streaming" | "ready" | "error"; fehler?: Error; stop: () => void };
  fragen: (text: string) => void;
  /** Punktekonto (localStorage `faden-punkte`): Punkte, Serie in Tagen, freigeschaltete Wappen, Level-Stufen aus dem CMS. */
  punkte: number;
  serie: number;
  wappen: string[];
  level: Level[];
  /**
   * Belohnung wie im Prototyp: Punkte gutschreiben, Serie fortführen, an `kasten` Konfetti
   * und „+N Punkte“-Abzeichen, Puls am Register, Leo freut sich. Ohne Kasten nur ein Toast.
   */
  belohne: (punkte: number, kasten?: HTMLElement | null, opts?: { wappen?: string; text?: string }) => void;
}

const FadenContext = createContext<FadenContextWert | null>(null);

export function useFaden(): FadenContextWert {
  const c = useContext(FadenContext);
  if (!c) throw new Error("useFaden außerhalb des FadenProvider");
  return c;
}

const MAX_VERLAUF = 8;
/** Mindeststandzeit des Skeletts in ms (Prototyp: feste 560 ms; hier nur so lang, dass es nicht blitzt). */
const SKELETT_MIN = 240;
const META_KEY = "faden-verlauf";
const LESESTELLE_KEY = "faden-lesestelle";
const KOFFER_KEY = "faden-koffer";
const GLOSSAR_KEY = "faden-glossar";
const PUNKTE_KEY = "faden-punkte";

interface Konto { punkte: number; serie: number; letzterTag: string; wappen: string[] }
const KONTO_LEER: Konto = { punkte: 0, serie: 0, letzterTag: "", wappen: [] };

/** Lokales Datum als YYYY-MM-DD (für die Serie zählt der Tag des Lesers). */
function tag(d = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function uhr(d = new Date()): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function istEinfacherLinksklick(e: MouseEvent): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/** Linktexte, die nichts über das Ziel sagen — dann lieber der Titel des Kastens drumherum oder gar nichts. */
const GENERISCH = /^(eigene seite öffnen|erneut öffnen|zum rechner|zur checkliste|zum vergleich|zu den dokumenten|zum werkzeug|zur ausgabe|ausgabe aufschlagen|aufschlagen|öffnen|mehr|weiter|weiterlesen|alle .{0,40}|kapitel ans ende des fadens holen ↓)$/i;

/** Titel des Ziels aus dem Link — für Skelett und Verlaufszeile, bevor der Inhalt da ist. */
function titelAusLink(a: HTMLAnchorElement): string | undefined {
  const eigen = a.dataset.titel || a.getAttribute("aria-label") || a.title;
  if (eigen) return eigen.trim();
  const kopf = a.querySelector("h1, h2, h3, h4, .titel, b, strong");
  const t = (kopf?.textContent || a.textContent || "").replace(/\s+/g, " ").trim();
  if (t.length > 2 && t.length <= 90 && !GENERISCH.test(t)) return t;
  // „Eigene Seite öffnen" unter einem Rechner: der Rechner ist das Ziel.
  const kasten = a.closest<HTMLElement>("[data-werkzeug]");
  const kt = (kasten?.querySelector(".article-tool-title") || kasten?.querySelector("h3"))?.textContent?.replace(/\s+/g, " ").trim();
  return kt && kt.length > 2 && kt.length <= 90 ? kt : undefined;
}

/**
 * Live-Kapitel einfrieren.
 *
 * Nur greifen, nicht säubern: `greifen()` ist ein nativer `innerHTML`-Lesezugriff, das
 * Aufbereiten (Skripte raus, IDs präfixen) übernimmt `saeubern()` in Strom.tsx erst beim
 * Aufklappen. Der Klick-Moment bleibt damit frei — der Browser malt das Skelett, ohne auf
 * einen tiefen Klon des ganzen Artikels zu warten.
 */
function schnappschuss(): Schnappschuss | null {
  if (typeof document === "undefined") return null;
  const live = document.getElementById("kapitel-live");
  if (!live) return null;
  return {
    id: Date.now().toString(36),
    key: live.dataset.key || `seite:${location.pathname}`,
    titel: live.dataset.titel || document.title,
    pfad: (live.dataset.pfad || "").split(" › ").filter(Boolean),
    url: location.pathname + location.search,
    zeit: uhr(),
    ...greifen(live),
    // Das frisch eingefrorene Kapitel bleibt OFFEN. Eingeklappt wird erst das vorletzte —
    // nach der Ankunft des neuen Kapitels und mit Scroll-Ausgleich (siehe `abschluss`) —
    // der Faden reißt dann nicht ab: über dem neuen Kapitel steht noch der ganze Beitrag,
    // den man gerade gelesen hat.
    offen: true,
  };
}

/**
 * Zum lebenden Kapitel springen. `immer`, weil der Sprung immer vom Leser ausgelöst ist
 * (Navigation, Klick im Verlauf) — davor merkt sich `navigieren` die Lesestelle.
 * Das Kapitel wird zugleich Bezugspunkt für `folgt()`, damit eine danach eintreffende
 * Leo-Antwort richtig entscheidet, ob sie ins Bild rollen darf.
 */
export function zumKapitelScrollen(): void {
  const live = document.getElementById("kapitel-live");
  if (!live) return;
  merkeKnoten(live);
  // Stabil, weil das Kapitel beim Sprung oft noch strömt (siehe zeigeAnfangStabil).
  zeigeAnfangStabil(live, true);
}

export default function FadenProvider({ children, level = LEVEL_STANDARD }: { children: ReactNode; level?: Level[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [verlauf, setVerlauf] = useState<Schnappschuss[]>([]);
  const [koffer, setKoffer] = useState<string[]>([]);
  const [konto, setKonto] = useState<Konto>(KONTO_LEER);
  const [blatt, setBlatt] = useState<BlattZustand | null>(null);
  const blattFrisch = useRef(false);
  const [toastText, setToastText] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [laedtLange, setLaedtLange] = useState(false);
  const [ladeZiel, setLadeZiel] = useState<LadeZiel | null>(null);
  /** Wann das Skelett erschien — es bleibt mindestens SKELETT_MIN stehen, sonst blitzt es nur auf. */
  const laedtSeit = useRef(0);
  const langeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Das lebende Kapitel im Klick-Moment — daran erkennt der Pfad-Effekt die Ankunft des neuen. */
  const vorherLive = useRef<HTMLElement | null>(null);
  /** Nach der Ankunft: alles vor dem gerade verlassenen Kapitel zuklappen (mit Ausgleich). */
  const zuklappenNachAnkunft = useRef(false);
  const scrollNachNavigation = useRef(false);
  const wandertNachNavigation = useRef(false);
  const letzterPfad = useRef(pathname);
  const [lesestelle, setLesestelleState] = useState<Lesestelle | null>(null);
  const lesestelleRef = useRef<Lesestelle | null>(null);
  const lesestelleWeit = useRef(false);
  const setzeLesestelle = useCallback((l: Lesestelle | null) => { lesestelleRef.current = l; lesestelleWeit.current = false; setLesestelleState(l); }, []);

  // Verlauf-Metadaten und Koffer aus der Sitzung holen (Schnappschuss-HTML überlebt keinen Reload).
  useEffect(() => {
    try {
      if (location.pathname === "/") {
        // Startseite frisch geladen = neuer Faden mit dem Landing-Hero oben (wie im Prototyp).
        sessionStorage.removeItem(META_KEY);
      } else {
        const meta = JSON.parse(sessionStorage.getItem(META_KEY) || "[]") as Schnappschuss[];
        if (Array.isArray(meta) && meta.length) {
          // 🚨 Mit Ausgleich: Die eingefrorenen Kapitel kommen ÜBER das lebende, in dem der
          // Leser gerade steht (die Lesestelle hat das Inline-Script in app/layout.tsx schon
          // hergestellt). Ohne Ausgleich rutschte der Text um die Höhe der Kopfzeilen weg.
          const liste = meta.map((m) => ({ ...m, html: typeof m.html === "string" ? m.html : "", offen: false }));
          // 🚨 Nicht IM Effekt: Beim Hydrieren läuft dieser Effekt noch innerhalb des
          // React-Commits, und flushSync wird dort verweigert („cannot flush when React is
          // already rendering") — der Verlauf käme dann ohne Ausgleich, der Text rutschte
          // um die Kopfzeilen weg. Einen Tick später ist React fertig.
          setTimeout(() => {
            mitAusgleich(document.getElementById("kapitel-live"), () => flushSync(() => setVerlauf(liste)));
            // Stand der Leser in einem eingefrorenen Kapitel, dorthin (zugeklappt: seine Kopfzeile).
            try {
              const st = JSON.parse(sessionStorage.getItem(LESESTELLE_KEY) || "null") as { url?: string; kapitelId?: string } | null;
              if (st && st.url === location.pathname && st.kapitelId && st.kapitelId !== "kapitel-live" && !location.hash) {
                const k = document.getElementById(st.kapitelId);
                if (k) window.scrollTo({ top: Math.max(0, k.getBoundingClientRect().top + window.scrollY - kopfHoehe() - 12), behavior: "instant" });
              }
            } catch { /* egal */ }
          }, 0);
        }
      }
    } catch { /* leer */ }
    try {
      const k = JSON.parse(localStorage.getItem(KOFFER_KEY) || "[]");
      if (Array.isArray(k)) setKoffer(k.filter((x) => typeof x === "string"));
    } catch { /* leer */ }
    try {
      const k = JSON.parse(localStorage.getItem(PUNKTE_KEY) || "null");
      if (k && typeof k.punkte === "number") setKonto({ punkte: k.punkte, serie: Number(k.serie) || 0, letzterTag: typeof k.letzterTag === "string" ? k.letzterTag : "", wappen: Array.isArray(k.wappen) ? k.wappen.filter((x: unknown) => typeof x === "string") : [] });
    } catch { /* leer */ }
  }, []);

  /**
   * Verlauf in die Sitzung schreiben — MIT dem Schnappschuss-HTML.
   *
   * 🚨 Vorher wurde `html` bewusst weggelassen. Nach einem Neuladen stand deshalb in
   * jedem Kapitel nur „Dieses Kapitel lag vor dem Neuladen im Faden. Erneut öffnen" —
   * der Faden war nach F5 nicht mehr derselbe. Jetzt kommt das HTML mit; reicht der
   * Platz nicht (sessionStorage liegt je nach Browser bei 5–10 MB), fallen die ÄLTESTEN
   * Kapitel zuerst auf die Kopfzeile zurück, das zuletzt gelesene bleibt am längsten
   * vollständig.
   */
  useEffect(() => {
    // Im Leerlauf, nicht im Bild: Vier Kapitel sind ~430 KB JSON, das Serialisieren kostete
    // bei jedem Auf- und Zuklappen einen spürbaren Ruck.
    const schreiben = () => {
      const ohneOffen = verlauf.map(({ offen, ...m }) => { void offen; return m; });
      for (let ab = 0; ab <= ohneOffen.length; ab++) {
        const versuch = ohneOffen.map((m, i) => (i < ab ? { ...m, html: "" } : m));
        try { sessionStorage.setItem(META_KEY, JSON.stringify(versuch)); return; } catch { /* zu groß → nächstes Kapitel opfern */ }
      }
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) { const id = w.requestIdleCallback(schreiben, { timeout: 2000 }); return () => w.cancelIdleCallback?.(id); }
    const t = setTimeout(schreiben, 200);
    return () => clearTimeout(t);
  }, [verlauf]);

  // Lesestelle für das Neuladen merken: Kapitel unter der Lesekante + Versatz (gedrosselt).
  // Wiederhergestellt wird sie vom Inline-Script in app/layout.tsx (lebendes Kapitel, vor
  // der Hydration) bzw. oben beim Einhängen des Verlaufs (eingefrorenes Kapitel).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const merken = () => {
      timer = null;
      const kante = kopfHoehe() + 100;
      let k: HTMLElement | null = null;
      document.querySelectorAll<HTMLElement>("#strom .kapitel[id]").forEach((el) => { if (el.getBoundingClientRect().top <= kante) k = el; });
      const ziel = (k as HTMLElement | null) || document.getElementById("kapitel-live");
      if (!ziel) return;
      try { sessionStorage.setItem(LESESTELLE_KEY, JSON.stringify({ url: location.pathname, kapitelId: ziel.id, versatz: Math.round(ziel.getBoundingClientRect().top) })); } catch { /* egal */ }
    };
    const h = () => { if (!timer) timer = setTimeout(merken, 250); };
    window.addEventListener("scroll", h, { passive: true });
    return () => { window.removeEventListener("scroll", h); if (timer) clearTimeout(timer); };
  }, []);

  const toast = useCallback((text: string) => {
    setToastText(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastText(""), 2600);
  }, []);

  // Lesestelle merken (Port aus dem Prototyp sprungVorbereiten/lesestelleMerken): das Kapitel unter
  // der aktuellen Scrollposition und der Versatz darin; das lebende Kapitel bekommt gleich die Alt-ID.
  const lesestelleMerken = useCallback((neueAltId?: string) => {
    const strom = document.getElementById("strom");
    const live = document.getElementById("kapitel-live");
    if (!strom || !live) return;
    const ende = document.getElementById("strom-ende");
    if (ende && ende.getBoundingClientRect().top < window.innerHeight + 40) return; // steht schon am Ende: der Faden springt nicht
    const y = window.scrollY;
    const kapitel = Array.from(strom.querySelectorAll<HTMLElement>(".kapitel"));
    let k: HTMLElement | null = null;
    for (let i = kapitel.length - 1; i >= 0; i--) { if (kapitel[i].getBoundingClientRect().top + y <= y + 40) { k = kapitel[i]; break; } }
    const titel = (k?.dataset.titel || k?.querySelector("h2")?.textContent || "").trim();
    const kapitelId = k ? (k.id === "kapitel-live" && neueAltId ? `kapitel-alt-${neueAltId}` : k.id) : null;
    setzeLesestelle({ y, kapitelId, offset: k ? y - (k.getBoundingClientRect().top + y) : 0, titel: titel === "Heute" ? "" : titel });
    // Ist der Faden nach 900 ms gar nicht gesprungen, braucht es keinen Rückweg.
    setTimeout(() => { if (lesestelleRef.current && Math.abs(window.scrollY - y) < 320) setzeLesestelle(null); }, 900);
  }, [setzeLesestelle]);

  const lesestelleZurueck = useCallback(() => {
    const l = lesestelleRef.current;
    if (!l) return;
    const reduziert = reduzierteBewegung();
    const k = l.kapitelId ? document.getElementById(l.kapitelId) : null;
    const hin = () => { const n = l.kapitelId ? document.getElementById(l.kapitelId) : null; const ziel = n ? n.getBoundingClientRect().top + window.scrollY + l.offset : l.y; window.scrollTo({ top: Math.max(0, ziel), behavior: reduziert ? "auto" : "smooth" }); };
    if (k && k.classList.contains("zu")) {
      const id = k.id.replace(/^kapitel-alt-/, "");
      setVerlauf((alt) => alt.map((x) => (x.id === id ? { ...x, offen: true } : x)));
      setTimeout(hin, 60); // erst aufklappen, dann ansteuern
    } else hin();
    setzeLesestelle(null);
  }, [setzeLesestelle]);

  // Der Knopf verschwindet erst, wenn man einmal weit weg war (> 300 px) und wieder in die Nähe kommt.
  useEffect(() => {
    const h = () => {
      const l = lesestelleRef.current;
      if (!l) return;
      const d = Math.abs(window.scrollY - l.y);
      if (d > 300) lesestelleWeit.current = true;
      else if (lesestelleWeit.current && d < 120) setzeLesestelle(null);
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, [setzeLesestelle]);

  const navigieren = useCallback((href: string, opts?: { wandert?: boolean; titel?: string }) => {
    const s = schnappschuss();
    lesestelleMerken(s?.id);
    // Das Registerblatt schließt mit dem Klick, nicht erst mit dem Pfadwechsel — der kommt
    // erst mit dem neuen Kapitel, und so lange stand das Blatt offen über dem Skelett.
    setBlatt(null);
    wandertNachNavigation.current = !!opts?.wandert;
    const zielPfad = href.split(/[?#]/)[0];
    const friert = !!s && s.url.split(/[?#]/)[0] !== zielPfad;
    setVerlauf((alt) => {
      let liste = alt.filter((k) => k.url.split(/[?#]/)[0] !== zielPfad); // Ziel lebt gleich wieder
      if (s && friert) {
        liste = liste.filter((k) => k.key !== s.key);
        // 🚨 Hier wird NICHTS zugeklappt und nichts gekürzt. Beides ändert Höhen OBERHALB
        // des Skeletts, das im selben Commit kommt — der Sprung dorthin zielte dann
        // daneben (gemessen 10.09.2026: bis zu 11 887 px). Zuklappen und Kürzen passieren
        // nach der Ankunft, mit Scroll-Ausgleich (siehe `abschluss`).
        liste = [...liste, s];
      }
      return liste;
    });
    zuklappenNachAnkunft.current = friert;
    // Verlauf links: bis zur Ankunft ist kein Kapitel aktiv (die Abschnittsliste darf
    // nicht unter den eingefrorenen Eintrag springen), danach das neue — bis der Leser
    // selbst scrollt (lib/faden/useAbschnittAktiv.ts).
    kapitelPinnen("skelett");
    setLeoAb(chatRef.current.messages.length);
    scrollNachNavigation.current = true;
    // Der Knoten, der gleich ersetzt wird — gemerkt JETZT, nicht erst im Pfad-Effekt: Der
    // Pfad wechselt im selben Commit wie das neue Kapitel, dort wäre es schon der neue.
    vorherLive.current = document.getElementById("kapitel-live");
    // Prototyp `ladeDann`: bei reduzierter Bewegung kein Skelett, dann bleibt die alte
    // Seite stehen, bis die neue da ist.
    //
    // Der frühere `min-height`-Riegel am Strom ist nicht mehr nötig: Das eingefrorene
    // Kapitel ist pixelgleich hoch wie das lebende (feste Höhen, greifen/saeubern), und
    // den Platz unter dem letzten Kapitel hält `Bodenabstand` in Strom.tsx.
    if (!reduzierteBewegung()) {
      laedtSeit.current = performance.now();
      setLaedt(true);
      setLaedtLange(false);
      setLadeZiel({ href, titel: opts?.titel });
      // Dauert es länger, sagt das Skelett es — und wartet weiter. Kein Wiederbeleben der
      // alten Seite (das stellte das alte Kapitel doppelt in den Verlauf, gemessen
      // 10.09.2026) und kein harter Seitenwechsel.
      if (langeTimer.current) clearTimeout(langeTimer.current);
      langeTimer.current = setTimeout(() => { if (laedtSeit.current) setLaedtLange(true); }, 8000);
    }
    router.push(href, { scroll: false });
  }, [router, lesestelleMerken]);

  // Interne Links im Faden abfangen: Kapitel einfrieren, dann echte Next-Navigation.
  useEffect(() => {
    const aufKlick = (ev: MouseEvent) => {
      if (!istEinfacherLinksklick(ev) || ev.defaultPrevented) return;
      const a = (ev.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      // Dieselbe Entscheidung wie beim Vorausladen — eine Quelle, lib/faden/ziel.ts.
      const ziel = fadenZiel(a);
      if (!ziel) return;
      ev.preventDefault();
      // Auch ein Link auf das Kapitel, in dem man schon steht, führt „in den Faden": Blatt zu.
      if (istHier(ziel)) { setBlatt(null); zumKapitelScrollen(); return; }
      navigieren(ziel, { titel: a ? titelAusLink(a) : undefined });
    };
    document.addEventListener("click", aufKlick);
    return () => document.removeEventListener("click", aufKlick);
  }, [navigieren]);

  // Ziele vorausladen, solange der Leser noch liest (siehe lib/faden/usePrefetch.ts).
  useFadenPrefetch(pathname);

  // Nach dem Routenwechsel: Kopf des neuen Kapitels unter die Kopfzeile (Scroll-Regel).
  useEffect(() => {
    if (letzterPfad.current === pathname) return;
    letzterPfad.current = pathname;
    if (!scrollNachNavigation.current) return; // Zurück-Taste u. ä.: Browser-Verhalten
    scrollNachNavigation.current = false;
    const wandert = wandertNachNavigation.current;
    wandertNachNavigation.current = false;
    const hash = location.hash.slice(1);
    // Auf den neuen Knoten warten, falls die RSC-Antwort noch strömt. 🚨 `vorher` stammt
    // aus dem Klick-Moment (navigieren). Hier gemessen wäre es schon der NEUE Knoten — der
    // Pfad wechselt im selben Commit wie das Kapitel —, `live !== vorher` würde nie wahr,
    // und die Schleife liefe bis zur Frist: 2,0 s Skelett bei jeder Navigation, obwohl der
    // Inhalt längst da war (gemessen 10.09.2026).
    const vorher = vorherLive.current;
    vorherLive.current = null;
    const frist = performance.now() + 2000;
    const versuchen = () => {
      const live = document.getElementById("kapitel-live");
      const ziel = hash ? document.getElementById(hash) : live;
      const bereit = !!ziel && (hash ? true : !!live && live !== vorher);
      if (!bereit && performance.now() < frist) { requestAnimationFrame(versuchen); return; }
      // 🚨 Erst abräumen, dann messen: solange das Skelett steht, ist das neue Kapitel
      // ausgeblendet (`.strom--laedt`) und sein Rechteck null — ein Sprung dorthin
      // landete am Seitenanfang.
      const abschluss = () => {
        const neuLive = document.getElementById("kapitel-live");
        // Das neue Kapitel blendet sich ein, statt hart zu erscheinen — der Faden läuft
        // weiter, er wechselt nicht die Seite. „wandert" hat seine eigene Bewegung.
        nochmal(neuLive, wandert ? "wandert" : "kapitel--frisch");
        const anker = hash ? document.getElementById(hash) : null;
        if (anker) zeigeAnfang(anker, true);
        // Das Kapitel erscheint an der Stelle des Skeletts, also schon unter dem Kopf —
        // gescrollt wird nur, wenn die Geometrie doch nicht stimmt (kein zweiter Sprung).
        else if (neuLive) { merkeKnoten(neuLive); unterDenKopf(neuLive); }
        // Jetzt erst: alles vor dem gerade verlassenen Kapitel zuklappen und den Verlauf
        // kürzen. Die letzten zwei Kapitel — das verlassene und das neue — bleiben offen.
        // Das Kürzen gleicht `mitAusgleich` aus (ein entfernter Knoten meldet keine Höhe
        // mehr), das Zuklappen der Ausgleichs-Beobachter in lib/faden/ausgleich.ts — beides
        // im selben Bild, vom Leser unbemerkt.
        if (zuklappenNachAnkunft.current) {
          zuklappenNachAnkunft.current = false;
          mitAusgleich(neuLive, () => flushSync(() => setVerlauf((alt) => alt.slice(-MAX_VERLAUF))));
          setVerlauf((alt) => alt.map((k, i) => (k.offen && i < alt.length - 1 ? { ...k, offen: false } : k)));
        }
      };
      if (!laedtSeit.current) { abschluss(); return; }
      // Das Skelett bleibt mindestens SKELETT_MIN stehen — sonst blitzt es bei einer
      // vorgeladenen Seite nur für einen Frame auf, was unruhiger wirkt als gar nichts.
      const rest = Math.max(0, SKELETT_MIN - (performance.now() - laedtSeit.current));
      setTimeout(() => {
        laedtSeit.current = 0;
        if (langeTimer.current) { clearTimeout(langeTimer.current); langeTimer.current = null; }
        // Im selben Commit wie das Abräumen des Skeletts — sonst zeigt der Verlauf für
        // zwei Bilder „Noch kein Kapitel", weil der Pin noch auf dem Skelett steht.
        kapitelPinnen("kapitel-live");
        setLaedt(false);
        setLaedtLange(false);
        setLadeZiel(null);
        requestAnimationFrame(() => requestAnimationFrame(abschluss));
      }, rest);
    };
    requestAnimationFrame(versuchen);
  }, [pathname]);

  // Leo: eine useChat-Instanz für die Sitzung (überlebt Navigation). Sichtbar im Strom sind nur
  // die Nachrichten seit dem letzten Kapitelwechsel; die Vorgeschichte geht als history mit.
  const chat = useChat<LeoUIMessage>();
  const chatRef = useRef(chat); chatRef.current = chat;
  const [leoAb, setLeoAb] = useState(0);
  const fragen = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    const seg = location.pathname.split("/").filter(Boolean);
    const slug = seg.length ? seg[seg.length - 1] : "";
    const category = seg.length > 1 ? seg[0] : "";
    setBlatt(null);
    chatRef.current.sendMessage({ text: t }, { body: { slug, category } });
  }, []);
  useEffect(() => { setLeoAb(chatRef.current.messages.length); }, [pathname]);

  // Glossar der Sitzung (sessionStorage) + Begriffs-Cache (Kapitel-JSON, dann Route).
  const [glossarSitzung, setGlossarSitzung] = useState<string[]>([]);
  const [glossarOffen, setGlossarOffen] = useState<string | null>(null);
  const glossarCache = useRef(new Map<string, BegriffDaten | null>());
  useEffect(() => {
    try {
      const roh = sessionStorage.getItem(GLOSSAR_KEY);
      if (!roh) return;
      const g = JSON.parse(roh) as { slugs?: string[]; daten?: BegriffDaten[] };
      (g.daten || []).forEach((d) => glossarCache.current.set(d.slug, d));
      if (Array.isArray(g.slugs)) setGlossarSitzung(g.slugs.filter((x) => typeof x === "string"));
    } catch { /* Sitzung beginnt leer */ }
  }, []);
  useEffect(() => {
    try {
      const daten = glossarSitzung.map((sl) => glossarCache.current.get(sl)).filter((d): d is BegriffDaten => !!d);
      sessionStorage.setItem(GLOSSAR_KEY, JSON.stringify({ slugs: glossarSitzung, daten }));
    } catch { /* egal */ }
  }, [glossarSitzung]);
  const begriffHolen = useCallback(async (slug: string): Promise<BegriffDaten | null> => {
    const c = glossarCache.current;
    if (!c.has(slug)) {
      document.querySelectorAll<HTMLScriptElement>("script[data-glossar-daten]").forEach((sc) => {
        try { (JSON.parse(sc.textContent || "[]") as BegriffDaten[]).forEach((d) => { if (d && d.slug && !c.has(d.slug)) c.set(d.slug, d); }); } catch { /* egal */ }
      });
    }
    if (c.has(slug)) return c.get(slug) || null;
    try {
      const r = await fetch(`/api/faden/glossar/${encodeURIComponent(slug)}`);
      if (!r.ok) { if (r.status === 404) c.set(slug, null); return null; }
      const d = (await r.json()) as BegriffDaten;
      c.set(slug, d);
      return d;
    } catch { return null; }
  }, []);
  const begriffMerken = useCallback((slug: string, aufklappen?: boolean) => {
    const vorher = !!document.querySelector(`#glossarRail [data-k="${slug}"]`);
    const menue = document.querySelector(".bmenu.offen");
    setGlossarSitzung((alt) => (alt[0] === slug ? alt : [slug, ...alt.filter((x) => x !== slug)]));
    if (aufklappen) setGlossarOffen(slug);
    if (vorher) return;
    // Glossar-Flug (Prototyp 05-js-neu.html): der Begriff fliegt vom Klickmenü in die Leiste und leuchtet dort kurz.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const e = document.querySelector<HTMLElement>(`#glossarRail [data-k="${slug}"]`);
      if (!e) return;
      const rail = document.getElementById("randRechts");
      const leuchten = () => { e.classList.add("neu"); setTimeout(() => e.classList.remove("neu"), 1400); };
      if (aufklappen && menue && rail && rail.offsetParent && getComputedStyle(rail).opacity !== "0") flugZu(menue, e, "✦", "flug-begriff").then(leuchten); else leuchten();
    }));
  }, []);
  const begriffAufklappen = useCallback((slug: string | null) => setGlossarOffen(slug), []);
  const begriffEntfernen = useCallback((slug: string) => {
    setGlossarSitzung((alt) => alt.filter((x) => x !== slug));
    setGlossarOffen((o) => (o === slug ? null : o));
  }, []);

  // Registerblatt: öffnen/schließen; der Klick, der es öffnet, darf es nicht im selben Moment
  // wieder schließen (Dokument-Klick-Schließer) — Lehre aus dem Prototyp.
  const blattOeffnen = useCallback((key: BlattZustand["key"], a?: string, b?: string) => {
    blattFrisch.current = true; setTimeout(() => { blattFrisch.current = false; }, 0);
    setBlatt({ key, a, b });
  }, []);
  const blattZu = useCallback(() => setBlatt(null), []);
  useEffect(() => {
    if (!blatt) return;
    const aufKlick = (ev: MouseEvent) => {
      if (blattFrisch.current) return;
      const t = ev.target as Element | null;
      if (t && (t.closest("#kopf") || t.closest(".menue"))) return;
      setBlatt(null);
    };
    const aufTaste = (ev: KeyboardEvent) => { if (ev.key === "Escape") setBlatt(null); };
    document.addEventListener("click", aufKlick);
    document.addEventListener("keydown", aufTaste);
    return () => { document.removeEventListener("click", aufKlick); document.removeEventListener("keydown", aufTaste); };
  }, [blatt]);
  useEffect(() => { setBlatt(null); }, [pathname]);

  const kapitelUmschalten = useCallback((id: string) => {
    setVerlauf((alt) => alt.map((k) => (k.id === id ? { ...k, offen: !k.offen } : k)));
  }, []);

  const inDenKoffer = useCallback((titel: string, von?: Element | null) => {
    setKoffer((alt) => {
      const neu = alt.includes(titel) ? alt : [...alt, titel];
      try { localStorage.setItem(KOFFER_KEY, JSON.stringify(neu)); } catch { /* egal */ }
      return neu;
    });
    // Koffer-Flug (Prototyp 05-js-neu.html kofferFlug): der Beleg fliegt zum Koffer, der blinkt, die Zahl springt.
    const btn = document.getElementById("kofferBtn");
    const puls = () => { nochmal(btn, "blinkt"); requestAnimationFrame(() => nochmal(document.getElementById("kofferZahl"), "popt")); };
    if (von && btn && getComputedStyle(btn).display !== "none") flugZu(von, btn, IKON_DOKUMENT, "flug-koffer", true).then(puls); else puls();
    toast("Im Aktenkoffer: „" + (titel.length > 40 ? titel.slice(0, 38) + "…" : titel) + "“");
  }, [toast]);

  const kofferEntfernen = useCallback((titel: string) => {
    setKoffer((alt) => {
      const neu = alt.filter((x) => x !== titel);
      try { localStorage.setItem(KOFFER_KEY, JSON.stringify(neu)); } catch { /* egal */ }
      return neu;
    });
  }, []);

  const belohne = useCallback((p: number, kasten?: HTMLElement | null, opts?: { wappen?: string; text?: string }) => {
    let neuesWappen = false;
    let neuesLevel: Level | null = null;
    setKonto((alt) => {
      const vor = levelZu(alt.punkte, level).aktuell, nach = levelZu(alt.punkte + p, level).aktuell;
      neuesLevel = nach.ab > vor.ab ? nach : null;
      const heute = tag(), gestern = tag(new Date(Date.now() - 86_400_000));
      const serie = alt.letzterTag === heute ? Math.max(1, alt.serie) : alt.letzterTag === gestern ? alt.serie + 1 : 1;
      neuesWappen = !!opts?.wappen && !alt.wappen.includes(opts.wappen);
      const neu: Konto = { punkte: alt.punkte + p, serie, letzterTag: heute, wappen: neuesWappen && opts?.wappen ? [...alt.wappen, opts.wappen] : alt.wappen };
      try { localStorage.setItem(PUNKTE_KEY, JSON.stringify(neu)); } catch { /* egal */ }
      return neu;
    });
    const text = opts?.text || `+${p} Punkte`;
    if (!kasten || reduzierteBewegung()) { toast(text); }
    else {
      konfetti(kasten);
      abzeichen(kasten, text);
      const leos = kasten.closest(".kapitel__inhalt")?.querySelectorAll(".wort--leo .wort__avatar");
      if (leos && leos.length) nochmal(leos[leos.length - 1], "leo-freut");
    }
    nochmal(document.querySelector('.register button[data-key="plus"]'), "punkte-puls");
    if (opts?.wappen) setTimeout(() => { if (neuesWappen) toast(`Wappen „${opts.wappen}“ freigeschaltet`); }, 900);
    setTimeout(() => { if (neuesLevel) toast(`Neues Level: ${neuesLevel.name} · Belohnung unter Finanzleser Plus`); }, 1800);
  }, [toast, level]);

  const wert = useMemo<FadenContextWert>(() => ({
    blatt, blattOeffnen, blattZu, verlauf, kapitelNr: verlauf.length + 1, navigieren, laedt, laedtLange, ladeZiel, kapitelUmschalten, koffer, inDenKoffer, kofferEntfernen, toast,
    glossarSitzung, glossarOffen, begriffMerken, begriffAufklappen, begriffEntfernen, begriffHolen,
    leo: { nachrichten: chat.messages.slice(leoAb), status: chat.status, fehler: chat.error, stop: chat.stop },
    fragen,
    punkte: konto.punkte, serie: konto.serie, wappen: konto.wappen, level, belohne,
    lesestelle, lesestelleZurueck,
  }), [lesestelle, lesestelleZurueck, blatt, blattOeffnen, blattZu, verlauf, navigieren, laedt, laedtLange, ladeZiel, kapitelUmschalten, koffer, inDenKoffer, kofferEntfernen, toast, glossarSitzung, glossarOffen, begriffMerken, begriffAufklappen, begriffEntfernen, begriffHolen, chat.messages, chat.status, chat.error, chat.stop, leoAb, fragen, konto, level, belohne]);

  return (
    <FadenContext.Provider value={wert}>
      {children}
      <div className={"toast" + (toastText ? " zeigt" : "")} role="status" aria-live="polite">{toastText}</div>
    </FadenContext.Provider>
  );
}
