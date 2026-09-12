/**
 * Aufklappen mit Bewegung — und der Blick läuft mit.
 *
 * Regel 3 des Scroll-Plans (docs/PLAN_faden_scroll.md): Nach unten mitlaufen gibt es nur,
 * wenn Leo schreibt oder der Leser etwas aufklappt. Beides hart (`scrollBy` um genau die
 * Differenz), nie weich — ein weicher Scroll je Bild bricht den vorigen ab und ruckelt.
 *
 * `enthuellen` zeigt ein verstecktes Element (`hidden`) und lässt es von 0 auf seine Höhe
 * wachsen; solange es wächst, hält `mitlaufen` seine Unterkante über der Eingabe. Wer das
 * Element wieder schließen will, nimmt `verbergen`. Bei `prefers-reduced-motion` passiert
 * beides sofort.
 */
import { reduzierteBewegung } from "./belohnung";
import { mitlaufen } from "./tippen";

const DAUER = 360;
const KURVE = "cubic-bezier(.22,.61,.36,1)";

export function enthuellen(el: HTMLElement | null, opts: { folgen?: boolean } = {}): Promise<void> {
  if (!el) return Promise.resolve();
  const folgen = opts.folgen !== false;
  el.hidden = false;
  if (reduzierteBewegung() || typeof el.animate !== "function") { if (folgen) mitlaufen(el)(); return Promise.resolve(); }
  const ziel = el.getBoundingClientRect().height;
  if (!ziel) return Promise.resolve();
  el.style.overflow = "hidden";
  const anim = el.animate([{ height: "0px", opacity: 0 }, { height: `${ziel}px`, opacity: 1 }], { duration: DAUER, easing: KURVE });
  const nach = mitlaufen(el);
  let lauf = 0;
  const takt = () => { if (folgen) nach(); lauf = requestAnimationFrame(takt); };
  lauf = requestAnimationFrame(takt);
  // Die Uhr entscheidet, nicht `finished` — im verborgenen Tab tickt kein Bild.
  return new Promise((fertig) => {
    const ende = () => { cancelAnimationFrame(lauf); try { anim.cancel(); } catch { /* egal */ } el.style.overflow = ""; if (folgen) nach(); fertig(); };
    anim.addEventListener("finish", ende, { once: true });
    setTimeout(ende, DAUER + 80);
  });
}

export function verbergen(el: HTMLElement | null): Promise<void> {
  if (!el || el.hidden) return Promise.resolve();
  if (reduzierteBewegung() || typeof el.animate !== "function") { el.hidden = true; return Promise.resolve(); }
  const von = el.getBoundingClientRect().height;
  el.style.overflow = "hidden";
  const anim = el.animate([{ height: `${von}px`, opacity: 1 }, { height: "0px", opacity: 0 }], { duration: DAUER * 0.75, easing: KURVE });
  return new Promise((fertig) => {
    const ende = () => { try { anim.cancel(); } catch { /* egal */ } el.style.overflow = ""; el.hidden = true; fertig(); };
    anim.addEventListener("finish", ende, { once: true });
    setTimeout(ende, DAUER + 80);
  });
}

/**
 * Den Anker für die Dauer einer Bewegung an seiner Stelle im Fenster halten.
 *
 * 🚨 `mitAusgleich` (lib/faden/scrollen.ts) misst vor und nach einer Änderung — das reicht
 * nur, wenn die Änderung im selben Bild passiert. Fährt eine Höhe über eine halbe Sekunde,
 * wandert der Anker über viele Bilder, und dann muss über ebenso viele Bilder nachgeführt
 * werden. Genau das ist der Fall im Kiosk: Klickt jemand das dritte Blatt an, während das
 * erste offen steht, schrumpft OBERHALB des Klickziels um mehrere hundert Pixel. Die
 * Bilanz des Kapitels ist dabei fast null, `lib/faden/ausgleich.ts` sieht also nichts —
 * die angeklickte Zeile spränge trotzdem unter dem Finger weg.
 *
 * Hart nachführen (Regel 3 des Scroll-Plans), und sobald der Leser selbst scrollt, ist
 * Schluss: sein Scrollen gewinnt.
 */
export function ankerHalten(anker: HTMLElement | null, dauer = DAUER + 60, zielTop?: number): void {
  if (!anker) return;
  const start = anker.getBoundingClientRect().top;
  // Mit Ziel wandert der Anker über dieselbe Zeit an seine neue Stelle, statt stehen zu
  // bleiben: die Bewegung der Höhe und die des Blicks sind dann EINE Bewegung. Die Kurve
  // ist ein Ease-out wie die des Übergangs (nicht dieselbe Formel, aber derselbe Verlauf —
  // unterwegs ein paar Pixel Unterschied, am Ende auf den Pixel genau).
  const weg = typeof zielTop === "number" ? zielTop - start : 0;
  const wandern = Math.abs(weg) >= 1;
  // 🚨 Ein weiter Weg braucht mehr Zeit, und er beginnt sanft.
  //
  // Mit der Ease-out-Kurve der Höhe war der erste Schritt einer 700-px-Fahrt gemessene
  // 175 px in EINEM Bild — die halbe Strecke lag hinter dem Auge, bevor es folgen konnte.
  // Deshalb hier eine eigene Kurve: sanft an, sanft aus (ease-in-out), und die Dauer
  // wächst mit der Strecke. Die Höhe fährt weiter ihre 420 ms; beide enden weich, und
  // der Blick ist zuletzt da, wo das Blatt steht.
  const laufDauer = reduzierteBewegung() ? 0 : dauer + (wandern ? Math.min(280, Math.abs(weg) * 0.3) : 0);
  const kurve = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
  const soll = (t: number) => (wandern ? start + weg * kurve(t) : start);
  const t0 = performance.now();
  let halten = true;
  const stop = () => { halten = false; };
  const opts: AddEventListenerOptions = { passive: true };
  window.addEventListener("wheel", stop, opts);
  window.addEventListener("touchmove", stop, opts);
  window.addEventListener("keydown", stop, opts);
  let lauf = 0;
  const nach = (t: number) => {
    const d = anker.getBoundingClientRect().top - soll(t);
    if (Math.abs(d) >= 1) window.scrollBy({ top: d, behavior: "instant" });
  };
  const takt = () => {
    const t = laufDauer ? Math.min(1, (performance.now() - t0) / laufDauer) : 1;
    if (!halten || t >= 1) {
      if (halten) nach(1);
      cancelAnimationFrame(lauf);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
      window.removeEventListener("keydown", stop);
      return;
    }
    nach(t);
    lauf = requestAnimationFrame(takt);
  };
  lauf = requestAnimationFrame(takt);
}
