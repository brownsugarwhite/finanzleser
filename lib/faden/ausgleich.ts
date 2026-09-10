/**
 * Ausgleich für alles, was OBERHALB der Lesestelle seine Höhe ändert.
 *
 * Ein eingefrorenes Kapitel wächst noch, nachdem der Leser längst darunter liest: Die
 * Portale hängen Rechner, Checklisten und Kiosk erst nach dem Nachladen ihrer Chunks ein
 * (gemessen 10.09.2026: +206 und +246 px, zehn Sekunden nach dem Klick), Bilder laden,
 * ein Kapitel klappt zu. Jede dieser Änderungen schiebt alles darunter — und damit den
 * Text unter den Augen des Lesers.
 *
 * Chrome und Firefox haben dafür Scroll Anchoring eingebaut; es griff hier nachweislich
 * nicht (Layout-Shift 0,095 und 0,069 ohne Eingabe), und Safari kennt es gar nicht.
 * Deshalb ausdrücklich: Ein ResizeObserver auf jedem eingefrorenen Kapitel. Ändert sich
 * eine Höhe und lag das Kapitel vor der Änderung ganz über der Lesekante, wird `scrollY`
 * um genau die Differenz nachgeführt — im selben Bild, vor dem Malen. Der Leser merkt
 * nichts.
 *
 * Grenzen, bewusst: Wächst ein Kapitel, in dem der Leser gerade steht, wird nicht
 * ausgeglichen (wo darin gewachsen wurde, weiß der Beobachter nicht). Entfernte Knoten
 * melden keine Größe — wer ein Kapitel aus dem Strom nimmt, gleicht selbst aus
 * (`mitAusgleich` in scrollen.ts).
 */
import { kopfHoehe } from "./scrollen";

let ro: ResizeObserver | null = null;
const bekannt = new Map<Element, number>();

function hoehe(el: Element): number {
  return el.getBoundingClientRect().height;
}

function auswerten(eintraege: ResizeObserverEntry[]): void {
  let summe = 0;
  const kante = kopfHoehe() + 4;
  for (const e of eintraege) {
    const el = e.target;
    const alt = bekannt.get(el);
    const neu = hoehe(el);
    bekannt.set(el, neu);
    if (alt === undefined) continue;              // erste Meldung: nur merken
    const d = neu - alt;
    if (Math.abs(d) < 1) continue;
    // Lag das Kapitel VOR der Änderung ganz über der Lesekante? Dann hat es den Leser
    // verschoben, und zwar um d.
    const untenVorher = el.getBoundingClientRect().bottom - d;
    if (untenVorher <= kante) summe += d;
  }
  if (Math.abs(summe) >= 1) window.scrollBy({ top: summe, behavior: "instant" });
}

/** Ein Kapitel beobachten (Strom.tsx, für jedes eingefrorene). */
export function ausgleichBeobachten(el: Element | null): void {
  if (!el || typeof ResizeObserver === "undefined") return;
  if (!ro) ro = new ResizeObserver(auswerten);
  if (bekannt.has(el)) return;
  bekannt.set(el, hoehe(el));
  ro.observe(el);
}

export function ausgleichVergessen(el: Element | null): void {
  if (!el || !ro) return;
  ro.unobserve(el);
  bekannt.delete(el);
}
