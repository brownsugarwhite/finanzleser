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

export interface TocZeile { id: string; titel: string; typ?: string }
export interface AbschnittStand { titel: string; toc: TocZeile[]; aktiv: string; vorhanden: boolean }

const LEER: AbschnittStand = { titel: "", toc: [], aktiv: "", vorhanden: false };

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
  setzen({ titel: el.dataset.titel || document.title, toc, vorhanden: true, aktiv: toc[0]?.id || "" });
  if (!("IntersectionObserver" in window) || !toc.length) return;
  io = new IntersectionObserver((es) => {
    let neu = stand.aktiv;
    es.forEach((x) => { if (x.isIntersecting && x.target.id) neu = x.target.id; });
    if (neu !== stand.aktiv) setzen({ ...stand, aktiv: neu });
  }, { rootMargin: "-30% 0px -55% 0px" });
  toc.forEach((t) => { const n = document.getElementById(t.id); if (n) io!.observe(n); });
}

/** Während die RSC-Antwort strömt, feuert der MutationObserver oft — auf einen Frame bündeln. */
function anstossen() {
  if (geplant) return;
  geplant = requestAnimationFrame(() => { geplant = 0; pruefen(); });
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
      pruefen();
    }
    return () => {
      nutzer -= 1;
      if (nutzer) return;
      mo?.disconnect(); mo = null;
      io?.disconnect(); io = null;
      if (geplant) { cancelAnimationFrame(geplant); geplant = 0; }
      signatur = "";
      stand = LEER;
    };
  }, []);

  return wert;
}
