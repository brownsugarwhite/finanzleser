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

interface FadenContextWert {
  verlauf: Schnappschuss[];
  kapitelNr: number;
  navigieren: (href: string) => void;
  kapitelUmschalten: (id: string) => void;
  koffer: string[];
  inDenKoffer: (titel: string) => void;
  toast: (text: string) => void;
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
    scrollNachNavigation.current = true;
    router.push(href, { scroll: false });
  }, [router]);

  // Interne Links im Faden abfangen: Kapitel einfrieren, dann echte Next-Navigation.
  useEffect(() => {
    const aufKlick = (ev: MouseEvent) => {
      if (!istEinfacherLinksklick(ev) || ev.defaultPrevented) return;
      const a = (ev.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.dataset.fadenAus !== undefined) return;
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
    verlauf, kapitelNr: verlauf.length + 1, navigieren, kapitelUmschalten, koffer, inDenKoffer, toast,
  }), [verlauf, navigieren, kapitelUmschalten, koffer, inDenKoffer, toast]);

  return (
    <FadenContext.Provider value={wert}>
      {children}
      <div className={"toast" + (toastText ? " zeigt" : "")} role="status" aria-live="polite">{toastText}</div>
    </FadenContext.Provider>
  );
}
