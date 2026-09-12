"use client";

/**
 * Leo am Ende der Startseite: ein Satz, darunter die Vergleiche, die sich für diesen
 * Leser lohnen.
 *
 * Wer den Kassensturz gemacht hat, sieht die Vergleiche aus seinen eigenen Lücken —
 * derselbe Rechenweg wie im Ergebnis (`ergebnis()`), nur auf die Vergleichslinks
 * eingedampft. Ohne Kassensturz stehen die vier meistgesuchten Policen da.
 *
 * 🚨 Leo tippt hier NICHT. Die Schreibmaschine gehört dem Gruß ganz oben; ein zweites
 * Tippen wäre genau die Verzögerung, die seit dem 12.09.2026 weg sein soll.
 *
 * 🚨 Server und erster Client-Render zeigen immer die Rückfallliste
 * (`useSyncExternalStore` mit `serverLesen → null`) — sonst flackerte der Block bei der
 * Hydration. Es sind stets gleich viele Chips, der Tausch kostet also keinen Sprung, und
 * er passiert weit unter der Faltung.
 *
 * 🚨 `storage` feuert nur zwischen Tabs. Auf der Startseite steht der Kassensturz auf
 * derselben Seite, deshalb hört die Komponente zusätzlich auf `KS_EREIGNIS`.
 */
import { useSyncExternalStore } from "react";
import { useFaden } from "@/components/faden/FadenProvider";
import { LeoRede } from "@/components/faden/leo/Blase";
import { KS_EREIGNIS, KS_SPEICHER, ergebnis, type Antworten } from "@/components/faden/kassensturz/logik";
import type { KassensturzDaten } from "@/lib/faden/optionen";
import type { Ziel } from "@/components/faden/kassensturz/Kassensturz";

export interface Empfehlung { titel: string; href: string }

function abonnieren(cb: () => void): () => void {
  window.addEventListener("storage", cb);
  document.addEventListener(KS_EREIGNIS, cb);
  return () => { window.removeEventListener("storage", cb); document.removeEventListener(KS_EREIGNIS, cb); };
}
function lesen(): string | null {
  try { return localStorage.getItem(KS_SPEICHER); } catch { return null; }
}
function serverLesen(): string | null {
  return null;
}

/** Vergleiche aus den Lücken des Kassensturzes, in der Reihenfolge des Ergebnisses. */
function ausKassensturz(roh: string | null, daten: KassensturzDaten | null, ziele: Record<string, Ziel>, anzahl: number): Empfehlung[] {
  if (!roh || !daten) return [];
  let antworten: Antworten | null = null;
  try {
    const s = JSON.parse(roh) as { antworten?: Antworten; fertig?: boolean };
    if (s?.fertig && s.antworten) antworten = s.antworten;
  } catch { return []; }
  if (!antworten) return [];
  const aus: Empfehlung[] = [];
  for (const l of ergebnis(daten, antworten).luecken) {
    for (const x of l.links) {
      if (x.typ !== "vergleich") continue;
      const z = ziele[`vergleich:${x.slug}`];
      if (z && !aus.some((a) => a.href === z.href)) aus.push({ titel: z.titel, href: z.href });
      if (aus.length >= anzahl) return aus;
    }
  }
  return aus;
}

export default function LeoEmpfiehlt({ gaengig, daten, ziele }: { gaengig: Empfehlung[]; daten: KassensturzDaten | null; ziele: Record<string, Ziel> }) {
  const { navigieren } = useFaden();
  const roh = useSyncExternalStore(abonnieren, lesen, serverLesen);
  const eigene = ausKassensturz(roh, daten, ziele, gaengig.length);
  // Immer gleich viele Chips: die eigenen zuerst, mit den gängigen aufgefüllt.
  const liste = eigene.length
    ? [...eigene, ...gaengig.filter((g) => !eigene.some((e) => e.href === g.href))].slice(0, gaengig.length)
    : gaengig;
  if (!liste.length) return null;

  const satz = eigene.length
    ? "Nach Ihrem Kassensturz lohnen sich diese Vergleiche zuerst. Ich zeige Ihnen die Tarife nebeneinander — mit Quelle und Stand."
    : "Das fragen mich Leser am häufigsten. Ich stelle Ihnen die Tarife nebeneinander — mit Quelle und Stand.";

  return (
    <div className="wort wort--leo leo-empfiehlt" id="leo-empfiehlt">
      <span className="kicker kicker--gruen">Leo · Ihr Finanzagent</span>
      <LeoRede text={satz}><p>{satz}</p></LeoRede>
      <div className="leo-empfiehlt__reihe">
        {liste.map((v) => (
          <button key={v.href} type="button" className="chip chip--leo" onClick={() => navigieren(v.href)}>
            <i className="dot dot--vergleich" aria-hidden="true" />{v.titel}
          </button>
        ))}
      </div>
    </div>
  );
}
