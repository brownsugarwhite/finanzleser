/**
 * Die Scroll-Grammatik des Fadens — Portierung aus dem Prototyp
 * (`docs/prototype/src/03-js-core.html`: `folgt`, `zeigeAnfang`, `anhaengen`, `kopfH`).
 *
 * 🚨 Der Kern, der in der Umsetzung fehlte: **Der Faden scrollt nicht bei jedem neuen
 * Inhalt, sondern nur, wenn der Leser am Ende steht.** Wer hochgescrollt etwas liest,
 * wird von einer eintreffenden Leo-Antwort nicht weggerissen. Genau das lässt den
 * Faden sonst „anders anfühlen" als die Vorlage.
 *
 * Drei Regeln, unverändert aus dem Prototyp übernommen:
 *
 *  1. `folgt()` — steht der Leser noch am Ende? Gemessen am zuletzt angehängten Knoten:
 *     dessen Unterkante muss im Bild sein (`<= innerHeight + 60`) und darf nicht schon
 *     oben herausgescrollt sein (`> 0`).
 *  2. `zeigeAnfang(node)` — rollt den Knoten unter den Kopf, aber **nur wenn nötig**:
 *     ist er ohnehin ganz sichtbar, passiert nichts. Große Knoten (> halbe Fensterhöhe)
 *     oder solche, die über den Kopf ragen, bekommen ein `scrollTo`; kleine, die nur
 *     knapp aus dem Bild ragen, ein sanftes `scrollIntoView({ block: "nearest" })`.
 *  3. `immer = true` überspringt beide Prüfungen — für Sprünge, die der Leser selbst
 *     ausgelöst hat (Navigation, eigene Frage). Dort merkt sich der Provider vorher
 *     die Lesestelle, damit der Rücksprung möglich bleibt.
 *
 * `prefers-reduced-motion` schaltet auf `auto` statt `smooth`, wie im Prototyp.
 */

/** Höhe des Zeitungskopfes; Fallback 64 px wie im Prototyp (`kopfH`). */
export function kopfHoehe(): number {
  if (typeof document === "undefined") return 64;
  const k = document.getElementById("kopf");
  return k ? k.offsetHeight : 64;
}

function reduziert(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Der zuletzt an den Faden angehängte Knoten. Bezugspunkt für `folgt()` — am
 * globalThis, damit Modul-Neuladen im Dev-Server den Stand nicht zurücksetzt.
 */
function stand(): { letzter: HTMLElement | null } {
  const g = globalThis as typeof globalThis & { __fadenScroll?: { letzter: HTMLElement | null } };
  if (!g.__fadenScroll) g.__fadenScroll = { letzter: null };
  return g.__fadenScroll;
}

/** Knoten als „zuletzt angehängt" merken (Prototyp: `letzterKnoten` in `anhaengen`). */
export function merkeKnoten(node: HTMLElement | null): void {
  stand().letzter = node;
}

/**
 * Steht der Leser noch am Ende des Fadens? (Prototyp: `folgt`)
 *
 * Ohne bekannten letzten Knoten gilt „ja" — dann gibt es nichts, wovon der Leser
 * weggerissen werden könnte.
 */
export function folgt(): boolean {
  const letzter = stand().letzter;
  if (!letzter || !document.contains(letzter)) return true;
  const r = letzter.getBoundingClientRect();
  return r.bottom <= window.innerHeight + 60 && r.bottom > 0;
}

/**
 * Knoten unter den Kopf rollen (Prototyp: `zeigeAnfang`).
 *
 * @param node   Ziel
 * @param immer  Prüfungen überspringen (vom Leser ausgelöster Sprung)
 */
export function zeigeAnfang(node: HTMLElement | null, immer = false): void {
  if (!node) return;
  // setTimeout(0) wie im Prototyp: erst nach dem Layout messen, sonst stimmt das Rechteck
  // bei gerade eingefügten Knoten noch nicht.
  setTimeout(() => {
    const r = node.getBoundingClientRect();
    const oben = kopfHoehe() + 12;
    const verhalten: ScrollBehavior = reduziert() ? "auto" : "smooth";
    if (!immer && r.top >= oben && r.bottom <= window.innerHeight) return;   // schon ganz im Bild
    if (immer || r.height > window.innerHeight * 0.5 || r.top < oben) {
      window.scrollTo({ top: Math.max(0, window.scrollY + r.top - oben), behavior: verhalten });
    } else {
      node.scrollIntoView({ block: "nearest", behavior: verhalten });
    }
  }, 0);
}

/**
 * Einen neu angehängten Knoten behandeln (Prototyp: `anhaengen`).
 *
 * @param opts.immer  Sprung erzwingen
 * @param opts.leise  gar nicht scrollen (Prototyp: `leise`)
 */
export function angehaengt(node: HTMLElement | null, opts: { immer?: boolean; leise?: boolean } = {}): void {
  if (!node) return;
  const darf = opts.immer || folgt();
  merkeKnoten(node);
  if (darf && !opts.leise) zeigeAnfang(node, !!opts.immer);
}
