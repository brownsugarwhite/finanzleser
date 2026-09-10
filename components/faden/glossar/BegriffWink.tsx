"use client";

/**
 * Der Wink auf das erste grüne Wort: ein kurzer, spielerischer Hinweis, dass sich
 * Begriffe antippen lassen.
 *
 * Nach `NACH_MS` bekommt der Begriff die Klasse `begriff--wink` — ein Ring, der zweimal
 * aufgeht (dieselbe Bewegung wie am aktiven Knoten des Fortschritts-Gleises), dazu eine
 * kleine Fahne „antippen". Er verschwindet, sobald der Leser irgendeinen Begriff antippt,
 * und kommt nicht wieder: wer es einmal verstanden hat, braucht den Hinweis nie wieder.
 *
 * 🚨 Das Wort wird bei JEDER Änderung neu gesucht, nie festgehalten. `Begruessung` tippt
 * Leos Text als Schreibmaschine: Das Wort steht im SSR-HTML, verschwindet beim Tippen und
 * kommt am Ende als NEUER Knoten zurück. Ein gemerkter Verweis zeigt danach auf einen
 * abgehängten Knoten — die Klasse landet dann im Nichts. Genau das ist beim ersten
 * Versuch passiert. Deshalb: ein Beobachter am Gruß, und der Wink wird angelegt, sobald
 * das Wort (wieder) dasteht.
 *
 * `prefers-reduced-motion` schaltet die Bewegung ab (app/faden.css), die Fahne bleibt.
 */
import { useEffect } from "react";
import { useFaden } from "@/components/faden/FadenProvider";

/** Ab wann der Wink kommt — lang genug, dass Leo ausgeschrieben hat und der Blick ruht. */
const NACH_MS = 4200;
/** Merker, damit der Wink in einer Sitzung höchstens einmal erscheint. */
const KEY = "faden-wink-gesehen";

export default function BegriffWink({ ziel }: { ziel: string }) {
  const { glossarSitzung } = useFaden();
  const schonBenutzt = glossarSitzung.length > 0;

  useEffect(() => {
    if (schonBenutzt) return;
    try { if (sessionStorage.getItem(KEY)) return; } catch { /* egal */ }
    const gruss = document.querySelector(ziel);
    if (!gruss) return;

    const wort = () => document.querySelector<HTMLElement>(`${ziel} .begriff`);
    let scharf = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const anlegen = () => {
      const w = wort();
      if (!scharf || !w) return;
      w.classList.add("begriff--wink");
      if (!w.querySelector(".wink-spitze")) {
        const spitze = document.createElement("i");
        spitze.className = "wink-spitze";
        spitze.setAttribute("aria-hidden", "true");
        w.appendChild(spitze);
      }
    };
    const abraeumen = (w: HTMLElement | null) => { w?.classList.remove("begriff--wink"); w?.querySelector(".wink-spitze")?.remove(); };
    const ausloesen = () => { scharf = true; timer = null; anlegen(); };

    const aus = () => {
      scharf = false;
      if (timer) { clearTimeout(timer); timer = null; }
      abraeumen(wort());
      try { sessionStorage.setItem(KEY, "1"); } catch { /* egal */ }
    };
    // Ein Tipp auf IRGENDEINEN Begriff beendet den Wink — er hat dann seinen Zweck erfüllt.
    const aufKlick = (e: MouseEvent) => { if ((e.target as Element | null)?.closest?.(".begriff")) aus(); };

    // Der Zähler beginnt, sobald das Wort das erste Mal dasteht; taucht es später neu auf
    // (Schreibmaschine fertig), bekommt der neue Knoten die Klasse nachgereicht.
    const beobachter = new MutationObserver(() => {
      if (!wort()) return;
      if (scharf) anlegen();
      else if (!timer) timer = setTimeout(ausloesen, NACH_MS);
    });
    beobachter.observe(gruss, { childList: true, subtree: true });
    if (wort()) timer = setTimeout(ausloesen, NACH_MS);
    document.addEventListener("click", aufKlick);

    return () => {
      beobachter.disconnect();
      if (timer) clearTimeout(timer);
      document.removeEventListener("click", aufKlick);
      abraeumen(wort());
    };
  }, [ziel, schonBenutzt]);

  // Sobald etwas im Glossar liegt, ist der Wink erledigt.
  useEffect(() => { if (schonBenutzt) { try { sessionStorage.setItem(KEY, "1"); } catch { /* egal */ } } }, [schonBenutzt]);

  return null;
}
