"use client";

/**
 * Ziele vorausladen, damit der Klick nicht auf das Netz warten muss.
 *
 * 🚨 Warum das im Faden von Hand nötig ist: Alle Ziele sind schlichte `<a href>`, die der
 * Klick-Abfänger im FadenProvider auf `router.push` umbiegt. Nexts eingebautes
 * Vorausladen hängt aber an `<Link>` — im Faden griff es deshalb an keiner einzigen
 * Stelle, und jeder Klick war ein kalter RSC-Roundtrip.
 *
 * Kosten: Ein Prefetch holt die vorgerenderte RSC-Payload vom Netlify-CDN. Er erreicht
 * WordPress nicht und erzeugt bei einem Cache-Treffer keine Function-Sekunden. Trotzdem
 * mit Maß (CLAUDE.md, Falle 1):
 *
 *  - Absicht zuerst: Zeigen (`pointerover`), Tippen (`touchstart`) und Tastaturfokus
 *    laden sofort — da will jemand wirklich dorthin.
 *  - Sichtbare Ziele im Strom laufen über eine Warteschlange: eins pro Leerlauf-Takt,
 *    höchstens VORRAT_MAX je Seite.
 *  - `Save-Data` und langsame Verbindungen: nur die Absichts-Fälle, kein Vorrat.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fadenZiel, istHier } from "./ziel";

/** Höchstens so viele Ziele je Seite auf Verdacht (Absichts-Prefetches zählen nicht mit). */
const VORRAT_MAX = 8;
/** So lange gilt ein Ziel als geholt. Danach darf es wieder — Nexts Router-Cache läuft ebenfalls ab. */
const FRISCH_MS = 60_000;

/**
 * Geholte Ziele über Kapitelwechsel hinweg. Modulweit, nicht je Hook-Lauf: sonst
 * beginnt bei jedem Kapitelwechsel eine neue Liste und dieselben Ziele werden wieder
 * und wieder geholt.
 */
const geholt = new Map<string, number>();

function schonGeholt(ziel: string): boolean {
  const t = geholt.get(ziel);
  if (t && Date.now() - t < FRISCH_MS) return true;
  return false;
}

function vormerken(ziel: string): void {
  if (geholt.size > 300) geholt.clear();
  geholt.set(ziel, Date.now());
}

interface Verbindung { saveData?: boolean; effectiveType?: string }

function sparsam(): boolean {
  const c = (navigator as Navigator & { connection?: Verbindung }).connection;
  if (!c) return false;
  return !!c.saveData || c.effectiveType === "slow-2g" || c.effectiveType === "2g";
}

const imLeerlauf: (cb: () => void) => void =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? (cb) => (window as Window & { requestIdleCallback: (c: () => void) => void }).requestIdleCallback(cb)
    : (cb) => setTimeout(cb, 200);

export function useFadenPrefetch(pathname: string): void {
  const router = useRouter();

  useEffect(() => {
    const warteschlange: string[] = [];
    let vorrat = 0;
    let laeuft = false;
    let abgebaut = false;

    const holen = (ziel: string) => {
      if (abgebaut || schonGeholt(ziel) || istHier(ziel)) return;
      vormerken(ziel);
      try { router.prefetch(ziel.split("#")[0]); } catch { /* Prefetch ist Kür, nie Pflicht */ }
    };

    const abarbeiten = () => {
      laeuft = false;
      if (abgebaut) return;
      const ziel = warteschlange.shift();
      if (!ziel) return;
      if (vorrat < VORRAT_MAX && !schonGeholt(ziel)) { vorrat += 1; holen(ziel); }
      if (warteschlange.length) anstossen();
    };
    const anstossen = () => { if (!laeuft) { laeuft = true; imLeerlauf(abarbeiten); } };

    // --- Absicht: Zeigen, Tippen, Fokussieren ---
    const beiAbsicht = (ev: Event) => {
      const a = (ev.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      const ziel = fadenZiel(a);
      if (ziel) holen(ziel);
    };
    document.addEventListener("pointerover", beiAbsicht, { passive: true });
    document.addEventListener("touchstart", beiAbsicht, { passive: true });
    document.addEventListener("focusin", beiAbsicht, { passive: true });

    // --- Vorrat: was im Strom sichtbar wird ---
    let io: IntersectionObserver | null = null;
    let mo: MutationObserver | null = null;
    if (!sparsam() && "IntersectionObserver" in window) {
      io = new IntersectionObserver((eintraege) => {
        for (const e of eintraege) {
          if (!e.isIntersecting) continue;
          io?.unobserve(e.target);
          const ziel = fadenZiel(e.target as HTMLAnchorElement);
          if (ziel && !schonGeholt(ziel)) warteschlange.push(ziel);
        }
        if (warteschlange.length) anstossen();
      }, { rootMargin: "200px" });

      const beobachten = () => {
        const strom = document.getElementById("strom");
        if (!strom || !io) return;
        // Nur das lebende Kapitel — eingefrorene Kapitel sind Verlauf, dorthin klickt
        // niemand auf Verdacht.
        strom.querySelectorAll<HTMLAnchorElement>(".kapitel--live a[href]").forEach((a) => io!.observe(a));
      };
      beobachten();
      mo = new MutationObserver(() => beobachten());
      const strom = document.getElementById("strom");
      if (strom) mo.observe(strom, { childList: true, subtree: true });
    }

    return () => {
      abgebaut = true;
      document.removeEventListener("pointerover", beiAbsicht);
      document.removeEventListener("touchstart", beiAbsicht);
      document.removeEventListener("focusin", beiAbsicht);
      io?.disconnect();
      mo?.disconnect();
    };
    // Bei jedem Kapitelwechsel von vorn: neues lebendes Kapitel, neuer Vorrat.
  }, [router, pathname]);
}
