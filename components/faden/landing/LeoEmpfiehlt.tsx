"use client";

/**
 * Leo am Ende der Startseite: ein Satz, darunter die Vergleiche, die sich für diesen
 * Leser lohnen — als Teaser mit Säulen-Marktband (Übergabe „Finanzleser Heute",
 * Baustein 2).
 *
 * 🚨 Die Zeile zeigt seit dem 17.09.2026 nur noch Vergleiche der Klasse A. Die neun
 * Versicherungskategorien der Klasse B liefern von financeads keine Beiträge — Preiszeile
 * und Säulenband hätten dort nichts zu zeigen. Entscheidung des Users. Was vom Kassensturz
 * bleibt: Leos Satz richtet sich weiter nach dem Ergebnis, und ein Vergleich, der in den
 * Lücken vorkommt UND Zahlen hat, rückt in der Zeile nach vorn.
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
import { LeoRede } from "@/components/faden/leo/Blase";
import { KS_EREIGNIS, KS_SPEICHER, ergebnis, type Antworten } from "@/components/faden/kassensturz/logik";
import type { KassensturzDaten } from "@/lib/faden/optionen";
import type { VergleichTeaser } from "@/lib/faden/vergleichTeaser";
import VergleichsTeaser from "./VergleichsTeaser";

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

/** Die Vergleichs-Slugs aus den Lücken des Kassensturzes, in der Reihenfolge des Ergebnisses. */
function luecken(roh: string | null, daten: KassensturzDaten | null): string[] {
  if (!roh || !daten) return [];
  let antworten: Antworten | null = null;
  try {
    const s = JSON.parse(roh) as { antworten?: Antworten; fertig?: boolean };
    if (s?.fertig && s.antworten) antworten = s.antworten;
  } catch { return []; }
  if (!antworten) return [];
  const aus: string[] = [];
  for (const l of ergebnis(daten, antworten).luecken) {
    for (const x of l.links) if (x.typ === "vergleich" && !aus.includes(x.slug)) aus.push(x.slug);
  }
  return aus;
}

export default function LeoEmpfiehlt({ teaser, daten }: { teaser: VergleichTeaser[]; daten: KassensturzDaten | null }) {
  const roh = useSyncExternalStore(abonnieren, lesen, serverLesen);
  const eigene = luecken(roh, daten);
  if (!teaser.length) return null;

  // Ein Vergleich, der in den Lücken vorkommt UND Zahlen hat, rückt nach vorn.
  const vorn = eigene.filter((slug) => teaser.some((t) => t.slug === slug));
  const liste = vorn.length
    ? [...vorn.map((slug) => teaser.find((t) => t.slug === slug)!), ...teaser.filter((t) => !vorn.includes(t.slug))]
    : teaser;

  const satz = eigene.length
    ? "Nach Ihrem Kassensturz lohnen sich diese Vergleiche zuerst. Ich stelle Ihnen die Tarife nebeneinander — der Markt steht schon hier, mit Quelle und Stand."
    : "Das fragen mich Leser am häufigsten. Ich stelle Ihnen die Tarife nebeneinander — der Markt steht schon hier, mit Quelle und Stand.";

  return (
    <div className="wort wort--leo leo-empfiehlt" id="leo-empfiehlt">
      <span className="kicker kicker--gruen">Leo · Ihr Finanzagent</span>
      <LeoRede text={satz}><p>{satz}</p></LeoRede>
      <VergleichsTeaser teaser={liste} />
    </div>
  );
}
