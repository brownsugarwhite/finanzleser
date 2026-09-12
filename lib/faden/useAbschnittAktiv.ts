"use client";

/**
 * Welcher Abschnitt gerade im Lesefenster steht — für das Inhaltsverzeichnis in der Kette
 * und in der linken Randspalte.
 *
 * 🚨 Gemeint ist der Abschnitt des AKTIVEN Kapitels, nicht des lebenden. Wer im Faden
 * hochscrollt und ein älteres, aufgeklapptes Kapitel liest, soll dessen Abschnitte
 * markiert bekommen. Vorher hing alles fest an `#kapitel-live`; das Unter-Verzeichnis
 * funktionierte deshalb nur beim neuesten Ratgeber.
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
  /** `data-key` des lebenden Kapitels (`post:<slug>`, `rechner:<slug>`, `heute` …) — für den Typ-Zusatz im Verlauf. */
  liveKey: string;
}

const LEER: AbschnittStand = { titel: "", toc: [], aktiv: "", vorhanden: false, aktivesKapitel: "kapitel-live", liveKey: "" };

/**
 * 🚨 Gepinnt: Während einer Navigation und während des Sprungs zum neuen Kapitel gilt
 * nicht die Lesekante, sondern das Ziel. Sonst wanderte die Abschnittsliste im Verlauf
 * während des sanften Scrolls vom eingefrorenen zum neuen Eintrag und zurück (gemessen
 * 10.09.2026: vier bis fünf Umbauten je Navigation). `"skelett"` heißt: kein Kapitel ist
 * aktiv (das Ziel ist noch ein Skelett). Der erste eigene Scroll des Lesers löst den Pin.
 */
let pin: string | null = null;
let pinHoert = false;

function pinLoesen() {
  if (pin === null) return;
  pin = null;
  anstossen();
}

function pinHorchen() {
  if (pinHoert || typeof window === "undefined") return;
  pinHoert = true;
  const opts: AddEventListenerOptions = { passive: true };
  window.addEventListener("wheel", pinLoesen, opts);
  window.addEventListener("touchmove", pinLoesen, opts);
  window.addEventListener("keydown", pinLoesen, opts);
}

/** Aktives Kapitel festhalten (`"skelett"`, eine Element-ID) oder freigeben (`null`). */
export function kapitelPinnen(id: string | null): void {
  pin = id;
  if (id !== null) pinHorchen();
  anstossen();
}

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

/** Neu aufbauen, wenn ein anderes Kapitel aktiv ist oder seine Abschnitte sich geändert haben. */
function pruefen() {
  const live = document.getElementById("kapitel-live");
  const el = aktivesKapitelElement();
  if (!el) {
    if (signatur !== "") { signatur = ""; io?.disconnect(); io = null; setzen(LEER); }
    return;
  }
  const toc = abschnitteLesen(el);
  // Der Titel im Verlauf gehört immer zum LEBENDEN Kapitel; die Abschnitte zum aktiven.
  const liveTitel = live?.dataset.titel || (live ? document.title : "");
  const liveKey = live?.dataset.key || "";
  const neueSignatur = [el.id, liveTitel, liveKey, toc.map((t) => t.id).join(",")].join("|");
  if (neueSignatur === signatur) return;
  signatur = neueSignatur;
  io?.disconnect();
  io = null;
  setzen({ titel: liveTitel, toc, vorhanden: !!live, aktiv: toc[0]?.id || "", aktivesKapitel: el.id, liveKey });
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
 * Die Lesekante entscheidet: das letzte Kapitel, dessen Oberkante sie überschritten hat.
 * Das gilt für eingefrorene Kapitel genauso wie für das lebende — ein
 * IntersectionObserver auf den Abschnitten könnte das nicht beantworten, der kennt immer
 * nur die Abschnitte EINES Kapitels.
 */
function aktivesKapitelElement(): HTMLElement | null {
  const strom = document.getElementById("strom");
  if (!strom) return null;
  if (pin === "skelett") return null;
  if (pin) { const g = document.getElementById(pin); if (g) return g; }
  const kante = kopfHoehe() + 100;
  let treffer: HTMLElement | null = null;
  strom.querySelectorAll<HTMLElement>(".kapitel").forEach((k) => {
    if (k.id && k.getBoundingClientRect().top <= kante) treffer = k;
  });
  return treffer || document.getElementById("kapitel-live");
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
      window.addEventListener("scroll", anstossen, { passive: true });
      pruefen();
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
