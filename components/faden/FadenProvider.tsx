"use client";

/**
 * Zustand des Fadens (Stufe 1): Verlauf (eingefrorene Kapitel), Aktenkoffer,
 * Toast, Navigation „anhängen statt ersetzen“.
 *
 * Kapitelmodell: Das lebende Kapitel ist die aktuelle Next-Seite (#kapitel-live am Ende
 * des Stroms). Bei jedem internen Link wird das lebende Kapitel als HTML-Schnappschuss
 * (inert, gefaltet) in den Verlauf gelegt, dann navigiert Next normal. Erneut öffnen =
 * echte Navigation (Schnappschuss fällt weg, weil das Ziel wieder lebt).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { BegriffDaten } from "@/lib/faden/glossar";
import { useChat } from "@ai-sdk/react";
import type { LeoUIMessage } from "@/lib/ai/leoMessage";
import { usePathname, useRouter } from "next/navigation";

export interface Schnappschuss {
  id: string;
  key: string;
  titel: string;
  pfad: string[];
  url: string;
  zeit: string; // HH:MM
  html: string; // leer nach Reload (nur Kopfzeile)
  offen: boolean;
}

export interface BlattZustand { key: "ratgeber" | "finanztools" | "service" | "plus"; a?: string; b?: string }

interface FadenContextWert {
  blatt: BlattZustand | null;
  blattOeffnen: (key: BlattZustand["key"], a?: string, b?: string) => void;
  blattZu: () => void;
  verlauf: Schnappschuss[];
  kapitelNr: number;
  navigieren: (href: string) => void;
  kapitelUmschalten: (id: string) => void;
  koffer: string[];
  inDenKoffer: (titel: string) => void;
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
}

const FadenContext = createContext<FadenContextWert | null>(null);

export function useFaden(): FadenContextWert {
  const c = useContext(FadenContext);
  if (!c) throw new Error("useFaden außerhalb des FadenProvider");
  return c;
}

const MAX_VERLAUF = 8;
const META_KEY = "faden-verlauf";
const KOFFER_KEY = "faden-koffer";
const GLOSSAR_KEY = "faden-glossar";

function uhr(d = new Date()): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function istEinfacherLinksklick(e: MouseEvent): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/** Live-Kapitel einfrieren: Klon ohne Skripte, IDs präfixen, nur der Inhalt. */
function schnappschuss(): Schnappschuss | null {
  if (typeof document === "undefined") return null;
  const live = document.getElementById("kapitel-live");
  if (!live) return null;
  const id = Date.now().toString(36);
  const klon = live.cloneNode(true) as HTMLElement;
  klon.querySelectorAll("script, iframe, video, audio, canvas").forEach((e) => e.remove());
  klon.querySelectorAll("[id]").forEach((e) => { e.id = `alt-${id}-${e.id}`; });
  klon.querySelectorAll("[aria-live]").forEach((e) => e.removeAttribute("aria-live"));
  const inhalt = klon.querySelector(".kapitel__inhalt");
  // Leos Wortwechsel zu diesem Kapitel gehört mit ins eingefrorene Kapitel.
  const leo = document.getElementById("leo-strom");
  if (leo && leo.children.length) {
    const l = leo.cloneNode(true) as HTMLElement;
    l.removeAttribute("id"); l.removeAttribute("aria-live"); l.classList.add("leo-strom--alt");
    l.querySelectorAll("[id]").forEach((e) => { e.id = `alt-${id}-${e.id}`; });
    l.querySelectorAll(".tippt, .cursor, .leo-chips, .werkzeuge").forEach((e) => e.remove());
    (inhalt || klon).appendChild(l);
  }
  return {
    id,
    key: live.dataset.key || `seite:${location.pathname}`,
    titel: live.dataset.titel || document.title,
    pfad: (live.dataset.pfad || "").split(" › ").filter(Boolean),
    url: location.pathname + location.search,
    zeit: uhr(),
    html: (inhalt || klon).innerHTML,
    offen: false,
  };
}

function kopfHoehe(): number {
  const k = document.getElementById("kopf");
  return k ? k.offsetHeight : 64;
}

export function zumKapitelScrollen(): void {
  const live = document.getElementById("kapitel-live");
  if (!live) return;
  const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ziel = live.getBoundingClientRect().top + window.scrollY - kopfHoehe() - 12;
  window.scrollTo({ top: Math.max(0, ziel), behavior: reduziert ? "auto" : "smooth" });
}

export default function FadenProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [verlauf, setVerlauf] = useState<Schnappschuss[]>([]);
  const [koffer, setKoffer] = useState<string[]>([]);
  const [blatt, setBlatt] = useState<BlattZustand | null>(null);
  const blattFrisch = useRef(false);
  const [toastText, setToastText] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollNachNavigation = useRef(false);
  const letzterPfad = useRef(pathname);

  // Verlauf-Metadaten und Koffer aus der Sitzung holen (Schnappschuss-HTML überlebt keinen Reload).
  useEffect(() => {
    try {
      const meta = JSON.parse(sessionStorage.getItem(META_KEY) || "[]") as Schnappschuss[];
      if (Array.isArray(meta) && meta.length) setVerlauf(meta.map((m) => ({ ...m, html: "", offen: false })));
    } catch { /* leer */ }
    try {
      const k = JSON.parse(localStorage.getItem(KOFFER_KEY) || "[]");
      if (Array.isArray(k)) setKoffer(k.filter((x) => typeof x === "string"));
    } catch { /* leer */ }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(META_KEY, JSON.stringify(verlauf.map(({ html, offen, ...m }) => { void html; void offen; return m; })));
    } catch { /* voll oder gesperrt */ }
  }, [verlauf]);

  const toast = useCallback((text: string) => {
    setToastText(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastText(""), 2600);
  }, []);

  const navigieren = useCallback((href: string) => {
    const s = schnappschuss();
    const zielPfad = href.split(/[?#]/)[0];
    setVerlauf((alt) => {
      let liste = alt.filter((k) => k.url.split(/[?#]/)[0] !== zielPfad); // Ziel lebt gleich wieder
      if (s && s.url.split(/[?#]/)[0] !== zielPfad) {
        liste = liste.filter((k) => k.key !== s.key);
        liste = [...liste, s];
      }
      return liste.slice(-MAX_VERLAUF);
    });
    setLeoAb(chatRef.current.messages.length);
    scrollNachNavigation.current = true;
    router.push(href, { scroll: false });
  }, [router]);

  // Interne Links im Faden abfangen: Kapitel einfrieren, dann echte Next-Navigation.
  useEffect(() => {
    const aufKlick = (ev: MouseEvent) => {
      if (!istEinfacherLinksklick(ev) || ev.defaultPrevented) return;
      const a = (ev.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.dataset.fadenAus !== undefined) return;
      if (a.classList.contains("begriff")) return; // Klickmenü (BegriffMenue) übernimmt
      let url: URL;
      try { url = new URL(a.href, location.href); } catch { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return; // Anker in der Seite
      if (/\.(pdf|jpe?g|png|webp|svg|gif|zip|xlsx?|docx?)$/i.test(url.pathname)) return;
      if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/wp-content/")) return;
      if (url.pathname === location.pathname && url.search === location.search) { ev.preventDefault(); zumKapitelScrollen(); return; }
      ev.preventDefault();
      navigieren(url.pathname + url.search + url.hash);
    };
    document.addEventListener("click", aufKlick);
    return () => document.removeEventListener("click", aufKlick);
  }, [navigieren]);

  // Nach dem Routenwechsel: Kopf des neuen Kapitels unter die Kopfzeile (Scroll-Regel).
  useEffect(() => {
    if (letzterPfad.current === pathname) return;
    letzterPfad.current = pathname;
    if (!scrollNachNavigation.current) return; // Zurück-Taste u. ä.: Browser-Verhalten
    scrollNachNavigation.current = false;
    const hash = location.hash.slice(1);
    requestAnimationFrame(() => {
      const ziel = hash ? document.getElementById(hash) : null;
      if (ziel) {
        const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: ziel.getBoundingClientRect().top + window.scrollY - kopfHoehe() - 12, behavior: reduziert ? "auto" : "smooth" });
      } else {
        zumKapitelScrollen();
      }
    });
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
    setGlossarSitzung((alt) => (alt[0] === slug ? alt : [slug, ...alt.filter((x) => x !== slug)]));
    if (aufklappen) setGlossarOffen(slug);
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

  const inDenKoffer = useCallback((titel: string) => {
    setKoffer((alt) => {
      const neu = alt.includes(titel) ? alt : [...alt, titel];
      try { localStorage.setItem(KOFFER_KEY, JSON.stringify(neu)); } catch { /* egal */ }
      return neu;
    });
    toast("Im Aktenkoffer: „" + (titel.length > 40 ? titel.slice(0, 38) + "…" : titel) + "“");
  }, [toast]);

  const wert = useMemo<FadenContextWert>(() => ({
    blatt, blattOeffnen, blattZu, verlauf, kapitelNr: verlauf.length + 1, navigieren, kapitelUmschalten, koffer, inDenKoffer, toast,
    glossarSitzung, glossarOffen, begriffMerken, begriffAufklappen, begriffEntfernen, begriffHolen,
    leo: { nachrichten: chat.messages.slice(leoAb), status: chat.status, fehler: chat.error, stop: chat.stop },
    fragen,
  }), [blatt, blattOeffnen, blattZu, verlauf, navigieren, kapitelUmschalten, koffer, inDenKoffer, toast, glossarSitzung, glossarOffen, begriffMerken, begriffAufklappen, begriffEntfernen, begriffHolen, chat.messages, chat.status, chat.error, chat.stop, leoAb, fragen]);

  return (
    <FadenContext.Provider value={wert}>
      {children}
      <div className={"toast" + (toastText ? " zeigt" : "")} role="status" aria-live="polite">{toastText}</div>
    </FadenContext.Provider>
  );
}
