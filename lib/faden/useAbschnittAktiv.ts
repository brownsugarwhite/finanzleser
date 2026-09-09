"use client";

/**
 * Welcher Abschnitt des lebenden Kapitels gerade im Lesefenster steht — für das
 * Inhaltsverzeichnis in der Kette und in der linken Randspalte.
 *
 * 🚨 Ein Beobachter, nicht zwei. Vorher rief jede der beiden Anzeigen den Hook für sich
 * auf: zwei IntersectionObserver über dieselben `[data-toc-titel]`-Knoten und zwei
 * getrennte setState-Ketten bei jeder Scroll-Schwelle. Jetzt hängt der Beobachter an
 * einem Modul-Speicher, an dem sich beide über `useSyncExternalStore` anmelden — es
 * rendern nur die Anzeigen neu, nicht der halbe Faden.
 *
 * 🚨 Ausgelöst wird der Neuaufbau vom DOM, nicht vom Pfad. `usePathname()` wechselt,
 * BEVOR das neue Kapitel im DOM steht (siehe FadenProvider) — ein pfadgebundener Effekt
 * las deshalb das Inhaltsverzeichnis des alten Kapitels und blieb darauf stehen. Ein
 * MutationObserver auf dem Strom merkt, wenn `#kapitel-live` ein anderer Knoten ist oder
 * seine Abschnitte nachgeströmt sind.
 */
import { useEffect, useSyncExternalStore } from "react";
import { kopfHoehe } from "./scrollen";

export interface TocZeile { id: string; titel: string; typ?: string }
export interface AbschnittStand {
  titel: string;
  toc: TocZeile[];
  aktiv: string;
  vorhanden: boolean;
  /** Element-ID des Kapitels, in dem der Leser gerade steht (`kapitel-live` oder `kapitel-alt-<id>`). */
  aktivesKapitel: string;
}

const LEER: AbschnittStand = { titel: "", toc: [], aktiv: "", vorhanden: false, aktivesKapitel: "kapitel-live" };

let stand: AbschnittStand = LEER;
let signatur = "";
let io: IntersectionObserver | null = null;
let mo: MutationObserver | null = null;
let nutzer = 0;
let geplant = 0;
const hoerer = new Set<() => void>();

function melden() { hoerer.forEach((h) => h()); }
function setzen(neu: AbschnittStand) { stand = neu; melden(); }

function abschnitteLesen(el: HTMLElement): TocZeile[] {
  return Array.from(el.querySelectorAll<HTMLElement>("[data-toc-titel]")).map((a) => ({
    id: a.id, titel: a.dataset.tocTitel || "", typ: a.dataset.tocTyp || undefined,
  }));
}

/** Neu aufbauen, wenn sich das lebende Kapitel oder seine Abschnitte geändert haben. */
function pruefen() {
  const el = document.getElementById("kapitel-live");
  if (!el) {
    if (signatur !== "") { signatur = ""; io?.disconnect(); io = null; setzen(LEER); }
    return;
  }
  const toc = abschnitteLesen(el);
  const neueSignatur = (el.dataset.key || el.dataset.titel || "") + "|" + toc.map((t) => t.id).join(",");
  if (neueSignatur === signatur) return;
  signatur = neueSignatur;
  io?.disconnect();
  io = null;
  setzen({ ...stand, titel: el.dataset.titel || document.title, toc, vorhanden: true, aktiv: toc[0]?.id || "" });
  if (!("IntersectionObserver" in window) || !toc.length) return;
  // 🚨 Nicht „der letzte Treffer im Callback" — dessen Reihenfolge ist nicht die
  // Dokumentreihenfolge. Liegen zwei Abschnitte gleichzeitig im Leseband, gewann so mal
  // der eine, mal der andere, und die Markierung hing einen Abschnitt hinterher. Deshalb
  // wird gemerkt, WAS gerade schneidet, und daraus der oberste in Dokumentreihenfolge
  // gewählt — das ist der, den man liest.
  const schneidet = new Set<string>();
  io = new IntersectionObserver((es) => {
    es.forEach((x) => {
      const id = x.target.id;
      if (!id) return;
      if (x.isIntersecting) schneidet.add(id); else schneidet.delete(id);
    });
    const neu = toc.find((t) => schneidet.has(t.id))?.id;
    if (neu && neu !== stand.aktiv) setzen({ ...stand, aktiv: neu });
  }, { rootMargin: "-30% 0px -55% 0px" });
  toc.forEach((t) => { const n = document.getElementById(t.id); if (n) io!.observe(n); });
}

/**
 * In welchem Kapitel steht der Leser gerade?
 *
 * 🚨 Das braucht KEINEN IntersectionObserver: Der Beobachter oben kennt nur die Abschnitte
 * des lebenden Kapitels. Beim Hochscrollen in ein aufgeklapptes Kapitel aus dem Verlauf
 * blieb die Markierung deshalb beim neuesten Eintrag stehen. Hier zählt die simple Frage,
 * welches Kapitel die Lesekante gerade überschritten hat — und die gilt für eingefrorene
 * Kapitel genauso.
 */
function kapitelPruefen(): void {
  const strom = document.getElementById("strom");
  if (!strom) return;
  const kante = kopfHoehe() + 100;
  let treffer = "";
  strom.querySelectorAll<HTMLElement>(".kapitel").forEach((k) => {
    if (k.id && k.getBoundingClientRect().top <= kante) treffer = k.id;
  });
  if (treffer && treffer !== stand.aktivesKapitel) setzen({ ...stand, aktivesKapitel: treffer });
}

/** Während die RSC-Antwort strömt, feuert der MutationObserver oft — auf einen Frame bündeln. */
function anstossen() {
  if (geplant) return;
  geplant = requestAnimationFrame(() => { geplant = 0; pruefen(); kapitelPruefen(); });
}

function anmelden(h: () => void): () => void {
  hoerer.add(h);
  return () => { hoerer.delete(h); };
}

function jetzt(): AbschnittStand { return stand; }
function serverStand(): AbschnittStand { return LEER; }

export function useAbschnittAktiv(): AbschnittStand {
  const wert = useSyncExternalStore(anmelden, jetzt, serverStand);

  useEffect(() => {
    nutzer += 1;
    if (nutzer === 1) {
      const strom = document.getElementById("strom");
      if (strom) { mo = new MutationObserver(anstossen); mo.observe(strom, { childList: true, subtree: true }); }
      window.addEventListener("scroll", anstossen, { passive: true });
      pruefen();
      kapitelPruefen();
    }
    return () => {
      nutzer -= 1;
      if (nutzer) return;
      window.removeEventListener("scroll", anstossen);
      mo?.disconnect(); mo = null;
      io?.disconnect(); io = null;
      if (geplant) { cancelAnimationFrame(geplant); geplant = 0; }
      signatur = "";
      stand = LEER;
    };
  }, []);

  return wert;
}
