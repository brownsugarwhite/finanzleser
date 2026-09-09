"use client";

/**
 * Der Bestandsindex im Browser: einmal je Sitzung holen, dann aus dem Modul-Cache.
 *
 * 🚨 Zwei Stellen brauchen ihn (Sprungleiste in der Eingabe, Öffnen aus dem
 * Aktenkoffer). Die zweite hatte ihn selbst geholt — und die Antwort falsch gelesen:
 * die Route liefert `{ items, total }`, geprüft wurde aber `Array.isArray(liste)`. Das
 * ist immer falsch, der Treffer wurde nie gefunden, und jeder Klick im Aktenkoffer
 * landete auf /suche — bei vollem Download von rund 1.900 Einträgen.
 */
import type { IndexEintrag } from "./index";

let cache: IndexEintrag[] | null = null;
let laedt: Promise<IndexEintrag[]> | null = null;

export function holeIndex(): Promise<IndexEintrag[]> {
  if (cache) return Promise.resolve(cache);
  if (!laedt) {
    laedt = fetch("/api/faden/index")
      .then((r) => r.json())
      .then((j: { items?: IndexEintrag[] }) => { cache = j.items || []; return cache; })
      .catch(() => { laedt = null; return []; });
  }
  return laedt;
}

/** Schon geholt? Dann kann die Sprungleiste ohne Warten rendern. */
export function indexAusCache(): IndexEintrag[] | null {
  return cache;
}
