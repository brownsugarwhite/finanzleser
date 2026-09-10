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
