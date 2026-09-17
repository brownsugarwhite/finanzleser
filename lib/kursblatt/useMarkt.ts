"use client";

/**
 * Die Marktzahlen zu den EINGABEN eines Rechners — einmal geholt, zweimal gebraucht.
 *
 * `/api/vergleich-daten/<slug>?kurz=1&…` liefert für genau diese Eingaben, was der
 * Vergleich dazu sagt: bestes Angebot, Durchschnitt, Anzahl. Der Rechner braucht das an
 * zwei Stellen — in den Säulen des Ergebnisses („Ihre Rate im Marktvergleich") und im
 * Satz der Brücke darunter.
 *
 * 🚨 Deshalb hängt der Abruf HIER und nicht in der Brücke. Stand er dort, hatte das
 * Ergebnis keinen Zugriff darauf: die Säulen blieben leer, obwohl die Zahlen zwei
 * Bauteile weiter schon geladen waren. Zwei Abrufe wären außerdem zwei Function-Läufe
 * gegen financeads (1–8 s je Lauf) für dieselbe Antwort.
 *
 * 🚨 Antwortet der Partner nicht, bleibt `undefined` stehen — kein Fehler, keine Meldung.
 * Der Leser hat sein Ergebnis längst; was fehlt, ist der Vergleich dazu. Alles, was diese
 * Zahlen benutzt, muss auch ohne sie stehen können.
 */
import { useEffect, useState } from "react";
import type { MarktKurz } from "@/lib/rechner/schema";

export function useMarkt(slug: string | undefined, frage: string): MarktKurz | undefined {
  const [markt, setMarkt] = useState<MarktKurz | undefined>(undefined);

  useEffect(() => {
    if (!slug) { setMarkt(undefined); return; }
    let aktiv = true;
    const abbruch = new AbortController();
    fetch(`/api/vergleich-daten/${encodeURIComponent(slug)}?kurz=1&${frage}`, { signal: abbruch.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: MarktKurz | null) => { if (aktiv && j?.bestwert) setMarkt(j); })
      .catch(() => { /* still — siehe Kopf */ });
    return () => { aktiv = false; abbruch.abort(); };
  }, [slug, frage]);

  return markt;
}
